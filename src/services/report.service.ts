import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";
import type { Prisma, SubscriberStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma";

export interface ReportFilters {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  planId?: string;
  locationId?: string;
  nasDeviceId?: string;
  status?: string;
  method?: string;
  page?: number;
  pageSize?: number;
}

export interface SubscriberReportRow {
  id: string;
  name: string;
  phone: string;
  username: string;
  status: string;
  planName: string | null;
  locationName: string | null;
  nasName: string | null;
  expiryDate: Date | null;
  createdAt: Date;
}

export interface BillingReportRow {
  id: string;
  invoiceNumber: string;
  subscriberName: string;
  planName: string | null;
  amount: number;
  tax: number;
  total: number;
  balanceDue: number;
  status: string;
  invoiceDate: Date;
  dueDate: Date;
}

export interface CollectionReportRow {
  id: string;
  subscriberName: string;
  amount: number;
  method: string;
  transactionId: string | null;
  status: string;
  createdAt: Date;
}

export interface RevenueByPlan {
  planName: string;
  totalRevenue: number;
  count: number;
}

export interface ExpiryReportRow {
  id: string;
  name: string;
  phone: string;
  username: string;
  planName: string | null;
  expiryDate: Date | null;
  daysUntilExpiry: number;
}

export const reportService = {
  async subscriberReport(filters: ReportFilters) {
    const { tenantId, startDate, endDate, planId, locationId, nasDeviceId, status, page = 1, pageSize = 50 } = filters;

    const where: Prisma.SubscriberWhereInput = { tenantId, deletedAt: null };
    if (status) where.status = status as SubscriberStatus;
    if (planId) where.planId = planId;
    if (locationId) where.locationId = locationId;
    if (nasDeviceId) where.nasDeviceId = nasDeviceId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startOfDay(startDate);
      if (endDate) where.createdAt.lte = endOfDay(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        include: {
          plan: { select: { name: true } },
          location: { select: { name: true } },
          nasDevice: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subscriber.count({ where }),
    ]);

    const rows: SubscriberReportRow[] = data.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      username: s.username,
      status: s.status,
      planName: s.plan?.name ?? null,
      locationName: s.location?.name ?? null,
      nasName: s.nasDevice?.name ?? null,
      expiryDate: s.expiryDate,
      createdAt: s.createdAt,
    }));

    return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async billingReport(filters: ReportFilters) {
    const { tenantId, startDate, endDate, status, page = 1, pageSize = 50 } = filters;

    const where: Prisma.InvoiceWhereInput = { tenantId };
    if (status) where.status = status as InvoiceStatus;
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startOfDay(startDate);
      if (endDate) where.invoiceDate.lte = endOfDay(endDate);
    }

    const [data, total, summary] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          subscriber: { select: { name: true } },
          plan: { select: { name: true } },
        },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.aggregate({
        where,
        _sum: { total: true, amountPaid: true, balanceDue: true },
        _count: true,
      }),
    ]);

    const rows: BillingReportRow[] = data.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      subscriberName: i.subscriber.name,
      planName: i.plan?.name ?? null,
      amount: Number(i.amount),
      tax: Number(i.tax),
      total: Number(i.total),
      balanceDue: Number(i.balanceDue),
      status: i.status,
      invoiceDate: i.invoiceDate,
      dueDate: i.dueDate,
    }));

    return {
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        totalInvoiced: Number(summary._sum.total ?? 0),
        totalPaid: Number(summary._sum.amountPaid ?? 0),
        totalOutstanding: Number(summary._sum.balanceDue ?? 0),
        count: summary._count,
      },
    };
  },

  async collectionReport(filters: ReportFilters) {
    const { tenantId, startDate, endDate, method, status, page = 1, pageSize = 50 } = filters;

    const where: Prisma.PaymentWhereInput = { tenantId };
    if (status) where.status = status as PaymentStatus;
    if (method) where.method = method as PaymentMethod;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startOfDay(startDate);
      if (endDate) where.createdAt.lte = endOfDay(endDate);
    }

    const [data, total, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          subscriber: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const rows: CollectionReportRow[] = data.map((p) => ({
      id: p.id,
      subscriberName: p.subscriber.name,
      amount: Number(p.amount),
      method: p.method,
      transactionId: p.transactionId,
      status: p.status,
      createdAt: p.createdAt,
    }));

    // Group by method for summary
    const byMethod = await prisma.payment.groupBy({
      by: ["method"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        totalCollected: Number(summary._sum.amount ?? 0),
        count: summary._count,
        byMethod: byMethod.map((m) => ({
          method: m.method,
          amount: Number(m._sum.amount ?? 0),
          count: m._count,
        })),
      },
    };
  },

  async revenueReport(filters: ReportFilters) {
    const { tenantId, startDate, endDate, planId, page = 1, pageSize = 50 } = filters;

    const where: Prisma.PaymentWhereInput = {
      tenantId,
      status: "COMPLETED",
    };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startOfDay(startDate);
      if (endDate) where.createdAt.lte = endOfDay(endDate);
    }

    // Get revenue grouped by plan through invoices
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      tenantId,
      status: "PAID",
    };
    if (planId) invoiceWhere.planId = planId;
    if (startDate || endDate) {
      invoiceWhere.paidDate = {};
      if (startDate) invoiceWhere.paidDate.gte = startOfDay(startDate);
      if (endDate) invoiceWhere.paidDate.lte = endOfDay(endDate);
    }

    const byPlan = await prisma.invoice.groupBy({
      by: ["planId"],
      where: invoiceWhere,
      _sum: { total: true },
      _count: true,
    });

    const planIds = byPlan.map((r) => r.planId).filter(Boolean) as string[];
    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });
    const planMap = new Map(plans.map((p) => [p.id, p.name]));

    const revenueByPlan: RevenueByPlan[] = byPlan
      .filter((r) => r.planId)
      .map((r) => ({
        planName: planMap.get(r.planId!) ?? "Unknown",
        totalRevenue: Number(r._sum.total ?? 0),
        count: r._count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Total revenue
    const totalRevenue = revenueByPlan.reduce((s, r) => s + r.totalRevenue, 0);

    // Also get all paid invoices for the table
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          subscriber: { select: { name: true } },
          plan: { select: { name: true } },
        },
        orderBy: { paidDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where: invoiceWhere }),
    ]);

    return {
      data: data.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        subscriberName: i.subscriber.name,
        planName: i.plan?.name ?? null,
        total: Number(i.total),
        paidDate: i.paidDate,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: { totalRevenue, revenueByPlan },
    };
  },

  async expiryReport(filters: ReportFilters & { daysAhead?: number }) {
    const { tenantId, daysAhead = 30, page = 1, pageSize = 50 } = filters;
    const now = new Date();
    const futureDate = addDays(now, daysAhead);

    const where: Prisma.SubscriberWhereInput = {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
      expiryDate: { gte: now, lte: futureDate },
    };

    const [data, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        include: { plan: { select: { name: true } } },
        orderBy: { expiryDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subscriber.count({ where }),
    ]);

    const rows: ExpiryReportRow[] = data.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      username: s.username,
      planName: s.plan?.name ?? null,
      expiryDate: s.expiryDate,
      daysUntilExpiry: s.expiryDate
        ? Math.ceil((s.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    return { data: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async churnReport(filters: ReportFilters) {
    const { tenantId, startDate, endDate, page = 1, pageSize = 50 } = filters;

    const where: Prisma.SubscriberWhereInput = {
      tenantId,
      deletedAt: null,
      status: "EXPIRED",
    };

    if (startDate || endDate) {
      where.expiryDate = {};
      if (startDate) where.expiryDate.gte = startOfDay(startDate);
      if (endDate) where.expiryDate.lte = endOfDay(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        include: {
          plan: { select: { name: true, price: true } },
          location: { select: { name: true } },
        },
        orderBy: { expiryDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subscriber.count({ where }),
    ]);

    // Calculate churn rate
    const totalActive = await prisma.subscriber.count({
      where: { tenantId, deletedAt: null, status: "ACTIVE" },
    });
    const churnRate = totalActive + total > 0
      ? ((total / (totalActive + total)) * 100).toFixed(1)
      : "0";

    return {
      data: data.map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        username: s.username,
        planName: s.plan?.name ?? null,
        planPrice: s.plan ? Number(s.plan.price) : 0,
        locationName: s.location?.name ?? null,
        expiryDate: s.expiryDate,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: { churnRate, totalChurned: total, totalActive },
    };
  },

  async voucherReport(filters: ReportFilters) {
    const { tenantId, status, page = 1, pageSize = 50 } = filters;

    const where: Prisma.VoucherWhereInput = { tenantId };
    if (status) where.status = status as Prisma.EnumVoucherStatusFilter["equals"];

    const [data, total, statusCounts] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          batch: { select: { batchNumber: true, plan: { select: { name: true, price: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.voucher.count({ where }),
      prisma.voucher.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
      }),
    ]);

    const summary = {
      generated: 0,
      sold: 0,
      redeemed: 0,
      expired: 0,
    };
    for (const sc of statusCounts) {
      const key = sc.status.toLowerCase() as keyof typeof summary;
      if (key in summary) summary[key] = sc._count;
    }

    return {
      data: data.map((v) => ({
        id: v.id,
        code: v.code,
        status: v.status,
        batchName: v.batch.batchNumber,
        planName: v.batch.plan?.name ?? null,
        planPrice: v.batch.plan ? Number(v.batch.plan.price) : 0,
        createdAt: v.createdAt,
        redeemedAt: v.redeemedAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary,
    };
  },

  async nasReport(filters: ReportFilters) {
    const { tenantId } = filters;

    const nasDevices = await prisma.nasDevice.findMany({
      where: { tenantId },
      include: {
        location: { select: { name: true } },
        _count: { select: { subscribers: true } },
      },
      orderBy: { name: "asc" },
    });

    return {
      data: nasDevices.map((nas) => ({
        id: nas.id,
        name: nas.name,
        nasIp: nas.nasIp,
        nasType: nas.nasType,
        status: nas.status,
        locationName: nas.location?.name ?? null,
        subscriberCount: nas._count.subscribers,
      })),
      total: nasDevices.length,
    };
  },

  async sessionReport(filters: ReportFilters & { tenantSlug: string }) {
    const { tenantSlug, startDate, endDate, nasDeviceId, page = 1, pageSize = 50 } = filters;

    const where: Prisma.RadAcctWhereInput = {
      username: { startsWith: `${tenantSlug}_` },
    };

    if (startDate || endDate) {
      where.acctstarttime = {};
      if (startDate) where.acctstarttime.gte = startOfDay(startDate);
      if (endDate) where.acctstarttime.lte = endOfDay(endDate);
    }

    if (nasDeviceId) {
      // Resolve NAS IP from device ID
      const nas = await prisma.nasDevice.findUnique({
        where: { id: nasDeviceId },
        select: { nasIp: true },
      });
      if (nas) where.nasipaddress = nas.nasIp;
    }

    const [data, total] = await Promise.all([
      prisma.radAcct.findMany({
        where,
        orderBy: { acctstarttime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.radAcct.count({ where }),
    ]);

    // Calculate total usage
    const usageAgg = await prisma.radAcct.aggregate({
      where,
      _sum: { acctinputoctets: true, acctoutputoctets: true, acctsessiontime: true },
    });

    return {
      data: data.map((s) => ({
        id: s.id,
        username: s.username.replace(`${tenantSlug}_`, ""),
        nasIp: s.nasipaddress,
        startTime: s.acctstarttime,
        stopTime: s.acctstoptime,
        sessionTime: s.acctsessiontime ?? 0,
        inputBytes: Number(s.acctinputoctets ?? 0),
        outputBytes: Number(s.acctoutputoctets ?? 0),
        framedIp: s.framedipaddress,
        mac: s.callingstationid,
        terminateCause: s.acctterminatecause,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        totalSessions: total,
        totalUpload: Number(usageAgg._sum.acctinputoctets ?? 0),
        totalDownload: Number(usageAgg._sum.acctoutputoctets ?? 0),
        totalSessionTime: Number(usageAgg._sum.acctsessiontime ?? 0),
      },
    };
  },

  async usageReport(filters: ReportFilters & { tenantSlug: string }) {
    const { tenantSlug, tenantId, startDate, endDate, planId, page = 1, pageSize = 50 } = filters;

    // Get subscribers with their usage from radacct
    const subWhere: Prisma.SubscriberWhereInput = {
      tenantId,
      deletedAt: null,
      status: "ACTIVE",
    };
    if (planId) subWhere.planId = planId;

    const [subscribers, total] = await Promise.all([
      prisma.subscriber.findMany({
        where: subWhere,
        include: {
          plan: { select: { name: true, dataLimit: true, dataUnit: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subscriber.count({ where: subWhere }),
    ]);

    // For each subscriber, get their usage from radacct
    const usageData = await Promise.all(
      subscribers.map(async (sub) => {
        const radWhere: Prisma.RadAcctWhereInput = {
          username: `${tenantSlug}_${sub.username}`,
        };
        if (startDate || endDate) {
          radWhere.acctstarttime = {};
          if (startDate) radWhere.acctstarttime.gte = startOfDay(startDate);
          if (endDate) radWhere.acctstarttime.lte = endOfDay(endDate);
        }

        const usage = await prisma.radAcct.aggregate({
          where: radWhere,
          _sum: { acctinputoctets: true, acctoutputoctets: true },
          _count: true,
        });

        const totalBytes = Number(usage._sum.acctinputoctets ?? 0) + Number(usage._sum.acctoutputoctets ?? 0);

        return {
          id: sub.id,
          name: sub.name,
          username: sub.username,
          planName: sub.plan?.name ?? null,
          dataLimit: sub.plan?.dataLimit ?? null,
          dataUnit: sub.plan?.dataUnit ?? null,
          uploadBytes: Number(usage._sum.acctinputoctets ?? 0),
          downloadBytes: Number(usage._sum.acctoutputoctets ?? 0),
          totalBytes,
          sessionCount: usage._count,
        };
      })
    );

    return {
      data: usageData,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
