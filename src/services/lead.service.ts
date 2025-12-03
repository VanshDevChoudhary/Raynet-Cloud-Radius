import { prisma } from "@/lib/prisma";
import type { LeadInput } from "@/lib/validations/lead.schema";
import type { Prisma } from "@/generated/prisma";

export const leadService = {
  async create(tenantId: string, input: LeadInput) {
    return prisma.lead.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        address: input.address || null,
        locationId: input.locationId || null,
        source: input.source,
        status: input.status || "NEW",
        notes: input.notes || null,
      },
      include: {
        location: { select: { id: true, name: true } },
      },
    });
  },

  async getById(tenantId: string, leadId: string) {
    return prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      include: {
        location: { select: { id: true, name: true, type: true } },
      },
    });
  },

  async list(
    tenantId: string,
    params?: {
      status?: string;
      source?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.LeadWhereInput = { tenantId };
    if (params?.status) where.status = params.status as Prisma.EnumLeadStatusFilter;
    if (params?.source) where.source = params.source as Prisma.EnumLeadSourceFilter;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          location: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async update(tenantId: string, leadId: string, input: Partial<LeadInput>) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });
    if (!lead) throw new Error("Lead not found");

    const updateData: Prisma.LeadUpdateInput = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.address !== undefined) updateData.address = input.address || null;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes || null;
    if (input.locationId !== undefined) {
      updateData.location = input.locationId
        ? { connect: { id: input.locationId } }
        : { disconnect: true };
    }

    return prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        location: { select: { id: true, name: true } },
      },
    });
  },

  async updateStatus(tenantId: string, leadId: string, status: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });
    if (!lead) throw new Error("Lead not found");

    return prisma.lead.update({
      where: { id: leadId },
      data: { status: status as Prisma.EnumLeadStatusFieldUpdateOperationsInput["set"] },
    });
  },

  async markConverted(tenantId: string, leadId: string, subscriberId: string) {
    return prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedToId: subscriberId,
      },
    });
  },

  async delete(tenantId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });
    if (!lead) throw new Error("Lead not found");

    return prisma.lead.delete({ where: { id: leadId } });
  },

  async getStats(tenantId: string) {
    const [total, newLeads, contacted, siteSurvey, scheduled, converted, lost] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, status: "NEW" } }),
      prisma.lead.count({ where: { tenantId, status: "CONTACTED" } }),
      prisma.lead.count({ where: { tenantId, status: "SITE_SURVEY" } }),
      prisma.lead.count({ where: { tenantId, status: "INSTALLATION_SCHEDULED" } }),
      prisma.lead.count({ where: { tenantId, status: "CONVERTED" } }),
      prisma.lead.count({ where: { tenantId, status: "LOST" } }),
    ]);

    return {
      total,
      new: newLeads,
      contacted,
      siteSurvey,
      scheduled,
      converted,
      lost,
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : "0",
    };
  },
};
