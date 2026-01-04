import { prisma } from "@/lib/prisma";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import type { Prisma } from "@/generated/prisma";

export interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  expiredSubscribers: number;
  newThisMonth: number;
  mrr: number;
  collectionsThisMonth: number;
  outstandingAmount: number;
  onlineNow: number;
}

export interface MonthlyDataPoint {
  month: string;
  value: number;
}

export interface PlanDistribution {
  name: string;
  count: number;
}

export interface AreaDistribution {
  name: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: "subscriber" | "payment" | "invoice" | "ticket";
  description: string;
  timestamp: Date;
}

export const dashboardService = {
  async getStats(tenantId: string): Promise<DashboardStats> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      totalSubscribers,
      activeSubscribers,
      expiredSubscribers,
      newThisMonth,
      collectionsResult,
      outstandingResult,
      onlineNow,
    ] = await Promise.all([
      // Total subscribers (not deleted)
      prisma.subscriber.count({
        where: { tenantId, deletedAt: null },
      }),

      // Active subscribers
      prisma.subscriber.count({
        where: { tenantId, status: "ACTIVE", deletedAt: null },
      }),

      // Expired subscribers
      prisma.subscriber.count({
        where: { tenantId, status: "EXPIRED", deletedAt: null },
      }),

      // New this month
      prisma.subscriber.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),

      // Collections this month (completed payments)
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),

      // Outstanding amount (unpaid invoices)
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ["ISSUED", "OVERDUE"] },
        },
        _sum: { balanceDue: true },
      }),

      // Online now - count active RADIUS sessions (no stop time = still online)
      prisma.radAcct.count({
        where: {
          acctstoptime: null,
          username: { startsWith: `${tenantId.substring(0, 8)}_` },
        },
      }).catch(() => 0),
    ]);

    // Calculate MRR from active subscribers' plans
    const mrrResult = await prisma.subscriber.findMany({
      where: { tenantId, status: "ACTIVE", deletedAt: null, planId: { not: null } },
      select: { plan: { select: { price: true, validityDays: true } } },
    });

    const mrr = mrrResult.reduce((sum, sub) => {
      if (!sub.plan) return sum;
      const monthlyPrice = Number(sub.plan.price) * (30 / sub.plan.validityDays);
      return sum + monthlyPrice;
    }, 0);

    return {
      totalSubscribers,
      activeSubscribers,
      expiredSubscribers,
      newThisMonth,
      mrr: Math.round(mrr * 100) / 100,
      collectionsThisMonth: Number(collectionsResult._sum.amount ?? 0),
      outstandingAmount: Number(outstandingResult._sum.balanceDue ?? 0),
      onlineNow,
    };
  },

  async getSubscriberGrowth(tenantId: string): Promise<MonthlyDataPoint[]> {
    const months: MonthlyDataPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const count = await prisma.subscriber.count({
        where: {
          tenantId,
          deletedAt: null,
          createdAt: { lte: end },
        },
      });

      months.push({
        month: format(date, "MMM yy"),
        value: count,
      });
    }

    return months;
  },

  async getRevenueTrend(tenantId: string): Promise<MonthlyDataPoint[]> {
    const months: MonthlyDataPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const result = await prisma.payment.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      months.push({
        month: format(date, "MMM yy"),
        value: Number(result._sum.amount ?? 0),
      });
    }

    return months;
  },

  async getPlanDistribution(tenantId: string): Promise<PlanDistribution[]> {
    const results = await prisma.subscriber.groupBy({
      by: ["planId"],
      where: { tenantId, deletedAt: null, status: "ACTIVE", planId: { not: null } },
      _count: true,
    });

    if (results.length === 0) return [];

    const planIds = results.map((r) => r.planId).filter(Boolean) as string[];
    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p.name]));

    return results
      .filter((r) => r.planId)
      .map((r) => ({
        name: planMap.get(r.planId!) ?? "Unknown",
        count: r._count,
      }))
      .sort((a, b) => b.count - a.count);
  },

  async getAreaDistribution(tenantId: string): Promise<AreaDistribution[]> {
    const results = await prisma.subscriber.groupBy({
      by: ["locationId"],
      where: { tenantId, deletedAt: null, locationId: { not: null } },
      _count: true,
    });

    if (results.length === 0) return [];

    const locationIds = results.map((r) => r.locationId).filter(Boolean) as string[];
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true },
    });

    const locationMap = new Map(locations.map((l) => [l.id, l.name]));

    return results
      .filter((r) => r.locationId)
      .map((r) => ({
        name: locationMap.get(r.locationId!) ?? "Unknown",
        count: r._count,
      }))
      .sort((a, b) => b.count - a.count);
  },

  async getRecentActivity(tenantId: string, limit = 10): Promise<RecentActivity[]> {
    const [recentSubscribers, recentPayments, recentInvoices, recentTickets] =
      await Promise.all([
        prisma.subscriber.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, status: true, createdAt: true },
        }),
        prisma.payment.findMany({
          where: { tenantId, status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            amount: true,
            method: true,
            createdAt: true,
            subscriber: { select: { name: true } },
          },
        }),
        prisma.invoice.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            createdAt: true,
            subscriber: { select: { name: true } },
          },
        }),
        prisma.ticket.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    const activities: RecentActivity[] = [
      ...recentSubscribers.map((s) => ({
        id: s.id,
        type: "subscriber" as const,
        description: `New subscriber: ${s.name} (${s.status})`,
        timestamp: s.createdAt,
      })),
      ...recentPayments.map((p) => ({
        id: p.id,
        type: "payment" as const,
        description: `Payment of ₹${Number(p.amount).toLocaleString()} from ${p.subscriber.name} via ${p.method}`,
        timestamp: p.createdAt,
      })),
      ...recentInvoices.map((i) => ({
        id: i.id,
        type: "invoice" as const,
        description: `Invoice ${i.invoiceNumber} for ₹${Number(i.total).toLocaleString()} - ${i.status}`,
        timestamp: i.createdAt,
      })),
      ...recentTickets.map((t) => ({
        id: t.id,
        type: "ticket" as const,
        description: `Ticket ${t.ticketNumber}: ${t.subject} (${t.status})`,
        timestamp: t.createdAt,
      })),
    ];

    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  },
};
