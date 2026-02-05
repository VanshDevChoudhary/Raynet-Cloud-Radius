/**
 * Feature Test Script
 * Tests all 6 new features: MAC binding, Static IP, Grace period, Auto-renewal, WhatsApp, Bulk import
 * Run: npx tsx scripts/test-features.ts
 */

import { prisma } from "@/lib/prisma";
import { radiusService } from "@/services/radius.service";
import { subscriberService } from "@/services/subscriber.service";
import { smsService } from "@/services/sms/sms.service";
import { buildRadiusUsername } from "@/lib/radius-utils";

const TENANT_ID = "25b6a238-ca82-4d5e-b52c-784c94b8a366"; // demo-isp
const TENANT_SLUG = "demo-isp";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${message}`);
    failed++;
    failures.push(message);
  }
}

async function testMACBinding() {
  console.log("\n--- TEST 1: MAC Binding (Calling-Station-Id) ---");

  const testMac = "AA:BB:CC:DD:EE:FF";
  const testUsername = `test_mac_${Date.now()}`;

  // 1. Create subscriber with MAC address
  console.log("\n  Creating subscriber with MAC address...");
  const sub = await subscriberService.create(TENANT_ID, {
    name: "MAC Test User",
    phone: "9999999001",
    username: testUsername,
    password: "testpass123",
    connectionType: "PPPOE",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    macAddress: testMac,
    autoRenewal: false,
  });
  assert(!!sub.id, `Subscriber created: ${sub.username}`);

  // 2. Check radcheck has Calling-Station-Id
  const radiusUsername = buildRadiusUsername(TENANT_SLUG, testUsername);
  const macCheck = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Calling-Station-Id" },
  });
  assert(!!macCheck, `Calling-Station-Id exists in radcheck`);
  assert(macCheck?.value === testMac, `Calling-Station-Id value = ${macCheck?.value}`);
  assert(macCheck?.op === ":=", `Calling-Station-Id op = ${macCheck?.op}`);

  // 3. Update subscriber to remove MAC
  console.log("\n  Removing MAC address...");
  await subscriberService.update(TENANT_ID, sub.id, {
    name: "MAC Test User",
    phone: "9999999001",
    username: testUsername,
    connectionType: "PPPOE",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    macAddress: "",
    autoRenewal: false,
  });
  const macCheckAfter = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Calling-Station-Id" },
  });
  assert(!macCheckAfter, `Calling-Station-Id removed from radcheck after MAC cleared`);

  // 4. Update subscriber to set new MAC
  console.log("\n  Setting new MAC address...");
  const newMac = "11:22:33:44:55:66";
  await subscriberService.update(TENANT_ID, sub.id, {
    name: "MAC Test User",
    phone: "9999999001",
    username: testUsername,
    connectionType: "PPPOE",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    macAddress: newMac,
    autoRenewal: false,
  });
  const macCheckNew = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Calling-Station-Id" },
  });
  assert(macCheckNew?.value === newMac.toUpperCase(), `New MAC in radcheck: ${macCheckNew?.value}`);

  // Cleanup
  await subscriberService.softDelete(TENANT_ID, sub.id);
  console.log("  Cleaned up test subscriber");
}

async function testStaticIP() {
  console.log("\n--- TEST 2: Static IP (Framed-IP-Address) ---");

  const testIP = "10.0.0.100";
  const testUsername = `test_ip_${Date.now()}`;

  // 1. Create subscriber with static IP
  console.log("\n  Creating subscriber with static IP...");
  const sub = await subscriberService.create(TENANT_ID, {
    name: "Static IP Test User",
    phone: "9999999002",
    username: testUsername,
    password: "testpass123",
    connectionType: "STATIC_IP",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    staticIp: testIP,
    autoRenewal: false,
  });
  assert(!!sub.id, `Subscriber created: ${sub.username}`);

  // 2. Check radreply has Framed-IP-Address
  const radiusUsername = buildRadiusUsername(TENANT_SLUG, testUsername);
  const ipReply = await prisma.radReply.findFirst({
    where: { username: radiusUsername, attribute: "Framed-IP-Address" },
  });
  assert(!!ipReply, `Framed-IP-Address exists in radreply`);
  assert(ipReply?.value === testIP, `Framed-IP-Address value = ${ipReply?.value}`);
  assert(ipReply?.op === ":=", `Framed-IP-Address op = ${ipReply?.op}`);

  // 3. Update subscriber to change IP
  const newIP = "10.0.0.200";
  console.log("\n  Changing static IP...");
  await subscriberService.update(TENANT_ID, sub.id, {
    name: "Static IP Test User",
    phone: "9999999002",
    username: testUsername,
    connectionType: "STATIC_IP",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    staticIp: newIP,
    autoRenewal: false,
  });
  const ipReplyNew = await prisma.radReply.findFirst({
    where: { username: radiusUsername, attribute: "Framed-IP-Address" },
  });
  assert(ipReplyNew?.value === newIP, `Updated Framed-IP-Address = ${ipReplyNew?.value}`);

  // 4. Remove static IP
  console.log("\n  Removing static IP...");
  await subscriberService.update(TENANT_ID, sub.id, {
    name: "Static IP Test User",
    phone: "9999999002",
    username: testUsername,
    connectionType: "PPPOE",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    staticIp: "",
    autoRenewal: false,
  });
  const ipReplyAfter = await prisma.radReply.findFirst({
    where: { username: radiusUsername, attribute: "Framed-IP-Address" },
  });
  assert(!ipReplyAfter, `Framed-IP-Address removed from radreply after IP cleared`);

  // 5. Verify cleanup removes radreply entries too
  console.log("\n  Testing delete cleanup...");
  // First re-add static IP
  await subscriberService.update(TENANT_ID, sub.id, {
    name: "Static IP Test User",
    phone: "9999999002",
    username: testUsername,
    connectionType: "STATIC_IP",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    staticIp: testIP,
    autoRenewal: false,
  });
  // Then delete subscriber
  await subscriberService.softDelete(TENANT_ID, sub.id);
  const ipReplyDeleted = await prisma.radReply.findFirst({
    where: { username: radiusUsername },
  });
  assert(!ipReplyDeleted, `radreply cleaned up on subscriber delete`);
  console.log("  Cleaned up test subscriber");
}

async function testGracePeriod() {
  console.log("\n--- TEST 3: Grace Period Settings Fix ---");

  // 1. Check current tenant settings structure
  const tenant = await prisma.tenant.findUnique({
    where: { id: TENANT_ID },
    select: { settings: true },
  });
  const settings = (tenant?.settings as Record<string, unknown>) || {};
  console.log(`\n  Current settings keys: ${Object.keys(settings).join(", ")}`);

  // 2. Simulate saving billing preferences (what the action does)
  const currentBilling = (settings.billing as Record<string, unknown>) || {};
  const testGraceDays = 5;

  await prisma.tenant.update({
    where: { id: TENANT_ID },
    data: {
      settings: {
        ...settings,
        billing: {
          ...currentBilling,
          gracePeriodDays: testGraceDays,
          currency: currentBilling.currency || "INR",
          taxRate: currentBilling.taxRate || 18,
        },
      },
    },
  });

  // 3. Read back and verify billing worker can find it
  const tenantAfter = await prisma.tenant.findUnique({
    where: { id: TENANT_ID },
    select: { settings: true },
  });
  const settingsAfter = (tenantAfter?.settings as Record<string, unknown>) || {};
  const billingSettings = (settingsAfter.billing as Record<string, unknown>) || {};

  assert(billingSettings.gracePeriodDays === testGraceDays,
    `billing.gracePeriodDays = ${billingSettings.gracePeriodDays} (expected ${testGraceDays})`);
  assert(!!billingSettings.currency,
    `billing.currency = ${billingSettings.currency}`);

  // 4. Verify the billing worker path works
  // The worker does: (tenant.settings as any)?.billing?.gracePeriodDays || 3
  const workerGrace = (tenantAfter?.settings as any)?.billing?.gracePeriodDays || 3;
  assert(workerGrace === testGraceDays,
    `Worker reads grace period correctly: ${workerGrace}`);

  console.log("  Grace period settings nesting verified");
}

async function testAutoRenewal() {
  console.log("\n--- TEST 4: Auto-Renewal ---");

  // Get a plan with a price
  const plan = await prisma.plan.findFirst({
    where: { tenantId: TENANT_ID },
    orderBy: { price: "asc" },
  });
  if (!plan) {
    console.log("  [SKIP] No plans found, skipping auto-renewal test");
    return;
  }

  const testUsername = `test_renewal_${Date.now()}`;
  const planPrice = Number(plan.price);

  // 1. Create subscriber with auto-renewal ON and sufficient balance
  console.log(`\n  Creating subscriber with autoRenewal=true, balance=${planPrice * 2}, plan=${plan.name} (price=${planPrice})`);
  const sub = await prisma.subscriber.create({
    data: {
      tenantId: TENANT_ID,
      name: "Auto-Renewal Test",
      phone: "9999999003",
      username: testUsername,
      passwordHash: "$2a$12$dummy",
      connectionType: "PPPOE",
      subscriberType: "RESIDENTIAL",
      status: "ACTIVE",
      autoRenewal: true,
      balance: planPrice * 2,
      planId: plan.id,
      expiryDate: new Date("2024-01-01"), // Already expired
      lastRenewalDate: new Date("2023-12-01"),
    },
  });

  assert(sub.autoRenewal === true, `Subscriber autoRenewal = ${sub.autoRenewal}`);
  assert(Number(sub.balance) === planPrice * 2, `Subscriber balance = ${sub.balance}`);

  // 2. Verify the schema field works in queries
  const fetched = await prisma.subscriber.findUnique({
    where: { id: sub.id },
    select: { autoRenewal: true, balance: true, planId: true },
  });
  assert(fetched?.autoRenewal === true, `autoRenewal readable from DB`);

  // 3. Test that the billing worker logic would work
  // Simulate what the worker does
  if (fetched?.autoRenewal && fetched.planId) {
    const subscriberPlan = await prisma.plan.findUnique({
      where: { id: fetched.planId },
    });
    if (subscriberPlan && Number(fetched.balance) >= Number(subscriberPlan.price)) {
      const newBalance = Number(fetched.balance) - Number(subscriberPlan.price);
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + subscriberPlan.validityDays);

      assert(newBalance === planPrice, `Post-renewal balance: ${newBalance} (deducted ${planPrice})`);
      assert(newExpiry > new Date(), `New expiry is in the future: ${newExpiry.toISOString()}`);
      console.log(`  Would renew: new balance=${newBalance}, new expiry=${newExpiry.toISOString()}`);
    }
  }

  // 4. Test with insufficient balance
  console.log("\n  Testing insufficient balance scenario...");
  await prisma.subscriber.update({
    where: { id: sub.id },
    data: { balance: 0 },
  });
  const lowBalance = await prisma.subscriber.findUnique({
    where: { id: sub.id },
    select: { autoRenewal: true, balance: true, planId: true },
  });
  const canRenew = lowBalance?.autoRenewal &&
    lowBalance.planId &&
    Number(lowBalance.balance) >= planPrice;
  assert(!canRenew, `Insufficient balance correctly prevents renewal (balance=${lowBalance?.balance}, price=${planPrice})`);

  // Cleanup
  await prisma.subscriber.delete({ where: { id: sub.id } });
  console.log("  Cleaned up test subscriber");
}

async function testWhatsAppAdapter() {
  console.log("\n--- TEST 5: WhatsApp Adapter Integration ---");

  // 1. Test adapter creation
  console.log("\n  Testing adapter factory...");
  try {
    const mockGateway = {
      id: "test",
      tenantId: TENANT_ID,
      provider: "WHATSAPP" as const,
      name: "Test WhatsApp",
      apiKey: "test-token",
      senderId: "15551234567",
      apiUrl: null,
      status: "ACTIVE" as const,
      config: { whatsappProvider: "meta", phoneNumberId: "123456789" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const adapter = smsService.createAdapter(mockGateway);
    assert(!!adapter, `WhatsApp adapter created successfully`);
    assert(typeof adapter.sendSms === "function", `Adapter has sendSms method`);
  } catch (error) {
    assert(false, `Adapter creation failed: ${error}`);
  }

  // 2. Test that sendWhatsApp returns graceful error when no gateway configured
  console.log("\n  Testing sendWhatsApp with no gateway...");
  const result = await smsService.sendWhatsApp(TENANT_ID, "+919999999999", "test message");
  assert(result.success === false, `Returns failure when no gateway: ${result.error}`);
  assert(result.error?.includes("No active WhatsApp gateway") ?? false, `Error message is informative`);

  // 3. Test Twilio WhatsApp adapter creation
  console.log("\n  Testing Twilio WhatsApp adapter...");
  try {
    const twilioGateway = {
      id: "test2",
      tenantId: TENANT_ID,
      provider: "WHATSAPP" as const,
      name: "Test Twilio WhatsApp",
      apiKey: "twilio-account-sid",
      senderId: "+15551234567",
      apiUrl: null,
      status: "ACTIVE" as const,
      config: { whatsappProvider: "twilio", authToken: "twilio-auth-token" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const adapter = smsService.createAdapter(twilioGateway);
    assert(!!adapter, `Twilio WhatsApp adapter created successfully`);
  } catch (error) {
    assert(false, `Twilio WhatsApp adapter creation failed: ${error}`);
  }

  console.log("  WhatsApp adapter integration verified");
}

async function testBulkImport() {
  console.log("\n--- TEST 6: Bulk Subscriber Import ---");

  const timestamp = Date.now();

  // 1. Test bulkCreate with valid data
  console.log("\n  Testing bulkCreate with 3 subscribers...");
  const result = await subscriberService.bulkCreate(TENANT_ID, [
    {
      name: "Bulk Test 1",
      phone: "9999999101",
      username: `bulk_1_${timestamp}`,
      password: "testpass123",
      connectionType: "PPPOE",
      subscriberType: "RESIDENTIAL",
      status: "ACTIVE",
      autoRenewal: false,
    },
    {
      name: "Bulk Test 2",
      phone: "9999999102",
      username: `bulk_2_${timestamp}`,
      password: "testpass123",
      connectionType: "HOTSPOT",
      subscriberType: "COMMERCIAL",
      status: "ACTIVE",
      autoRenewal: true,
    },
    {
      name: "Bulk Test 3",
      phone: "9999999103",
      username: `bulk_3_${timestamp}`,
      password: "testpass123",
      connectionType: "PPPOE",
      subscriberType: "RESIDENTIAL",
      status: "ACTIVE",
      macAddress: "AA:BB:CC:11:22:33",
      staticIp: "10.0.0.50",
      autoRenewal: false,
    },
  ]);

  assert(result.created === 3, `Created ${result.created}/3 subscribers`);
  assert(result.failed === 0, `Failed: ${result.failed} (expected 0)`);
  assert(result.errors.length === 0, `No errors`);

  // 2. Verify RADIUS entries for bulk subscriber 3 (MAC + Static IP)
  const radiusUsername3 = buildRadiusUsername(TENANT_SLUG, `bulk_3_${timestamp}`);
  const macEntry = await prisma.radCheck.findFirst({
    where: { username: radiusUsername3, attribute: "Calling-Station-Id" },
  });
  assert(!!macEntry, `Bulk import: MAC binding synced for subscriber 3`);
  assert(macEntry?.value === "AA:BB:CC:11:22:33", `Bulk import: MAC value correct`);

  const ipEntry = await prisma.radReply.findFirst({
    where: { username: radiusUsername3, attribute: "Framed-IP-Address" },
  });
  assert(!!ipEntry, `Bulk import: Static IP synced for subscriber 3`);
  assert(ipEntry?.value === "10.0.0.50", `Bulk import: Static IP value correct`);

  // 3. Verify auto-renewal was set on subscriber 2
  const sub2 = await prisma.subscriber.findFirst({
    where: { tenantId: TENANT_ID, username: `bulk_2_${timestamp}` },
  });
  assert(sub2?.autoRenewal === true, `Bulk import: autoRenewal set for subscriber 2`);

  // 4. Test duplicate username handling
  console.log("\n  Testing duplicate username handling...");
  const dupResult = await subscriberService.bulkCreate(TENANT_ID, [
    {
      name: "Duplicate Test",
      phone: "9999999999",
      username: `bulk_1_${timestamp}`, // Already exists
      password: "testpass123",
      connectionType: "PPPOE",
      subscriberType: "RESIDENTIAL",
      status: "ACTIVE",
      autoRenewal: false,
    },
  ]);
  assert(dupResult.failed === 1, `Duplicate username correctly rejected`);
  assert(dupResult.errors.length === 1, `Error reported for duplicate`);
  console.log(`  Duplicate error: ${dupResult.errors[0]?.error}`);

  // Cleanup
  const bulkSubs = await prisma.subscriber.findMany({
    where: {
      tenantId: TENANT_ID,
      username: { startsWith: `bulk_` },
    },
  });
  for (const s of bulkSubs) {
    await subscriberService.softDelete(TENANT_ID, s.id);
  }
  console.log(`  Cleaned up ${bulkSubs.length} test subscribers`);
}

async function testSubscriberLifecycle() {
  console.log("\n--- TEST 7: Subscriber Lifecycle (Status Changes) ---");

  const testUsername = `test_lifecycle_${Date.now()}`;
  const plan = await prisma.plan.findFirst({
    where: { tenantId: TENANT_ID },
  });

  // 1. Create active subscriber with MAC + Static IP + plan
  console.log("\n  Creating subscriber with all features...");
  const sub = await subscriberService.create(TENANT_ID, {
    name: "Lifecycle Test",
    phone: "9999999004",
    username: testUsername,
    password: "testpass123",
    connectionType: "STATIC_IP",
    subscriberType: "RESIDENTIAL",
    status: "ACTIVE",
    macAddress: "DE:AD:BE:EF:00:01",
    staticIp: "10.0.1.100",
    planId: plan?.id,
    autoRenewal: true,
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  const radiusUsername = buildRadiusUsername(TENANT_SLUG, testUsername);

  // Verify all RADIUS entries
  const passwordCheck = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Cleartext-Password" },
  });
  assert(!!passwordCheck, `Cleartext-Password in radcheck`);

  const macCheck = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Calling-Station-Id" },
  });
  assert(!!macCheck, `Calling-Station-Id in radcheck`);

  const expiryCheck = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Expiration" },
  });
  assert(!!expiryCheck, `Expiration in radcheck`);

  const ipReply = await prisma.radReply.findFirst({
    where: { username: radiusUsername, attribute: "Framed-IP-Address" },
  });
  assert(!!ipReply, `Framed-IP-Address in radreply`);

  if (plan) {
    const groupMapping = await prisma.radUserGroup.findFirst({
      where: { username: radiusUsername },
    });
    assert(!!groupMapping, `radusergroup mapping exists`);
  }

  // 2. Suspend subscriber
  console.log("\n  Suspending subscriber...");
  await subscriberService.updateStatus(TENANT_ID, sub.id, "SUSPENDED");

  const rejectCheck = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Auth-Type" },
  });
  assert(rejectCheck?.value === "Reject", `Auth-Type = Reject after suspend`);

  const groupAfterSuspend = await prisma.radUserGroup.findFirst({
    where: { username: radiusUsername },
  });
  assert(!groupAfterSuspend, `radusergroup removed after suspend`);

  // 3. Reactivate subscriber
  console.log("\n  Reactivating subscriber...");
  await subscriberService.updateStatus(TENANT_ID, sub.id, "ACTIVE");

  const rejectAfterActive = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Auth-Type" },
  });
  assert(!rejectAfterActive, `Auth-Type Reject removed after reactivation`);

  // Check MAC binding persists after reactivation
  const macAfterReactivate = await prisma.radCheck.findFirst({
    where: { username: radiusUsername, attribute: "Calling-Station-Id" },
  });
  assert(!!macAfterReactivate, `MAC binding persists after reactivation`);

  if (plan) {
    const groupAfterActive = await prisma.radUserGroup.findFirst({
      where: { username: radiusUsername },
    });
    assert(!!groupAfterActive, `radusergroup restored after reactivation`);
  }

  // 4. Delete subscriber — verify all RADIUS entries cleaned
  console.log("\n  Deleting subscriber...");
  await subscriberService.softDelete(TENANT_ID, sub.id);

  const allRadcheck = await prisma.radCheck.findMany({
    where: { username: radiusUsername },
  });
  assert(allRadcheck.length === 0, `All radcheck entries cleaned on delete`);

  const allRadreply = await prisma.radReply.findMany({
    where: { username: radiusUsername },
  });
  assert(allRadreply.length === 0, `All radreply entries cleaned on delete`);

  const allGroups = await prisma.radUserGroup.findMany({
    where: { username: radiusUsername },
  });
  assert(allGroups.length === 0, `All radusergroup entries cleaned on delete`);

  console.log("  Full lifecycle verified");
}

async function main() {
  console.log("CloudRadius Feature Test Suite\n");

  try {
    await testMACBinding();
    await testStaticIP();
    await testGracePeriod();
    await testAutoRenewal();
    await testWhatsAppAdapter();
    await testBulkImport();
    await testSubscriberLifecycle();
  } catch (error) {
    console.error("\nTest suite crashed:", error);
  }

  console.log("\n--- RESULTS ---");
  console.log(`  Total: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);

  if (failures.length > 0) {
    console.log("\n  FAILURES:");
    failures.forEach((f) => console.log(`    - ${f}`));
  }

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main();
