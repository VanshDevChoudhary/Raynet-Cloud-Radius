import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Tenant, TenantStatus, PlanTier, Prisma } from "@/generated/prisma";

type TenantWithStats = Tenant & {
  _count: { subscribers: number; users: number };
};

type TenantWithDetails = Tenant & {
  _count: { subscribers: number; users: number; plans: number; nasDevices: number };
};

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalSubscribers: number;
  totalUsers: number;
  recentTenants: Tenant[];
}

export const tenantService = {
  async list(
    filters?: { status?: TenantStatus; search?: string }
  ): Promise<TenantWithStats[]> {
    const where: Prisma.TenantWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.tenant.findMany({
      where,
      include: {
        _count: { select: { subscribers: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string): Promise<TenantWithDetails | null> {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscribers: true,
            users: true,
            plans: true,
            nasDevices: true,
          },
        },
      },
    });
  },

  async create(data: {
    name: string;
    slug: string;
    domain?: string;
    planTier: PlanTier;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }): Promise<Tenant> {
    const adminPasswordHash = await bcrypt.hash(data.adminPassword, 12);

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          domain: data.domain || null,
          planTier: data.planTier,
          status: "TRIAL",
        },
      });

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.adminName,
          email: data.adminEmail,
          passwordHash: adminPasswordHash,
          role: "TENANT_ADMIN",
          status: "ACTIVE",
        },
      });

      return tenant;
    });
  },

  async update(
    id: string,
    data: {
      name?: string;
      domain?: string;
      planTier?: PlanTier;
      status?: TenantStatus;
      maxOnline?: number;
    }
  ): Promise<Tenant> {
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new Error("Tenant not found");

    const updateData: Prisma.TenantUncheckedUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.domain !== undefined) updateData.domain = data.domain || null;
    if (data.planTier !== undefined) updateData.planTier = data.planTier;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.maxOnline !== undefined) updateData.maxOnline = data.maxOnline;

    return prisma.tenant.update({
      where: { id },
      data: updateData,
    });
  },

  async suspend(id: string): Promise<Tenant> {
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new Error("Tenant not found");

    return prisma.tenant.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });
  },

  async activate(id: string): Promise<Tenant> {
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new Error("Tenant not found");

    return prisma.tenant.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  },

  async getPlatformStats(): Promise<PlatformStats> {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalSubscribers,
      totalUsers,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "TRIAL" } }),
      prisma.tenant.count({ where: { status: "SUSPENDED" } }),
      prisma.subscriber.count(),
      prisma.user.count(),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalSubscribers,
      totalUsers,
      recentTenants,
    };
  },
};
