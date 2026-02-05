/**
 * RADIUS Data Migration Script
 *
 * This script syncs existing subscribers, plans, and NAS devices to RADIUS tables.
 * Run this once after Phase 2 deployment to populate RADIUS tables with existing data.
 *
 * Usage:
 *   npm run tsx scripts/seed-radius.ts
 *   OR
 *   npx tsx scripts/seed-radius.ts
 */

import { PrismaClient } from "@/generated/prisma";
import { radiusService } from "../src/services/radius.service";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RADIUS data migration...\n");

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`Found ${tenants.length} tenant(s) to process\n`);

    for (const tenant of tenants) {
      console.log(`\nProcessing tenant: ${tenant.name} (${tenant.slug})`);
      console.log("─".repeat(60));

      // Sync Plans
      console.log("\nSyncing plans...");
      const plans = await prisma.plan.findMany({
        where: { tenantId: tenant.id },
      });

      for (const plan of plans) {
        try {
          await radiusService.syncPlanBandwidth(tenant.slug, plan);
          console.log(`  ✓ ${plan.name} (${plan.downloadSpeed}/${plan.uploadSpeed} ${plan.speedUnit})`);
        } catch (error) {
          console.error(`  ✗ Failed to sync plan ${plan.name}:`, error);
        }
      }
      console.log(`  Total: ${plans.length} plans synced`);

      // Sync NAS Devices
      console.log("\nSyncing NAS devices...");
      const nasDevices = await prisma.nasDevice.findMany({
        where: { tenantId: tenant.id },
      });

      for (const nas of nasDevices) {
        try {
          await radiusService.syncNasDevice(nas);
          console.log(`  ✓ ${nas.name} (${nas.nasIp})`);
        } catch (error) {
          console.error(`  ✗ Failed to sync NAS ${nas.name}:`, error);
        }
      }
      console.log(`  Total: ${nasDevices.length} NAS devices synced`);

      // Sync Subscribers
      console.log("\nSyncing subscribers...");
      const subscribers = await prisma.subscriber.findMany({
        where: {
          tenantId: tenant.id,
          deletedAt: null,
        },
      });

      let successCount = 0;
      let errorCount = 0;

      // For existing subscribers, bcrypt hashes can't be reversed.
      // Use DEFAULT_RADIUS_PASSWORD env var or "subscriber123" as fallback.
      const defaultPassword = process.env.DEFAULT_RADIUS_PASSWORD || "subscriber123";
      console.log(`  (Using default RADIUS password: "${defaultPassword}" for existing subscribers)`);
      console.log(`  Set DEFAULT_RADIUS_PASSWORD env var to override.`);

      for (const subscriber of subscribers) {
        try {
          // Sync auth with default cleartext password (bcrypt hash can't be reversed)
          await radiusService.syncSubscriberAuth(tenant.slug, subscriber, defaultPassword);

          // Sync plan mapping if subscriber has a plan
          if (subscriber.planId) {
            await radiusService.syncSubscriberPlan(
              tenant.slug,
              subscriber.username,
              subscriber.planId
            );
          }

          successCount++;
          process.stdout.write(`\r  Progress: ${successCount}/${subscribers.length} subscribers synced`);
        } catch (error) {
          errorCount++;
          console.error(`\n  ✗ Failed to sync subscriber ${subscriber.username}:`, error);
        }
      }

      console.log(`\n  Total: ${successCount} subscribers synced, ${errorCount} errors`);

      console.log("\n" + "─".repeat(60));
      console.log(`Tenant "${tenant.name}" migration complete.`);
      console.log(`   - Plans: ${plans.length}`);
      console.log(`   - NAS Devices: ${nasDevices.length}`);
      console.log(`   - Subscribers: ${successCount}`);
    }

    console.log("\nRADIUS migration completed successfully.\n");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
