import { Worker } from "bullmq";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";
import { notificationQueue } from "../queue";
import { radiusService } from "@/services/radius.service";
import { buildRadiusUsername } from "@/lib/radius-utils";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/**
 * Billing Worker
 * Processes jobs related to billing, invoicing, and subscriber lifecycle
 */
export const billingWorker = new Worker(
  "billing",
  async (job) => {
    console.log(`[Billing Worker] Processing job: ${job.name}`);

    if (job.name === "check-expiring-subscribers") {
      await checkExpiringSubscribers();
    } else if (job.name === "disable-expired-subscribers") {
      await disableExpiredSubscribers();
    } else if (job.name === "cleanup-stale-sessions") {
      await cleanupStaleSessions();
    }

    console.log(`[Billing Worker] Job ${job.name} completed`);
  },
  { connection }
);

/**
 * Check for subscribers expiring in 3, 1, 0 days
 * Queue notifications for each
 */
async function checkExpiringSubscribers() {
  console.log("[Expiry Check] Starting expiry check...");

  const tenants = await prisma.tenant.findMany({
    where: { status: { not: "SUSPENDED" } },
    select: { id: true, slug: true },
  });

  let totalNotifications = 0;

  for (const tenant of tenants) {
    // Check for subscribers expiring in 3, 1, 0 days
    const checkDays = [3, 1, 0];

    for (const days of checkDays) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const subscribers = await prisma.subscriber.findMany({
        where: {
          tenantId: tenant.id,
          status: "ACTIVE",
          expiryDate: {
            gte: targetDate,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          expiryDate: true,
        },
      });

      console.log(
        `[Expiry Check] Tenant ${tenant.slug}: Found ${subscribers.length} subscribers expiring in ${days} day(s)`
      );

      // Queue notification for each subscriber
      for (const subscriber of subscribers) {
        await notificationQueue.add("send-expiry-reminder", {
          subscriberId: subscriber.id,
          tenantId: tenant.id,
          type: "expiry-reminder",
          daysUntilExpiry: days,
        });
        totalNotifications++;
      }
    }
  }

  console.log(
    `[Expiry Check] Completed. Queued ${totalNotifications} notifications`
  );
}

/**
 * Disable subscribers past grace period
 * Handles auto-renewal for eligible subscribers
 * Also disconnects from RADIUS when disabled
 */
async function disableExpiredSubscribers() {
  console.log("[Disable Expired] Starting expired subscriber check...");

  const tenants = await prisma.tenant.findMany({
    where: { status: { not: "SUSPENDED" } },
    select: { id: true, slug: true, settings: true },
  });

  let totalDisabled = 0;
  let totalRenewed = 0;

  for (const tenant of tenants) {
    const settings = (tenant.settings as any)?.billing || {};
    const gracePeriodDays = settings.gracePeriodDays || 3;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - gracePeriodDays);
    cutoffDate.setHours(23, 59, 59, 999);

    const expiredSubscribers = await prisma.subscriber.findMany({
      where: {
        tenantId: tenant.id,
        status: "ACTIVE",
        expiryDate: {
          lte: cutoffDate,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        expiryDate: true,
        autoRenewal: true,
        balance: true,
        planId: true,
      },
    });

    console.log(
      `[Disable Expired] Tenant ${tenant.slug}: Found ${expiredSubscribers.length} expired subscribers (grace period: ${gracePeriodDays} days)`
    );

    for (const subscriber of expiredSubscribers) {
      try {
        // Check auto-renewal eligibility
        if (subscriber.autoRenewal && subscriber.planId) {
          const plan = await prisma.plan.findUnique({
            where: { id: subscriber.planId },
          });

          if (plan && Number(subscriber.balance) >= Number(plan.price)) {
            // AUTO-RENEW: deduct balance and extend expiry
            const newBalance = Number(subscriber.balance) - Number(plan.price);
            const newExpiry = new Date();

            if (plan.validityUnit === "HOURS") {
              newExpiry.setHours(newExpiry.getHours() + plan.validityDays);
            } else if (plan.validityUnit === "MONTHS") {
              newExpiry.setMonth(newExpiry.getMonth() + plan.validityDays);
            } else {
              // DAYS (default)
              newExpiry.setDate(newExpiry.getDate() + plan.validityDays);
            }

            await prisma.subscriber.update({
              where: { id: subscriber.id },
              data: {
                balance: newBalance,
                expiryDate: newExpiry,
                lastRenewalDate: new Date(),
              },
            });

            // Update RADIUS Expiration attribute
            const radiusUsername = buildRadiusUsername(tenant.slug, subscriber.username);
            await prisma.radCheck.deleteMany({
              where: { username: radiusUsername, attribute: "Expiration" },
            });
            await prisma.radCheck.create({
              data: {
                username: radiusUsername,
                attribute: "Expiration",
                op: ":=",
                value: radiusService.formatRadiusExpiration(newExpiry),
              },
            });

            // Queue renewal notification
            await notificationQueue.add("send-renewal-notice", {
              subscriberId: subscriber.id,
              tenantId: tenant.id,
              type: "plan-activation",
            });

            totalRenewed++;
            console.log(
              `[Auto-Renewal] Renewed ${subscriber.username}, new expiry: ${newExpiry.toISOString()}, balance: ${newBalance}`
            );
            continue; // Skip disabling
          }
          // Insufficient balance — fall through to disable
          console.log(
            `[Auto-Renewal] ${subscriber.username} has auto-renewal but insufficient balance (${subscriber.balance} < ${plan?.price})`
          );
        }

        // DISABLE: update status and block RADIUS
        await prisma.subscriber.update({
          where: { id: subscriber.id },
          data: { status: "EXPIRED" },
        });

        await radiusService.disableSubscriberRadius(tenant.slug, subscriber.username);

        await notificationQueue.add("send-expired-notice", {
          subscriberId: subscriber.id,
          tenantId: tenant.id,
          type: "expired-notice",
        });

        totalDisabled++;
        console.log(
          `[Disable Expired] Disabled ${subscriber.username} (expired: ${subscriber.expiryDate})`
        );
      } catch (error) {
        console.error(
          `[Disable Expired] Failed to process ${subscriber.username}:`,
          error
        );
      }
    }
  }

  console.log(
    `[Disable Expired] Completed. Renewed: ${totalRenewed}, Disabled: ${totalDisabled}`
  );
}

/**
 * Clean up stale RADIUS sessions
 * Sessions with no interim update for over 60 minutes are marked as ended
 */
async function cleanupStaleSessions() {
  console.log("[Stale Sessions] Starting cleanup...");
  const cleaned = await radiusService.cleanupStaleSessions(undefined, 15);
  console.log(`[Stale Sessions] Completed. Cleaned ${cleaned} stale sessions`);
}

// Worker event handlers
billingWorker.on("completed", (job) => {
  console.log(`[Billing Worker] Job ${job.id} (${job.name}) completed`);
});

billingWorker.on("failed", (job, err) => {
  console.error(`[Billing Worker] Job ${job?.id} (${job?.name}) failed:`, err);
});

billingWorker.on("error", (err) => {
  console.error("[Billing Worker] Worker error:", err);
});

console.log("[Billing Worker] Started");

export default billingWorker;
