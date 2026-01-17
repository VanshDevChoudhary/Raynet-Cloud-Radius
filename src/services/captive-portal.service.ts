import { prisma } from "@/lib/prisma";

export const captivePortalService = {
  /**
   * Get captive portal config for a tenant (by slug)
   */
  async getConfigBySlug(tenantSlug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        captivePortalConfig: true,
      },
    });

    if (!tenant) return null;

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
      },
      config: tenant.captivePortalConfig,
    };
  },

  /**
   * Get config by tenantId (for admin settings)
   */
  async getConfig(tenantId: string) {
    return prisma.captivePortalConfig.findUnique({
      where: { tenantId },
    });
  },

  /**
   * Upsert captive portal config
   */
  async upsertConfig(
    tenantId: string,
    data: {
      isEnabled?: boolean;
      logoUrl?: string | null;
      backgroundUrl?: string | null;
      primaryColor?: string;
      welcomeTitle?: string;
      welcomeMessage?: string | null;
      termsOfService?: string | null;
      redirectUrl?: string | null;
      enableOtpLogin?: boolean;
      enableVoucherLogin?: boolean;
      enableUserPassLogin?: boolean;
    }
  ) {
    return prisma.captivePortalConfig.upsert({
      where: { tenantId },
      update: data,
      create: {
        tenantId,
        ...data,
      },
    });
  },

  /**
   * Authenticate via username/password for hotspot
   */
  async authenticateUserPass(tenantSlug: string, username: string, password: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) return { success: false as const, error: "Invalid portal" };

    const subscriber = await prisma.subscriber.findFirst({
      where: {
        tenantId: tenant.id,
        username: { equals: username, mode: "insensitive" },
        status: "ACTIVE",
        connectionType: { in: ["HOTSPOT", "PPPOE"] },
      },
      include: {
        plan: { select: { name: true, validityDays: true } },
      },
    });

    if (!subscriber) {
      return { success: false as const, error: "Invalid credentials or account inactive" };
    }

    // For hotspot, we compare plain-text password stored in passwordHash
    // (RADIUS uses Cleartext-Password)
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, subscriber.passwordHash);
    if (!isValid) {
      return { success: false as const, error: "Invalid credentials" };
    }

    return {
      success: true as const,
      subscriber: {
        id: subscriber.id,
        name: subscriber.name,
        username: subscriber.username,
        plan: subscriber.plan?.name || "No plan",
        expiryDate: subscriber.expiryDate,
      },
      // RADIUS username for MikroTik to use
      radiusUsername: `${tenantSlug}_${subscriber.username}`,
    };
  },

  /**
   * Authenticate via voucher code
   */
  async authenticateVoucher(tenantSlug: string, voucherCode: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) return { success: false as const, error: "Invalid portal" };

    // Import voucher service
    const { voucherService } = await import("./voucher.service");
    const result = await voucherService.redeemVoucher(tenant.id, voucherCode);

    if (!result.success) {
      return { success: false as const, error: result.error };
    }

    // For voucher auth, the code itself becomes the RADIUS username
    const radiusUsername = `${tenantSlug}_voucher_${voucherCode.toUpperCase()}`;

    // Create RADIUS entries for the voucher user
    try {
      await prisma.$transaction(async (tx) => {
        // Create radcheck entry (voucher code as password)
        await tx.radCheck.deleteMany({
          where: { username: radiusUsername },
        });
        await tx.radCheck.create({
          data: {
            username: radiusUsername,
            attribute: "Cleartext-Password",
            op: ":=",
            value: voucherCode.toUpperCase(),
          },
        });

        // Map to plan group for bandwidth
        if (result.plan) {
          const groupname = `${tenantSlug}_${result.plan.id}`;
          await tx.radUserGroup.deleteMany({
            where: { username: radiusUsername },
          });
          await tx.radUserGroup.create({
            data: {
              username: radiusUsername,
              groupname,
              priority: 1,
            },
          });
        }
      });

      console.log(`[RADIUS] Synced voucher auth for ${radiusUsername}`);
    } catch (error) {
      console.error(`[RADIUS] Failed to sync voucher auth for ${radiusUsername}:`, error);
    }

    return {
      success: true as const,
      plan: result.plan?.name || "Voucher Plan",
      expiresAt: result.expiresAt,
      radiusUsername,
    };
  },
};
