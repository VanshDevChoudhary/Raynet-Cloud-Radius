import { prisma } from "@/lib/prisma";
import type { Prisma, InvoiceStatus } from "@/generated/prisma";

export interface InvoiceListParams {
  tenantId: string;
  subscriberId?: string;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const billingService = {
  async list(params: InvoiceListParams) {
    const {
      tenantId,
      subscriberId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      pageSize = 50,
      sortBy = "invoiceDate",
      sortOrder = "desc",
    } = params;

    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (subscriberId) where.subscriberId = subscriberId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startDate;
      if (endDate) where.invoiceDate.lte = endDate;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { subscriber: { name: { contains: search, mode: "insensitive" } } },
        { subscriber: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          subscriber: { select: { id: true, name: true, phone: true, username: true } },
          plan: { select: { id: true, name: true } },
          _count: { select: { payments: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
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
    return prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        subscriber: true,
        plan: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    });

    const prefix = (tenant.settings as any)?.billing?.invoicePrefix || "INV";

    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    if (!lastInvoice) return `${prefix}-001`;

    const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[1] || "0");
    const nextNumber = lastNumber + 1;
    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  },

  async createInvoice(tenantId: string, input: any) {
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const amount = input.amount;
    const tax = input.tax || 0;
    const discount = input.discount || 0;
    const total = amount + tax - discount;

    // Get plan details for snapshot
    let planDetails = null;
    if (input.planId) {
      const plan = await prisma.plan.findFirst({
        where: { id: input.planId, tenantId },
      });
      if (plan) {
        planDetails = {
          name: plan.name,
          downloadSpeed: plan.downloadSpeed,
          uploadSpeed: plan.uploadSpeed,
          speedUnit: plan.speedUnit,
          dataLimit: plan.dataLimit,
          validityDays: plan.validityDays,
        };
      }
    }

    return prisma.invoice.create({
      data: {
        tenantId,
        subscriberId: input.subscriberId,
        planId: input.planId,
        invoiceNumber,
        amount,
        tax,
        discount,
        total,
        balanceDue: total,
        invoiceDate: input.invoiceDate || new Date(),
        dueDate: input.dueDate,
        description: input.description,
        notes: input.notes,
        planDetails: planDetails ?? undefined,
        status: "ISSUED",
      },
      include: { subscriber: true, plan: true },
    });
  },

  async updateInvoice(tenantId: string, id: string, input: any) {
    const existing = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new Error("Invoice not found");
    if (existing.status === "PAID") throw new Error("Cannot update paid invoice");

    const amount = input.amount ?? existing.amount;
    const tax = input.tax ?? existing.tax;
    const discount = input.discount ?? existing.discount;
    const total = Number(amount) + Number(tax) - Number(discount);
    const balanceDue = total - Number(existing.amountPaid);

    return prisma.invoice.update({
      where: { id },
      data: {
        ...input,
        total,
        balanceDue,
      },
    });
  },

  async markAsPaid(tenantId: string, invoiceId: string, paidDate?: Date) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) throw new Error("Invoice not found");

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidDate: paidDate || new Date(),
        balanceDue: 0,
        amountPaid: invoice.total,
      },
    });
  },

  async voidInvoice(tenantId: string, id: string, reason?: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === "PAID") throw new Error("Cannot void paid invoice");

    return prisma.invoice.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: reason ? `${invoice.notes || ""}\nCancelled: ${reason}` : invoice.notes,
      },
    });
  },

  async getStats(tenantId: string) {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingAmount,
      thisMonthRevenue,
    ] = await Promise.all([
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.count({ where: { tenantId, status: "PAID" } }),
      prisma.invoice.count({ where: { tenantId, status: "ISSUED" } }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ["ISSUED", "OVERDUE"] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: "PAID" },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ["ISSUED", "OVERDUE"] } },
        _sum: { balanceDue: true },
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: "PAID",
          paidDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingAmount: pendingAmount._sum.balanceDue || 0,
      thisMonthRevenue: thisMonthRevenue._sum.total || 0,
    };
  },

  // Auto-generates an invoice when a subscriber activates a plan,
  // applying the tenant's configured tax rate
  async autoGenerateInvoiceForSubscriber(
    tenantId: string,
    subscriberId: string,
    planId: string
  ) {
    const [subscriber, plan, tenant] = await Promise.all([
      prisma.subscriber.findFirst({ where: { id: subscriberId, tenantId } }),
      prisma.plan.findFirst({ where: { id: planId, tenantId } }),
      prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { settings: true } }),
    ]);

    if (!subscriber || !plan) throw new Error("Subscriber or plan not found");

    const settings = (tenant.settings as any)?.billing || {};
    const taxRate = settings.taxRate || 0;
    const amount = Number(plan.price);
    const tax = (amount * taxRate) / 100;
    const total = amount + tax;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (plan.validityDays || 30));

    return this.createInvoice(tenantId, {
      subscriberId,
      planId,
      amount,
      tax,
      discount: 0,
      dueDate,
      description: `${plan.name} - ${plan.validityDays} days`,
    });
  },
};
