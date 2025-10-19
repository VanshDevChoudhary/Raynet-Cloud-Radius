import { prisma } from "@/lib/prisma";
import {
  buildMikroTikRateLimit,
  buildRadiusUsername,
  buildRadiusGroupname,
  planToRadiusAttributes,
} from "@/lib/radius-utils";
import { sendCoaDisconnect, sendCoaChangeRate } from "@/lib/radius-client";
import type { Subscriber, Plan, NasDevice, Prisma } from "@/generated/prisma";

export interface SessionHistoryParams {
  tenantSlug: string;
  subscriberUsername?: string;
  nasIp?: string;
  startDate?: Date;
  endDate?: Date;
  onlyActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const radiusService = {
  // FreeRADIUS Expiration format: "Mon DD YYYY HH:MM:SS"
  formatRadiusExpiration(date: Date): string {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} 23:59:59`;
  },

  // Syncs password, Expiration, and MAC binding (Calling-Station-Id) to radcheck
  async syncSubscriberAuth(
    tenantSlug: string,
    subscriber: Subscriber,
    cleartextPassword?: string
  ): Promise<void> {
    const radiusUsername = buildRadiusUsername(tenantSlug, subscriber.username);

    try {
      await prisma.$transaction(async (tx) => {
        // Sync password if provided
        if (cleartextPassword) {
          await tx.radCheck.deleteMany({
            where: { username: radiusUsername, attribute: "Cleartext-Password" },
          });
          await tx.radCheck.create({
            data: {
              username: radiusUsername,
              attribute: "Cleartext-Password",
              op: ":=",
              value: cleartextPassword,
            },
          });
        }

        // Sync Expiration attribute
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername, attribute: "Expiration" },
        });
        if (subscriber.expiryDate) {
          await tx.radCheck.create({
            data: {
              username: radiusUsername,
              attribute: "Expiration",
              op: ":=",
              value: this.formatRadiusExpiration(subscriber.expiryDate),
            },
          });
        }

        // Sync Calling-Station-Id (MAC binding)
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername, attribute: "Calling-Station-Id" },
        });
        if (subscriber.macAddress) {
          await tx.radCheck.create({
            data: {
              username: radiusUsername,
              attribute: "Calling-Station-Id",
              op: ":=",
              value: subscriber.macAddress.toUpperCase(),
            },
          });
        }
      });

      console.log(
        `[RADIUS] Synced auth for ${radiusUsername} (subscriber: ${subscriber.id})`
      );
    } catch (error) {
      console.error(`[RADIUS] Failed to sync auth for ${radiusUsername}:`, error);
      throw error;
    }
  },

  // Removes Auth-Type Reject and restores radusergroup mapping
  async enableSubscriberRadius(
    tenantSlug: string,
    subscriber: Subscriber
  ): Promise<void> {
    const radiusUsername = buildRadiusUsername(tenantSlug, subscriber.username);

    try {
      await prisma.$transaction(async (tx) => {
        // Remove Auth-Type Reject (unblock authentication)
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername, attribute: "Auth-Type" },
        });

        // Update Expiration if subscriber has one
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername, attribute: "Expiration" },
        });
        if (subscriber.expiryDate) {
          await tx.radCheck.create({
            data: {
              username: radiusUsername,
              attribute: "Expiration",
              op: ":=",
              value: this.formatRadiusExpiration(subscriber.expiryDate),
            },
          });
        }

        // Sync Calling-Station-Id (MAC binding)
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername, attribute: "Calling-Station-Id" },
        });
        if (subscriber.macAddress) {
          await tx.radCheck.create({
            data: {
              username: radiusUsername,
              attribute: "Calling-Station-Id",
              op: ":=",
              value: subscriber.macAddress.toUpperCase(),
            },
          });
        }

        // Restore radusergroup mapping if subscriber has a plan
        if (subscriber.planId) {
          const groupname = buildRadiusGroupname(tenantSlug, subscriber.planId);
          const existing = await tx.radUserGroup.findFirst({
            where: { username: radiusUsername },
          });
          if (!existing) {
            await tx.radUserGroup.create({
              data: { username: radiusUsername, groupname, priority: 1 },
            });
          }
        }
      });

      console.log(`[RADIUS] Enabled access for ${radiusUsername}`);
    } catch (error) {
      console.error(`[RADIUS] Failed to enable access for ${radiusUsername}:`, error);
      throw error;
    }
  },

  // Auth-Type Reject forces Access-Reject; also strips radusergroup so
  // no plan attributes leak even if auth somehow passes
  async disableSubscriberRadius(
    tenantSlug: string,
    username: string
  ): Promise<void> {
    const radiusUsername = buildRadiusUsername(tenantSlug, username);

    try {
      await prisma.$transaction(async (tx) => {
        // Add Auth-Type = Reject to force Access-Reject
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername, attribute: "Auth-Type" },
        });
        await tx.radCheck.create({
          data: {
            username: radiusUsername,
            attribute: "Auth-Type",
            op: ":=",
            value: "Reject",
          },
        });

        // Remove radusergroup — no plan attributes even if auth somehow passes
        await tx.radUserGroup.deleteMany({
          where: { username: radiusUsername },
        });
      });

      console.log(`[RADIUS] Disabled access for ${radiusUsername}`);
    } catch (error) {
      console.error(`[RADIUS] Failed to disable access for ${radiusUsername}:`, error);
      throw error;
    }
  },

  async syncSubscriberPlan(
    tenantSlug: string,
    username: string,
    planId: string | null
  ): Promise<void> {
    const radiusUsername = buildRadiusUsername(tenantSlug, username);

    try {
      await prisma.$transaction(async (tx) => {
        // Remove existing group mappings
        await tx.radUserGroup.deleteMany({
          where: { username: radiusUsername },
        });

        // Add new mapping if plan exists
        if (planId) {
          const groupname = buildRadiusGroupname(tenantSlug, planId);
          await tx.radUserGroup.create({
            data: {
              username: radiusUsername,
              groupname,
              priority: 1,
            },
          });
          console.log(
            `[RADIUS] Mapped ${radiusUsername} to group ${groupname}`
          );
        } else {
          console.log(`[RADIUS] Removed plan mapping for ${radiusUsername}`);
        }
      });
    } catch (error) {
      console.error(
        `[RADIUS] Failed to sync plan mapping for ${radiusUsername}:`,
        error
      );
      throw error;
    }
  },

  // Writes MikroTik-Rate-Limit + Simultaneous-Use to radgroupreply/radgroupcheck
  async syncPlanBandwidth(tenantSlug: string, plan: Plan): Promise<void> {
    const groupname = buildRadiusGroupname(tenantSlug, plan.id);

    try {
      await prisma.$transaction(async (tx) => {
        // Delete existing group reply attributes
        await tx.radGroupReply.deleteMany({
          where: { groupname },
        });

        // Delete existing group check attributes
        await tx.radGroupCheck.deleteMany({
          where: { groupname },
        });

        // Insert reply attributes (bandwidth, pool, session timeout)
        const attributes = planToRadiusAttributes(plan);
        for (const attr of attributes) {
          await tx.radGroupReply.create({
            data: {
              groupname,
              attribute: attr.attribute,
              op: ":=",
              value: attr.value,
              priority: attr.priority,
            },
          });
        }

        // Insert check attributes (Simultaneous-Use)
        await tx.radGroupCheck.create({
          data: {
            groupname,
            attribute: "Simultaneous-Use",
            op: ":=",
            value: String(plan.simultaneousDevices || 1),
          },
        });

        console.log(
          `[RADIUS] Synced plan for group ${groupname} (${attributes.length} reply attrs, Simultaneous-Use=${plan.simultaneousDevices || 1})`
        );
      });
    } catch (error) {
      console.error(
        `[RADIUS] Failed to sync plan bandwidth for ${groupname}:`,
        error
      );
      throw error;
    }
  },

  async removePlanBandwidth(tenantSlug: string, planId: string): Promise<void> {
    const groupname = buildRadiusGroupname(tenantSlug, planId);

    try {
      await prisma.radGroupReply.deleteMany({
        where: { groupname },
      });
      console.log(`[RADIUS] Removed plan bandwidth for group ${groupname}`);
    } catch (error) {
      console.error(
        `[RADIUS] Failed to remove plan bandwidth for ${groupname}:`,
        error
      );
      throw error;
    }
  },

  // FreeRADIUS reads the NAS client list from this table
  async syncNasDevice(nas: NasDevice): Promise<void> {
    try {
      await prisma.radNas.upsert({
        where: { nasname: nas.nasIp },
        create: {
          nasname: nas.nasIp,
          shortname: nas.name.substring(0, 32), // NAS shortname has length limit
          type: nas.nasType.toLowerCase(),
          secret: nas.secret,
          description: nas.description || undefined,
        },
        update: {
          shortname: nas.name.substring(0, 32),
          type: nas.nasType.toLowerCase(),
          secret: nas.secret,
          description: nas.description || undefined,
        },
      });

      console.log(`[RADIUS] Synced NAS device ${nas.nasIp} (${nas.name})`);
    } catch (error) {
      console.error(`[RADIUS] Failed to sync NAS device ${nas.nasIp}:`, error);
      throw error;
    }
  },

  async removeNasDevice(nasIp: string): Promise<void> {
    try {
      await prisma.radNas.delete({
        where: { nasname: nasIp },
      });
      console.log(`[RADIUS] Removed NAS device ${nasIp}`);
    } catch (error) {
      // Ignore if already deleted
      if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
        console.log(`[RADIUS] NAS device ${nasIp} already removed`);
      } else {
        console.error(`[RADIUS] Failed to remove NAS device ${nasIp}:`, error);
        throw error;
      }
    }
  },

  async syncSubscriberReplyAttributes(
    tenantSlug: string,
    subscriber: Subscriber
  ): Promise<void> {
    const radiusUsername = buildRadiusUsername(tenantSlug, subscriber.username);

    try {
      await prisma.$transaction(async (tx) => {
        // Sync Framed-IP-Address (static IP assignment)
        await tx.radReply.deleteMany({
          where: { username: radiusUsername, attribute: "Framed-IP-Address" },
        });
        if (subscriber.staticIp) {
          await tx.radReply.create({
            data: {
              username: radiusUsername,
              attribute: "Framed-IP-Address",
              op: ":=",
              value: subscriber.staticIp,
            },
          });
        }
      });

      console.log(`[RADIUS] Synced reply attributes for ${radiusUsername}`);
    } catch (error) {
      console.error(
        `[RADIUS] Failed to sync reply attributes for ${radiusUsername}:`,
        error
      );
      throw error;
    }
  },

  async removeSubscriberAuth(
    tenantSlug: string,
    username: string
  ): Promise<void> {
    const radiusUsername = buildRadiusUsername(tenantSlug, username);

    try {
      await prisma.$transaction([
        prisma.radCheck.deleteMany({ where: { username: radiusUsername } }),
        prisma.radReply.deleteMany({ where: { username: radiusUsername } }),
        prisma.radUserGroup.deleteMany({ where: { username: radiusUsername } }),
      ]);

      console.log(`[RADIUS] Removed subscriber auth for ${radiusUsername}`);
    } catch (error) {
      console.error(
        `[RADIUS] Failed to remove subscriber auth for ${radiusUsername}:`,
        error
      );
      throw error;
    }
  },

  async getOnlineUsers(tenantSlug: string) {
    try {
      return await prisma.radAcct.findMany({
        where: {
          username: { startsWith: `${tenantSlug}_` },
          acctstoptime: null,
        },
        orderBy: { acctstarttime: "desc" },
      });
    } catch (error) {
      console.error(`[RADIUS] Failed to get online users for ${tenantSlug}:`, error);
      throw error;
    }
  },

  async getUserActiveSessions(tenantSlug: string, username: string) {
    const radiusUsername = buildRadiusUsername(tenantSlug, username);

    try {
      return await prisma.radAcct.findMany({
        where: {
          username: radiusUsername,
          acctstoptime: null,
        },
        orderBy: { acctstarttime: "desc" },
      });
    } catch (error) {
      console.error(
        `[RADIUS] Failed to get active sessions for ${radiusUsername}:`,
        error
      );
      throw error;
    }
  },

  async getSessionHistory(params: SessionHistoryParams): Promise<{
    data: Awaited<ReturnType<typeof prisma.radAcct.findMany>>;
    meta: PaginationMeta;
  }> {
    const {
      tenantSlug,
      subscriberUsername,
      nasIp,
      startDate,
      endDate,
      onlyActive = false,
      page = 1,
      pageSize = 50,
    } = params;

    const where: Prisma.RadAcctWhereInput = {
      username: { startsWith: `${tenantSlug}_` },
    };

    // Filter by specific subscriber
    if (subscriberUsername) {
      where.username = buildRadiusUsername(tenantSlug, subscriberUsername);
    }

    // Filter by NAS IP
    if (nasIp) {
      where.nasipaddress = nasIp;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.acctstarttime = {};
      if (startDate) where.acctstarttime.gte = startDate;
      if (endDate) where.acctstarttime.lte = endDate;
    }

    // Filter active sessions only
    if (onlyActive) {
      where.acctstoptime = null;
    }

    try {
      const [data, total] = await Promise.all([
        prisma.radAcct.findMany({
          where,
          orderBy: { acctstarttime: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.radAcct.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error(
        `[RADIUS] Failed to get session history for ${tenantSlug}:`,
        error
      );
      throw error;
    }
  },

  async disconnectUser(
    nasIp: string,
    username: string,
    secret: string
  ): Promise<boolean> {
    try {
      const success = await sendCoaDisconnect({ nasIp, secret, username });

      if (success) {
        console.log(`[RADIUS] Disconnected user ${username} from ${nasIp}`);
      } else {
        console.warn(
          `[RADIUS] Failed to disconnect user ${username} from ${nasIp}`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `[RADIUS] Error disconnecting user ${username} from ${nasIp}:`,
        error
      );
      return false;
    }
  },

  async changeUserBandwidth(
    nasIp: string,
    username: string,
    secret: string,
    rateLimit: string
  ): Promise<boolean> {
    try {
      const success = await sendCoaChangeRate({
        nasIp,
        secret,
        username,
        rateLimit,
      });

      if (success) {
        console.log(
          `[RADIUS] Changed bandwidth for ${username} on ${nasIp} to ${rateLimit}`
        );
      } else {
        console.warn(
          `[RADIUS] Failed to change bandwidth for ${username} on ${nasIp}`
        );
      }

      return success;
    } catch (error) {
      console.error(
        `[RADIUS] Error changing bandwidth for ${username} on ${nasIp}:`,
        error
      );
      return false;
    }
  },

  async disconnectAllUserSessions(
    tenantSlug: string,
    username: string,
    nasSecret: string
  ): Promise<number> {
    const activeSessions = await this.getUserActiveSessions(
      tenantSlug,
      username
    );

    let disconnected = 0;

    for (const session of activeSessions) {
      const radiusUsername = buildRadiusUsername(tenantSlug, username);
      const success = await this.disconnectUser(
        session.nasipaddress,
        radiusUsername,
        nasSecret
      );

      if (success) disconnected++;
    }

    console.log(
      `[RADIUS] Disconnected ${disconnected}/${activeSessions.length} sessions for ${username}`
    );

    return disconnected;
  },

  // Stale = no interim-update for N minutes (default 15 = 3 missed at 5 min interval)
  async cleanupStaleSessions(tenantSlug?: string, staleThresholdMinutes = 15): Promise<number> {
    try {
      const threshold = new Date(Date.now() - staleThresholdMinutes * 60 * 1000);

      const where: Prisma.RadAcctWhereInput = {
        acctstoptime: null,
        OR: [
          // Last update is older than threshold
          { acctupdatetime: { lt: threshold } },
          // No updates at all and session started before threshold
          { acctupdatetime: null, acctstarttime: { lt: threshold } },
        ],
      };

      if (tenantSlug) {
        where.username = { startsWith: `${tenantSlug}_` };
      }

      const result = await prisma.radAcct.updateMany({
        where,
        data: {
          acctstoptime: new Date(),
          acctterminatecause: "Stale-Session",
        },
      });

      if (result.count > 0) {
        console.log(`[RADIUS] Cleaned up ${result.count} stale sessions`);
      }

      return result.count;
    } catch (error) {
      console.error("[RADIUS] Failed to cleanup stale sessions:", error);
      throw error;
    }
  },
};
