import { prisma } from "@/lib/prisma";
import type {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "@/generated/prisma";

export interface CreateNotificationLogParams {
  tenantId: string;
  subscriberId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  error?: string;
  gatewayResponse?: Prisma.InputJsonValue;
  sentAt?: Date;
}

export interface UpdateNotificationLogParams {
  status: NotificationStatus;
  error?: string;
  gatewayResponse?: Prisma.InputJsonValue;
  sentAt?: Date;
}

export interface NotificationLogFilters {
  subscriberId?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  startDate?: Date;
  endDate?: Date;
}

export const notificationLogService = {
  async create(params: CreateNotificationLogParams) {
    return prisma.notificationLog.create({
      data: params,
    });
  },

  async update(id: string, params: UpdateNotificationLogParams) {
    return prisma.notificationLog.update({
      where: { id },
      data: params,
    });
  },

  async getAll(
    tenantId: string,
    filters: NotificationLogFilters = {},
    page = 1,
    limit = 50
  ) {
    const where: any = {
      tenantId,
    };

    if (filters.subscriberId) {
      where.subscriberId = filters.subscriberId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.channel) {
      where.channel = filters.channel;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          subscriber: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getBySubscriber(subscriberId: string, limit = 20) {
    return prisma.notificationLog.findMany({
      where: { subscriberId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async getStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, sent, failed, pending, byChannel, byType] = await Promise.all([
      // Total notifications
      prisma.notificationLog.count({ where }),

      // Sent successfully
      prisma.notificationLog.count({
        where: { ...where, status: "SENT" },
      }),

      // Failed
      prisma.notificationLog.count({
        where: { ...where, status: "FAILED" },
      }),

      // Pending
      prisma.notificationLog.count({
        where: { ...where, status: "PENDING" },
      }),

      // By channel
      prisma.notificationLog.groupBy({
        by: ["channel"],
        where,
        _count: true,
      }),

      // By type
      prisma.notificationLog.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : "0",
      byChannel: byChannel.reduce(
        (acc, item) => {
          acc[item.channel] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byType: byType.reduce(
        (acc, item) => {
          acc[item.type] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },

  async cleanup(tenantId: string, daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return prisma.notificationLog.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  },
};
