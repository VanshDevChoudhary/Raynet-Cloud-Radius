import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type {
  CreateSubscriberInput,
  UpdateSubscriberInput,
} from "@/lib/validations/subscriber.schema";
import type { Prisma, SubscriberStatus } from "@/generated/prisma";
import { radiusService } from "./radius.service";
import { buildRadiusUsername, buildMikroTikRateLimit } from "@/lib/radius-utils";

export interface SubscriberListParams {
  tenantId: string;
  search?: string;
  status?: string;
  planId?: string;
  nasDeviceId?: string;
  locationId?: string;
  connectionType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const subscriberService = {
  async list(params: SubscriberListParams) {
    const {
      tenantId,
      search,
      status,
      planId,
      nasDeviceId,
      locationId,
      connectionType,
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const where: Prisma.SubscriberWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status as SubscriberStatus;
    if (planId) where.planId = planId;
    if (nasDeviceId) where.nasDeviceId = nasDeviceId;
    if (locationId) where.locationId = locationId;
    if (connectionType) where.connectionType = connectionType as Prisma.EnumConnectionTypeFilter["equals"];

    const [data, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true, downloadSpeed: true, uploadSpeed: true, speedUnit: true } },
          nasDevice: { select: { id: true, name: true, nasIp: true } },
          location: { select: { id: true, name: true, type: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subscriber.count({ where }),
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
  },

  async getById(tenantId: string, id: string) {
    return prisma.subscriber.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        plan: true,
        nasDevice: { include: { location: true } },
        location: true,
      },
    });
  },

  async create(tenantId: string, input: CreateSubscriberInput) {
    const passwordHash = await bcrypt.hash(input.password, 12);

    const subscriber = await prisma.subscriber.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        alternatePhone: input.alternatePhone || null,
        address: input.address || null,
        gpsCoordinates: input.gpsCoordinates || null,
        subscriberType: input.subscriberType,
        connectionType: input.connectionType,
        username: input.username,
        passwordHash,
        planId: input.planId ?? null,
        nasDeviceId: input.nasDeviceId ?? null,
        locationId: input.locationId ?? null,
        macAddress: input.macAddress || null,
        ipAddress: input.ipAddress || null,
        staticIp: input.staticIp || null,
        installationDate: input.installationDate ? new Date(input.installationDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        lastRenewalDate: new Date(),
        status: input.status,
        notes: input.notes || null,
        autoRenewal: input.autoRenewal ?? false,
      },
    });

    // Sync to RADIUS
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      await radiusService.syncSubscriberAuth(tenant.slug, subscriber, input.password);

      // Sync reply attributes (static IP)
      await radiusService.syncSubscriberReplyAttributes(tenant.slug, subscriber);

      if (subscriber.status === "ACTIVE") {
        // Active subscriber — enable RADIUS and assign plan
        if (subscriber.planId) {
          await radiusService.syncSubscriberPlan(
            tenant.slug,
            subscriber.username,
            subscriber.planId
          );
        }
      } else {
        // Non-active subscriber — block RADIUS access from the start
        await radiusService.disableSubscriberRadius(tenant.slug, subscriber.username);
      }
    } catch (error) {
      console.error("[SUBSCRIBER] RADIUS sync failed on create:", error);
      // Continue - don't block subscriber creation
    }

    return subscriber;
  },

  async update(tenantId: string, id: string, input: UpdateSubscriberInput) {
    const existing = await prisma.subscriber.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new Error("Subscriber not found");

    const data: Prisma.SubscriberUncheckedUpdateInput = {
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      alternatePhone: input.alternatePhone || null,
      address: input.address || null,
      gpsCoordinates: input.gpsCoordinates || null,
      subscriberType: input.subscriberType,
      connectionType: input.connectionType,
      username: input.username,
      planId: input.planId ?? null,
      nasDeviceId: input.nasDeviceId ?? null,
      locationId: input.locationId ?? null,
      macAddress: input.macAddress || null,
      ipAddress: input.ipAddress || null,
      staticIp: input.staticIp || null,
      installationDate: input.installationDate ? new Date(input.installationDate) : null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      status: input.status,
      notes: input.notes || null,
      autoRenewal: input.autoRenewal,
    };

    // Only update password if provided
    if (input.password) {
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }

    const updated = await prisma.subscriber.update({
      where: { id },
      data,
    });

    // Sync to RADIUS
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      // Sync password, expiration, and MAC binding
      await radiusService.syncSubscriberAuth(tenant.slug, updated, input.password || undefined);

      // Sync reply attributes (static IP)
      await radiusService.syncSubscriberReplyAttributes(tenant.slug, updated);

      if (updated.status === "ACTIVE") {
        // Ensure access is enabled
        await radiusService.enableSubscriberRadius(tenant.slug, updated);
        await radiusService.syncSubscriberPlan(
          tenant.slug,
          updated.username,
          updated.planId
        );

        // If plan changed and subscriber is online, send CoA with new rate limit
        const planChanged = existing.planId !== updated.planId;
        if (planChanged && updated.planId) {
          const newPlan = await prisma.plan.findUnique({ where: { id: updated.planId } });
          if (newPlan) {
            const activeSessions = await radiusService.getUserActiveSessions(
              tenant.slug,
              updated.username
            );
            const rateLimit = buildMikroTikRateLimit(newPlan);

            for (const session of activeSessions) {
              // Get NAS secret for CoA
              const nas = await prisma.nasDevice.findFirst({
                where: { tenantId, nasIp: session.nasipaddress },
              });
              if (nas) {
                await radiusService.changeUserBandwidth(
                  session.nasipaddress,
                  buildRadiusUsername(tenant.slug, updated.username),
                  nas.secret,
                  rateLimit
                );
              }
            }
          }
        }
      } else {
        // Non-active — block RADIUS access
        await radiusService.disableSubscriberRadius(tenant.slug, updated.username);
      }
    } catch (error) {
      console.error("[SUBSCRIBER] RADIUS sync failed on update:", error);
    }

    return updated;
  },

  async updateStatus(tenantId: string, id: string, status: SubscriberStatus) {
    const existing = await prisma.subscriber.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { nasDevice: true },
    });
    if (!existing) throw new Error("Subscriber not found");

    const updated = await prisma.subscriber.update({
      where: { id },
      data: { status },
    });

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      if (status === "ACTIVE") {
        // Reactivating — enable RADIUS access and restore plan mapping
        await radiusService.enableSubscriberRadius(tenant.slug, updated);
        if (updated.planId) {
          await radiusService.syncSubscriberPlan(
            tenant.slug,
            updated.username,
            updated.planId
          );
        }
      } else {
        // EXPIRED/SUSPENDED/DISABLED — block RADIUS access
        await radiusService.disableSubscriberRadius(tenant.slug, existing.username);

        // Disconnect active sessions
        if (existing.nasDevice) {
          await radiusService.disconnectAllUserSessions(
            tenant.slug,
            existing.username,
            existing.nasDevice.secret
          );
        }
      }
    } catch (error) {
      console.error("[SUBSCRIBER] RADIUS sync failed on status change:", error);
    }

    return updated;
  },

  async softDelete(tenantId: string, id: string) {
    const existing = await prisma.subscriber.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) throw new Error("Subscriber not found");

    const deleted = await prisma.subscriber.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DISABLED" },
    });

    // Remove from RADIUS
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      await radiusService.removeSubscriberAuth(tenant.slug, existing.username);
    } catch (error) {
      console.error("[SUBSCRIBER] RADIUS cleanup failed on delete:", error);
    }

    return deleted;
  },

  async getStats(tenantId: string) {
    const [total, active, expired, disabled, suspended] = await Promise.all([
      prisma.subscriber.count({ where: { tenantId, deletedAt: null } }),
      prisma.subscriber.count({ where: { tenantId, deletedAt: null, status: "ACTIVE" } }),
      prisma.subscriber.count({ where: { tenantId, deletedAt: null, status: "EXPIRED" } }),
      prisma.subscriber.count({ where: { tenantId, deletedAt: null, status: "DISABLED" } }),
      prisma.subscriber.count({ where: { tenantId, deletedAt: null, status: "SUSPENDED" } }),
    ]);

    return { total, active, expired, disabled, suspended };
  },

  async bulkCreate(
    tenantId: string,
    subscribers: CreateSubscriberInput[]
  ): Promise<{
    created: number;
    failed: number;
    errors: Array<{ row: number; username: string; error: string }>;
  }> {
    const results = {
      created: 0,
      failed: 0,
      errors: [] as Array<{ row: number; username: string; error: string }>,
    };

    for (let i = 0; i < subscribers.length; i++) {
      const input = subscribers[i];
      try {
        await this.create(tenantId, input);
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          username: input.username,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },

  async exportAll(tenantId: string) {
    return prisma.subscriber.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        plan: { select: { name: true } },
        nasDevice: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
