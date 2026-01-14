import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Subscriber } from "@/generated/prisma";

export interface PortalSubscriber {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  username: string;
  status: string;
  planName: string | null;
  planSpeed: string | null;
  dataLimit: string | null;
  expiryDate: Date | null;
  balance: number;
  address: string | null;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  total: number;
  balanceDue: number;
  status: string;
  invoiceDate: Date;
  dueDate: Date;
  planName: string | null;
}

export interface PortalTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: Date;
}

export interface PortalUsageData {
  totalUpload: number;
  totalDownload: number;
  totalBytes: number;
  sessionCount: number;
}

export const portalService = {
  async authenticateSubscriber(
    tenantSlug: string,
    username: string,
    password: string
  ): Promise<Subscriber | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) return null;

    const subscriber = await prisma.subscriber.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { username },
          { phone: username },
        ],
        deletedAt: null,
      },
    });
    if (!subscriber) return null;

    const isValid = await bcrypt.compare(password, subscriber.passwordHash);
    if (!isValid) return null;

    return subscriber;
  },

  async getSubscriberProfile(subscriberId: string, tenantId: string): Promise<PortalSubscriber | null> {
    const sub = await prisma.subscriber.findFirst({
      where: { id: subscriberId, tenantId, deletedAt: null },
      include: {
        plan: {
          select: {
            name: true,
            downloadSpeed: true,
            uploadSpeed: true,
            speedUnit: true,
            dataLimit: true,
            dataUnit: true,
          },
        },
      },
    });
    if (!sub) return null;

    return {
      id: sub.id,
      name: sub.name,
      phone: sub.phone,
      email: sub.email,
      username: sub.username,
      status: sub.status,
      planName: sub.plan?.name ?? null,
      planSpeed: sub.plan
        ? `${sub.plan.downloadSpeed}/${sub.plan.uploadSpeed} ${sub.plan.speedUnit}`
        : null,
      dataLimit: sub.plan
        ? sub.plan.dataUnit === "UNLIMITED"
          ? "Unlimited"
          : `${sub.plan.dataLimit} ${sub.plan.dataUnit}`
        : null,
      expiryDate: sub.expiryDate,
      balance: Number(sub.balance),
      address: sub.address,
    };
  },

  async getSubscriberInvoices(
    subscriberId: string,
    tenantId: string,
    page = 1,
    pageSize = 10
  ) {
    const where = { subscriberId, tenantId };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { plan: { select: { name: true } } },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    const invoices: PortalInvoice[] = data.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      amount: Number(i.amount),
      total: Number(i.total),
      balanceDue: Number(i.balanceDue),
      status: i.status,
      invoiceDate: i.invoiceDate,
      dueDate: i.dueDate,
      planName: i.plan?.name ?? null,
    }));

    return { data: invoices, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getSubscriberTickets(
    subscriberId: string,
    tenantId: string,
    page = 1,
    pageSize = 10
  ) {
    const where = { subscriberId, tenantId };

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    const tickets: PortalTicket[] = data.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      category: t.category,
      createdAt: t.createdAt,
    }));

    return { data: tickets, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getUsageData(
    subscriberUsername: string,
    tenantSlug: string
  ): Promise<PortalUsageData> {
    const radiusUsername = `${tenantSlug}_${subscriberUsername}`;

    const result = await prisma.radAcct.aggregate({
      where: { username: radiusUsername },
      _sum: { acctinputoctets: true, acctoutputoctets: true },
      _count: true,
    });

    const totalUpload = Number(result._sum.acctinputoctets ?? 0);
    const totalDownload = Number(result._sum.acctoutputoctets ?? 0);

    return {
      totalUpload,
      totalDownload,
      totalBytes: totalUpload + totalDownload,
      sessionCount: result._count,
    };
  },

  async createTicket(params: {
    subscriberId: string;
    tenantId: string;
    subject: string;
    description: string;
    category: string;
  }) {
    // Generate ticket number
    const lastTicket = await prisma.ticket.findFirst({
      where: { tenantId: params.tenantId },
      orderBy: { createdAt: "desc" },
      select: { ticketNumber: true },
    });

    let nextNum = 1;
    if (lastTicket?.ticketNumber) {
      const match = lastTicket.ticketNumber.match(/TKT-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const ticketNumber = `TKT-${String(nextNum).padStart(3, "0")}`;

    return prisma.ticket.create({
      data: {
        tenantId: params.tenantId,
        subscriberId: params.subscriberId,
        ticketNumber,
        subject: params.subject,
        description: params.description,
        category: params.category as "CONNECTIVITY" | "BILLING" | "SPEED" | "INSTALLATION" | "OTHER",
        status: "OPEN",
        priority: "MEDIUM",
      },
    });
  },

  async updateProfile(
    subscriberId: string,
    tenantId: string,
    data: { name?: string; phone?: string; email?: string; address?: string }
  ) {
    return prisma.subscriber.update({
      where: { id: subscriberId, tenantId },
      data,
    });
  },
};
