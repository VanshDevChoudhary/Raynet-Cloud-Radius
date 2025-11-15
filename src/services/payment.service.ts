import { prisma } from "@/lib/prisma";
import { billingService } from "./billing.service";
import type { Prisma, PaymentMethod, PaymentStatus } from "@/generated/prisma";

export interface PaymentListParams {
  tenantId: string;
  subscriberId?: string;
  invoiceId?: string;
  method?: PaymentMethod;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const paymentService = {
  async list(params: PaymentListParams) {
    const {
      tenantId,
      subscriberId,
      invoiceId,
      method,
      status,
      startDate,
      endDate,
      page = 1,
      pageSize = 50,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const where: Prisma.PaymentWhereInput = { tenantId };

    if (subscriberId) where.subscriberId = subscriberId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (method) where.method = method;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          subscriber: { select: { id: true, name: true, phone: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getById(tenantId: string, id: string) {
    return prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        subscriber: true,
        invoice: true,
      },
    });
  },

  // Records payment and updates invoice balance. If invoice is fully paid,
  // extends subscriber expiry by the plan's validity period.
  async recordPayment(tenantId: string, input: any, collectedBy?: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          subscriberId: input.subscriberId,
          invoiceId: input.invoiceId,
          amount: input.amount,
          method: input.method,
          transactionId: input.transactionId,
          status: input.status || "COMPLETED",
          notes: input.notes,
          collectedBy,
        },
        include: { subscriber: true, invoice: true },
      });

      // If linked to invoice, update invoice balance
      if (input.invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: input.invoiceId },
        });

        const newAmountPaid = Number(invoice.amountPaid) + Number(input.amount);
        const newBalanceDue = Number(invoice.total) - newAmountPaid;

        await tx.invoice.update({
          where: { id: input.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newBalanceDue <= 0 ? "PAID" : "ISSUED",
            paidDate: newBalanceDue <= 0 ? new Date() : invoice.paidDate,
          },
        });

        // If invoice fully paid, extend subscriber expiry
        if (newBalanceDue <= 0 && invoice.planId) {
          const plan = await tx.plan.findFirst({
            where: { id: invoice.planId },
          });

          if (plan) {
            const subscriber = await tx.subscriber.findUniqueOrThrow({
              where: { id: input.subscriberId },
            });

            const currentExpiry = subscriber.expiryDate || new Date();
            const newExpiry = new Date(
              Math.max(currentExpiry.getTime(), new Date().getTime())
            );
            newExpiry.setDate(newExpiry.getDate() + (plan.validityDays || 30));

            await tx.subscriber.update({
              where: { id: input.subscriberId },
              data: {
                expiryDate: newExpiry,
                status: "ACTIVE",
                lastRenewalDate: new Date(),
              },
            });
          }
        }
      }

      return payment;
    });
  },

  async getSubscriberBalance(tenantId: string, subscriberId: string) {
    const result = await prisma.invoice.aggregate({
      where: {
        tenantId,
        subscriberId,
        status: { in: ["ISSUED", "OVERDUE"] },
      },
      _sum: { balanceDue: true },
    });

    return result._sum.balanceDue || 0;
  },

  async getStats(tenantId: string) {
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      totalCollected,
      thisMonthCollections,
    ] = await Promise.all([
      prisma.payment.count({ where: { tenantId } }),
      prisma.payment.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.payment.count({ where: { tenantId, status: "PENDING" } }),
      prisma.payment.aggregate({
        where: { tenantId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      totalCollected: totalCollected._sum.amount || 0,
      thisMonthCollections: thisMonthCollections._sum.amount || 0,
    };
  },
};
