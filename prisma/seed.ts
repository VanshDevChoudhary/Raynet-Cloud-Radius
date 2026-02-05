import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo-isp" },
    update: {},
    create: {
      name: "Demo ISP",
      slug: "demo-isp",
      status: "ACTIVE",
      planTier: "PROFESSIONAL",
      maxOnline: 200,
      settings: {
        currency: "INR",
        timezone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY",
      },
    },
  });
  console.log(`Tenant: ${demoTenant.name} (${demoTenant.slug})`);

  const superAdminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@cloudradius.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@cloudradius.com",
      phone: "+919999999999",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      tenantId: null,
    },
  });

  const tenantAdminPassword = await bcrypt.hash("demo123", 12);
  await prisma.user.upsert({
    where: { email: "admin@demo-isp.com" },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: "Rahul Sharma",
      email: "admin@demo-isp.com",
      phone: "+919876543210",
      passwordHash: tenantAdminPassword,
      role: "TENANT_ADMIN",
      status: "ACTIVE",
    },
  });

  const staffPassword = await bcrypt.hash("staff123", 12);
  await prisma.user.upsert({
    where: { email: "staff@demo-isp.com" },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: "Priya Patel",
      email: "staff@demo-isp.com",
      phone: "+919876543211",
      passwordHash: staffPassword,
      role: "STAFF",
      status: "ACTIVE",
    },
  });

  console.log("Users created");

  const regionMaharashtra = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: "Maharashtra",
      type: "REGION",
    },
  });

  const cityPune = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: "Pune",
      type: "CITY",
      parentId: regionMaharashtra.id,
    },
  });

  const cityMumbai = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: "Mumbai",
      type: "CITY",
      parentId: regionMaharashtra.id,
    },
  });

  const areaKothrud = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: "Kothrud",
      type: "AREA",
      parentId: cityPune.id,
    },
  });

  const areaWarje = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: "Warje",
      type: "AREA",
      parentId: cityPune.id,
    },
  });

  const areaAndheri = await prisma.location.create({
    data: {
      tenantId: demoTenant.id,
      name: "Andheri",
      type: "AREA",
      parentId: cityMumbai.id,
    },
  });

  console.log("Locations created");

  const planBasic = await prisma.plan.create({
    data: {
      tenantId: demoTenant.id,
      name: "Basic 30Mbps",
      description: "Entry-level broadband plan",
      downloadSpeed: 30,
      uploadSpeed: 30,
      speedUnit: "MBPS",
      dataUnit: "UNLIMITED",
      validityDays: 30,
      validityUnit: "DAYS",
      price: 499,
      billingType: "PREPAID",
      planType: "PPPOE",
      simultaneousDevices: 1,
      priority: 8,
      status: "ACTIVE",
    },
  });

  const planStandard = await prisma.plan.create({
    data: {
      tenantId: demoTenant.id,
      name: "Standard 50Mbps",
      description: "Popular broadband plan with unlimited data",
      downloadSpeed: 50,
      uploadSpeed: 50,
      speedUnit: "MBPS",
      dataUnit: "UNLIMITED",
      validityDays: 30,
      validityUnit: "DAYS",
      price: 699,
      billingType: "PREPAID",
      planType: "PPPOE",
      simultaneousDevices: 2,
      priority: 6,
      status: "ACTIVE",
    },
  });

  const planPremium = await prisma.plan.create({
    data: {
      tenantId: demoTenant.id,
      name: "Premium 100Mbps",
      description: "High-speed plan for power users",
      downloadSpeed: 100,
      uploadSpeed: 100,
      speedUnit: "MBPS",
      dataUnit: "UNLIMITED",
      validityDays: 30,
      validityUnit: "DAYS",
      price: 999,
      billingType: "PREPAID",
      planType: "BOTH",
      burstDownloadSpeed: 120,
      burstUploadSpeed: 120,
      burstThreshold: 80,
      burstTime: 10,
      simultaneousDevices: 3,
      priority: 4,
      status: "ACTIVE",
    },
  });

  await prisma.plan.create({
    data: {
      tenantId: demoTenant.id,
      name: "FUP 100GB @ 50Mbps",
      description: "50Mbps plan with 100GB FUP, reduces to 2Mbps",
      downloadSpeed: 50,
      uploadSpeed: 50,
      speedUnit: "MBPS",
      dataLimit: 100,
      dataUnit: "GB",
      validityDays: 30,
      validityUnit: "DAYS",
      price: 599,
      billingType: "PREPAID",
      planType: "PPPOE",
      fupDownloadSpeed: 2,
      fupUploadSpeed: 2,
      fupSpeedUnit: "MBPS",
      simultaneousDevices: 1,
      priority: 8,
      status: "ACTIVE",
    },
  });

  await prisma.plan.create({
    data: {
      tenantId: demoTenant.id,
      name: "Hotspot 1-Day",
      description: "Daily hotspot access pass",
      downloadSpeed: 10,
      uploadSpeed: 5,
      speedUnit: "MBPS",
      dataLimit: 2,
      dataUnit: "GB",
      validityDays: 1,
      validityUnit: "DAYS",
      price: 49,
      billingType: "PREPAID",
      planType: "HOTSPOT",
      simultaneousDevices: 1,
      priority: 8,
      status: "ACTIVE",
    },
  });

  console.log("Plans created");

  const nas1 = await prisma.nasDevice.create({
    data: {
      tenantId: demoTenant.id,
      name: "MikroTik Kothrud Tower",
      shortName: "MT-KOT",
      nasIp: "192.168.1.1",
      secret: "radius_secret_123",
      nasType: "MIKROTIK",
      description: "Main router for Kothrud area",
      locationId: areaKothrud.id,
      status: "ACTIVE",
    },
  });

  const nas2 = await prisma.nasDevice.create({
    data: {
      tenantId: demoTenant.id,
      name: "MikroTik Warje Hub",
      shortName: "MT-WAR",
      nasIp: "192.168.2.1",
      secret: "radius_secret_456",
      nasType: "MIKROTIK",
      description: "Main router for Warje area",
      locationId: areaWarje.id,
      status: "ACTIVE",
    },
  });

  await prisma.nasDevice.create({
    data: {
      tenantId: demoTenant.id,
      name: "MikroTik Andheri",
      shortName: "MT-AND",
      nasIp: "10.0.1.1",
      secret: "radius_secret_789",
      nasType: "MIKROTIK",
      description: "Andheri area router",
      locationId: areaAndheri.id,
      status: "ACTIVE",
    },
  });

  console.log("NAS devices created");

  const subPassword = await bcrypt.hash("subscriber123", 12);

  const subscribers = [
    {
      name: "Amit Kumar",
      phone: "+919812345001",
      email: "amit@example.com",
      username: "amit_kumar",
      subscriberType: "RESIDENTIAL" as const,
      connectionType: "PPPOE" as const,
      planId: planStandard.id,
      nasDeviceId: nas1.id,
      locationId: areaKothrud.id,
      status: "ACTIVE" as const,
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Sunita Deshpande",
      phone: "+919812345002",
      email: "sunita@example.com",
      username: "sunita_d",
      subscriberType: "RESIDENTIAL" as const,
      connectionType: "PPPOE" as const,
      planId: planPremium.id,
      nasDeviceId: nas1.id,
      locationId: areaKothrud.id,
      status: "ACTIVE" as const,
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Rajesh Patil",
      phone: "+919812345003",
      username: "rajesh_p",
      subscriberType: "COMMERCIAL" as const,
      connectionType: "PPPOE" as const,
      planId: planBasic.id,
      nasDeviceId: nas2.id,
      locationId: areaWarje.id,
      status: "EXPIRED" as const,
      expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Meena Joshi",
      phone: "+919812345004",
      email: "meena@example.com",
      username: "meena_j",
      subscriberType: "RESIDENTIAL" as const,
      connectionType: "PPPOE" as const,
      planId: planStandard.id,
      nasDeviceId: nas2.id,
      locationId: areaWarje.id,
      status: "ACTIVE" as const,
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Vikram Singh",
      phone: "+919812345005",
      username: "vikram_s",
      subscriberType: "RESIDENTIAL" as const,
      connectionType: "HOTSPOT" as const,
      planId: planBasic.id,
      nasDeviceId: nas1.id,
      locationId: areaKothrud.id,
      status: "SUSPENDED" as const,
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Pooja Kulkarni",
      phone: "+919812345006",
      email: "pooja@example.com",
      username: "pooja_k",
      subscriberType: "RESIDENTIAL" as const,
      connectionType: "PPPOE" as const,
      planId: planPremium.id,
      nasDeviceId: nas1.id,
      locationId: areaKothrud.id,
      status: "ACTIVE" as const,
      expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Cafe Darshana",
      phone: "+919812345007",
      username: "cafe_darshana",
      subscriberType: "COMMERCIAL" as const,
      connectionType: "STATIC_IP" as const,
      planId: planPremium.id,
      nasDeviceId: nas2.id,
      locationId: areaWarje.id,
      staticIp: "103.45.67.10",
      status: "ACTIVE" as const,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: "Deepak Jadhav",
      phone: "+919812345008",
      username: "deepak_j",
      subscriberType: "RESIDENTIAL" as const,
      connectionType: "PPPOE" as const,
      planId: planBasic.id,
      nasDeviceId: nas2.id,
      locationId: areaWarje.id,
      status: "DISABLED" as const,
      expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const sub of subscribers) {
    await prisma.subscriber.create({
      data: {
        tenantId: demoTenant.id,
        ...sub,
        passwordHash: subPassword,
        installationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastRenewalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log(`${subscribers.length} subscribers created`);

  // Get first subscriber and staff user for references
  const firstSubscriber = await prisma.subscriber.findFirst({
    where: { tenantId: demoTenant.id, status: "ACTIVE" },
  });
  const staffUser = await prisma.user.findFirst({
    where: { tenantId: demoTenant.id, role: "STAFF" },
  });
  const adminUser = await prisma.user.findFirst({
    where: { tenantId: demoTenant.id, role: "TENANT_ADMIN" },
  });

  // Voucher batch seed data
  // Find the Hotspot 1-Day plan for vouchers
  const hotspotPlan = await prisma.plan.findFirst({
    where: { tenantId: demoTenant.id, name: "Hotspot 1-Day" },
  });

  if (hotspotPlan) {
    const existingBatch = await prisma.voucherBatch.findFirst({
      where: { tenantId: demoTenant.id, batchNumber: "BATCH-001" },
    });

    if (!existingBatch) {
      const batch = await prisma.voucherBatch.create({
        data: {
          tenantId: demoTenant.id,
          planId: hotspotPlan.id,
          batchNumber: "BATCH-001",
          prefix: "WIFI",
          quantity: 20,
          codeLength: 8,
          validityDays: 1,
          notes: "Demo hotspot voucher batch",
        },
      });

      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const voucherData = [];
      for (let i = 1; i <= 20; i++) {
        let code = "";
        for (let j = 0; j < 8; j++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
        const status = i <= 15 ? "GENERATED" : i <= 18 ? "SOLD" : "REDEEMED";
        voucherData.push({
          tenantId: demoTenant.id,
          batchId: batch.id,
          code: `WIFI-${code}`,
          serialNumber: i,
          status: status as "GENERATED" | "SOLD" | "REDEEMED",
          ...(status === "SOLD" && {
            soldTo: "Cyber Cafe Express",
            soldAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          }),
          ...(status === "REDEEMED" && {
            redeemedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            expiresAt: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000),
          }),
        });
      }

      await prisma.voucher.createMany({ data: voucherData });
      console.log("20 vouchers created in BATCH-001");
    } else {
      console.log("Voucher batch already exists, skipping");
    }
  }

  const existingTicket = await prisma.ticket.findFirst({
    where: { tenantId: demoTenant.id },
  });

  if (!existingTicket) {
    const ticketData = [
      {
        ticketNumber: "TKT-001",
        subject: "Internet not working since morning",
        description: "My internet connection is down. Router shows connected but no internet access. I have restarted the router multiple times but the issue persists.",
        category: "CONNECTIVITY" as const,
        priority: "HIGH" as const,
        status: "IN_PROGRESS" as const,
        subscriberId: firstSubscriber?.id || null,
        assignedToId: staffUser?.id || null,
      },
      {
        ticketNumber: "TKT-002",
        subject: "Speed is very slow during evenings",
        description: "Every evening between 7 PM and 11 PM, the speed drops significantly. I am on the 50Mbps plan but getting only 5-10 Mbps during peak hours.",
        category: "SPEED" as const,
        priority: "MEDIUM" as const,
        status: "ASSIGNED" as const,
        assignedToId: staffUser?.id || null,
      },
      {
        ticketNumber: "TKT-003",
        subject: "Incorrect billing amount in last invoice",
        description: "My last invoice shows Rs.999 but I am on the Basic 30Mbps plan which costs Rs.499. Please correct this.",
        category: "BILLING" as const,
        priority: "MEDIUM" as const,
        status: "OPEN" as const,
      },
      {
        ticketNumber: "TKT-004",
        subject: "Request for new connection at Warje office",
        description: "We need a new broadband connection for our office at Warje. Please schedule a site visit.",
        category: "INSTALLATION" as const,
        priority: "LOW" as const,
        status: "RESOLVED" as const,
        resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        ticketNumber: "TKT-005",
        subject: "WiFi router replacement needed",
        description: "The WiFi router provided by you is not working properly. It keeps disconnecting every few hours. Please replace it.",
        category: "CONNECTIVITY" as const,
        priority: "CRITICAL" as const,
        status: "OPEN" as const,
        subscriberId: firstSubscriber?.id || null,
      },
    ];

    for (const ticket of ticketData) {
      const created = await prisma.ticket.create({
        data: {
          tenantId: demoTenant.id,
          ...ticket,
        },
      });

      // Add a comment on the first ticket
      if (ticket.ticketNumber === "TKT-001" && staffUser) {
        await prisma.ticketComment.create({
          data: {
            tenantId: demoTenant.id,
            ticketId: created.id,
            userId: staffUser.id,
            message: "Checked the line. Issue is at the distribution point. Technician dispatched for repair.",
            isInternal: false,
          },
        });
        if (adminUser) {
          await prisma.ticketComment.create({
            data: {
              tenantId: demoTenant.id,
              ticketId: created.id,
              userId: adminUser.id,
              message: "Internal: Distribution switch at Kothrud tower needs replacement. Ordered new unit.",
              isInternal: true,
            },
          });
        }
      }
    }

    console.log("5 tickets created");
  } else {
    console.log("Tickets already exist, skipping");
  }

  const existingLead = await prisma.lead.findFirst({
    where: { tenantId: demoTenant.id },
  });

  if (!existingLead) {
    const leadData = [
      {
        name: "Vishal Thakur",
        phone: "+919812340001",
        email: "vishal.t@example.com",
        address: "12A, Kothrud Housing Society, Pune",
        locationId: areaKothrud.id,
        source: "WALK_IN" as const,
        status: "NEW" as const,
        notes: "Interested in 50Mbps plan. Asked about installation timeline.",
      },
      {
        name: "Neha Sharma",
        phone: "+919812340002",
        email: "neha.s@example.com",
        address: "Block B, Warje Apartments",
        locationId: areaWarje.id,
        source: "REFERRAL" as const,
        status: "CONTACTED" as const,
        notes: "Referred by Amit Kumar. Called once, interested in Premium plan.",
      },
      {
        name: "Rajan Electronics",
        phone: "+919812340003",
        address: "Shop 45, Warje Commercial Complex",
        locationId: areaWarje.id,
        source: "PHONE" as const,
        status: "SITE_SURVEY" as const,
        notes: "Commercial connection needed. Requires static IP. Site survey scheduled for next week.",
      },
      {
        name: "Priti Deshmukh",
        phone: "+919812340004",
        email: "priti.d@example.com",
        locationId: areaKothrud.id,
        source: "WEBSITE" as const,
        status: "INSTALLATION_SCHEDULED" as const,
        notes: "Basic plan. Installation scheduled for Feb 15.",
      },
      {
        name: "Quick Bites Cafe",
        phone: "+919812340005",
        address: "FC Road, near Deccan Gymkhana",
        source: "SOCIAL_MEDIA" as const,
        status: "LOST" as const,
        notes: "Was interested in hotspot solution for cafe. Went with competitor.",
      },
    ];

    for (const lead of leadData) {
      await prisma.lead.create({
        data: {
          tenantId: demoTenant.id,
          ...lead,
        },
      });
    }

    console.log("5 leads created");
  } else {
    console.log("Leads already exist, skipping");
  }

  await prisma.captivePortalConfig.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      isEnabled: true,
      primaryColor: "#2563eb",
      welcomeTitle: "Welcome to Demo ISP WiFi",
      welcomeMessage: "Connect to high-speed internet. Choose your preferred login method below.",
      enableOtpLogin: true,
      enableVoucherLogin: true,
      enableUserPassLogin: true,
    },
  });
  console.log("Captive portal config created");

  console.log("\nSeed completed.");
  console.log("\nLogin credentials:");
  console.log("  Super Admin:  admin@cloudradius.com / admin123");
  console.log("  Tenant Admin: admin@demo-isp.com / demo123");
  console.log("  Staff:        staff@demo-isp.com / staff123");
  console.log("\nCaptive Portal: /hotspot/demo-isp");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
