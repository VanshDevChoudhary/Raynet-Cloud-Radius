import { prisma } from "@/lib/prisma";
import type { CreatePlanInput, UpdatePlanInput } from "@/lib/validations/plan.schema";
import type { Plan, Prisma } from "@/generated/prisma";
import { radiusService } from "./radius.service";

export interface PlanListParams {
  tenantId: string;
  search?: string;
  status?: string;
  planType?: string;
  billingType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const planService = {
  async list(params: PlanListParams) {
    const {
      tenantId,
      search,
      status,
      planType,
      billingType,
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const where: Prisma.PlanWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status as Plan["status"];
    if (planType) where.planType = planType as Plan["planType"];
    if (billingType) where.billingType = billingType as Plan["billingType"];

    const [data, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        include: { _count: { select: { subscribers: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.plan.count({ where }),
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
    return prisma.plan.findFirst({
      where: { id, tenantId },
    });
  },

  async create(tenantId: string, input: CreatePlanInput) {
    const plan = await prisma.plan.create({
      data: {
        tenantId,
        ...input,
        dataLimit: input.dataLimit ?? null,
        fupDownloadSpeed: input.fupDownloadSpeed ?? null,
        fupUploadSpeed: input.fupUploadSpeed ?? null,
        fupSpeedUnit: input.fupSpeedUnit ?? null,
        burstDownloadSpeed: input.burstDownloadSpeed ?? null,
        burstUploadSpeed: input.burstUploadSpeed ?? null,
        burstThreshold: input.burstThreshold ?? null,
        burstTime: input.burstTime ?? null,
        timeSlotStart: input.timeSlotStart ?? null,
        timeSlotEnd: input.timeSlotEnd ?? null,
        poolName: input.poolName ?? null,
      },
    });

    // Sync to RADIUS
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      await radiusService.syncPlanBandwidth(tenant.slug, plan);
    } catch (error) {
      console.error("[PLAN] RADIUS sync failed on create:", error);
    }

    return plan;
  },

  async update(tenantId: string, id: string, input: UpdatePlanInput) {
    const existing = await prisma.plan.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error("Plan not found");

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...input,
        dataLimit: input.dataLimit ?? null,
        fupDownloadSpeed: input.fupDownloadSpeed ?? null,
        fupUploadSpeed: input.fupUploadSpeed ?? null,
        fupSpeedUnit: input.fupSpeedUnit ?? null,
        burstDownloadSpeed: input.burstDownloadSpeed ?? null,
        burstUploadSpeed: input.burstUploadSpeed ?? null,
        burstThreshold: input.burstThreshold ?? null,
        burstTime: input.burstTime ?? null,
        timeSlotStart: input.timeSlotStart ?? null,
        timeSlotEnd: input.timeSlotEnd ?? null,
        poolName: input.poolName ?? null,
      },
    });

    // Sync to RADIUS
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      await radiusService.syncPlanBandwidth(tenant.slug, updated);
    } catch (error) {
      console.error("[PLAN] RADIUS sync failed on update:", error);
    }

    return updated;
  },

  async toggleStatus(tenantId: string, id: string) {
    const plan = await prisma.plan.findFirst({ where: { id, tenantId } });
    if (!plan) throw new Error("Plan not found");

    return prisma.plan.update({
      where: { id },
      data: { status: plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    });
  },

  async delete(tenantId: string, id: string) {
    const plan = await prisma.plan.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { subscribers: true } } },
    });
    if (!plan) throw new Error("Plan not found");
    if (plan._count.subscribers > 0) {
      throw new Error("Cannot delete plan with active subscribers");
    }

    // Remove from RADIUS first
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { slug: true },
    });

    try {
      await radiusService.removePlanBandwidth(tenant.slug, id);
    } catch (error) {
      console.error("[PLAN] RADIUS cleanup failed on delete:", error);
    }

    return prisma.plan.delete({ where: { id } });
  },

  async listAll(tenantId: string) {
    return prisma.plan.findMany({
      where: { tenantId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  },
};
