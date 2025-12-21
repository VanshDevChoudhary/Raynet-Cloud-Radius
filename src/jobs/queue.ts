import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Queue definitions
export const billingQueue = new Queue("billing", { connection });
export const notificationQueue = new Queue("notifications", { connection });

// Job types
export interface ExpiryCheckJob {
  tenantId: string;
}

export interface DisableExpiredJob {
  tenantId: string;
}

export interface AutoInvoiceJob {
  tenantId: string;
  subscriberId: string;
  planId: string;
}

export interface NotificationJob {
  subscriberId: string;
  tenantId: string;
  type: "expiry-reminder" | "expired-notice" | "payment-confirmation";
  daysUntilExpiry?: number;
}

/**
 * Initialize all cron jobs
 * Call this once on server startup
 */
export async function setupBillingCron() {
  // Check expiring subscribers every 6 hours
  await billingQueue.add(
    "check-expiring-subscribers",
    {},
    {
      repeat: {
        pattern: "0 */6 * * *", // Every 6 hours
      },
      jobId: "check-expiring-subscribers-cron",
    }
  );

  // Clean up stale RADIUS sessions every 5 minutes
  await billingQueue.add(
    "cleanup-stale-sessions",
    {},
    {
      repeat: {
        pattern: "*/5 * * * *", // Every 5 minutes
      },
      jobId: "cleanup-stale-sessions-cron",
    }
  );

  // Disable expired subscribers daily at 2 AM
  await billingQueue.add(
    "disable-expired-subscribers",
    {},
    {
      repeat: {
        pattern: "0 2 * * *", // Daily at 2 AM
      },
      jobId: "disable-expired-subscribers-cron",
    }
  );

  console.log("Billing cron jobs initialized");
}

/**
 * Remove all repeatable jobs (use for cleanup)
 */
export async function cleanupCronJobs() {
  const repeatableJobs = await billingQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await billingQueue.removeRepeatableByKey(job.key);
  }
  console.log("Cleaned up cron jobs");
}
