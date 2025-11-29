import { prisma } from "@/lib/prisma";
import type { CreateTicketInput, UpdateTicketInput, AddCommentInput } from "@/lib/validations/ticket.schema";
import type { Prisma } from "@/generated/prisma";

export const ticketService = {
  async getNextTicketNumber(tenantId: string): Promise<string> {
    const lastTicket = await prisma.ticket.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { ticketNumber: true },
    });

    if (!lastTicket) return "TKT-001";

    const lastNum = parseInt(lastTicket.ticketNumber.replace("TKT-", ""), 10);
    return `TKT-${String(lastNum + 1).padStart(3, "0")}`;
  },

  async create(tenantId: string, input: CreateTicketInput) {
    const ticketNumber = await this.getNextTicketNumber(tenantId);

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        subject: input.subject,
        description: input.description,
        category: input.category,
        priority: input.priority,
        subscriberId: input.subscriberId || null,
        assignedToId: input.assignedToId || null,
        status: input.assignedToId ? "ASSIGNED" : "OPEN",
      },
      include: {
        subscriber: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    return ticket;
  },

  async getById(tenantId: string, ticketId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
      include: {
        subscriber: {
          select: {
            id: true, name: true, phone: true, email: true, username: true,
            plan: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return ticket;
  },

  async list(
    tenantId: string,
    params?: {
      status?: string;
      priority?: string;
      category?: string;
      assignedToId?: string;
      subscriberId?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TicketWhereInput = { tenantId };
    if (params?.status) where.status = params.status as Prisma.EnumTicketStatusFilter;
    if (params?.priority) where.priority = params.priority as Prisma.EnumTicketPriorityFilter;
    if (params?.category) where.category = params.category as Prisma.EnumTicketCategoryFilter;
    if (params?.assignedToId) where.assignedToId = params.assignedToId;
    if (params?.subscriberId) where.subscriberId = params.subscriberId;
    if (params?.search) {
      where.OR = [
        { ticketNumber: { contains: params.search, mode: "insensitive" } },
        { subject: { contains: params.search, mode: "insensitive" } },
        { subscriber: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          subscriber: { select: { id: true, name: true, phone: true } },
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async update(tenantId: string, ticketId: string, input: UpdateTicketInput) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new Error("Ticket not found");

    const updateData: Prisma.TicketUpdateInput = {};

    if (input.subject !== undefined) updateData.subject = input.subject;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.assignedToId !== undefined) {
      updateData.assignedTo = input.assignedToId
        ? { connect: { id: input.assignedToId } }
        : { disconnect: true };
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "RESOLVED") updateData.resolvedAt = new Date();
      if (input.status === "CLOSED") updateData.closedAt = new Date();
    }

    return prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        subscriber: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async addComment(tenantId: string, ticketId: string, userId: string, input: AddCommentInput) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new Error("Ticket not found");

    return prisma.ticketComment.create({
      data: {
        tenantId,
        ticketId,
        userId,
        message: input.message,
        isInternal: input.isInternal ?? false,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  },

  async delete(tenantId: string, ticketId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new Error("Ticket not found");

    await prisma.ticketComment.deleteMany({ where: { ticketId } });
    await prisma.ticket.delete({ where: { id: ticketId } });
  },

  async getStats(tenantId: string) {
    const [total, open, assigned, inProgress, resolved, closed] = await Promise.all([
      prisma.ticket.count({ where: { tenantId } }),
      prisma.ticket.count({ where: { tenantId, status: "OPEN" } }),
      prisma.ticket.count({ where: { tenantId, status: "ASSIGNED" } }),
      prisma.ticket.count({ where: { tenantId, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { tenantId, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { tenantId, status: "CLOSED" } }),
    ]);

    return { total, open, assigned, inProgress, resolved, closed };
  },

  async getOpenCount(tenantId: string): Promise<number> {
    return prisma.ticket.count({
      where: {
        tenantId,
        status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
      },
    });
  },

  async getStaffMembers(tenantId: string) {
    return prisma.user.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
        role: { in: ["TENANT_ADMIN", "MANAGER", "STAFF"] },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  },
};
