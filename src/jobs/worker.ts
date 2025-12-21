#!/usr/bin/env tsx

/**
 * Background Worker Entry Point
 *
 * This file starts all BullMQ workers and initializes cron jobs.
 * Run this as a separate process:
 *
 *   pnpm worker
 *
 * Or in production with PM2:
 *
 *   pm2 start src/jobs/worker.ts --name cloudradius-worker --interpreter tsx
 */

import "./workers/billing.worker";
import "./workers/notification.worker";
import { setupBillingCron } from "./queue";

async function main() {
  console.log("Starting CloudRadius background workers...");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`   REDIS_URL: ${process.env.REDIS_URL || "redis://localhost:6379"}`);

  try {
    await setupBillingCron();
    console.log("Cron jobs initialized");
  } catch (error) {
    console.error("Failed to setup cron jobs:", error);
    process.exit(1);
  }

  console.log("All workers are running");
  console.log("   Press Ctrl+C to stop");
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT, shutting down...");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, shutting down...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
