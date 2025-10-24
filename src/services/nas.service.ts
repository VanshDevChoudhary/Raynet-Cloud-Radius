import { prisma } from "@/lib/prisma";
import type { CreateNasDeviceInput, UpdateNasDeviceInput } from "@/lib/validations/nas.schema";
import type { NasDevice, Prisma } from "@/generated/prisma";
import { radiusService } from "./radius.service";
import { exec } from "child_process";

// Requires passwordless sudo configured in /etc/sudoers.d/freeradius-restart
function reloadFreeRadius(): void {
  exec("sudo systemctl restart freeradius", (error) => {
    if (error) {
      console.error("[NAS] FreeRADIUS restart failed:", error.message);
    } else {
      console.log("[NAS] FreeRADIUS restarted (NAS client change)");
    }
  });
}

export interface NasListParams {
  tenantId: string;
  search?: string;
  status?: string;
  nasType?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const nasService = {
  async list(params: NasListParams) {
    const {
      tenantId,
      search,
      status,
      nasType,
      locationId,
      page = 1,
      pageSize = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const where: Prisma.NasDeviceWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nasIp: { contains: search, mode: "insensitive" } },
        { shortName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status as NasDevice["status"];
    if (nasType) where.nasType = nasType as NasDevice["nasType"];
    if (locationId) where.locationId = locationId;

    const [data, total] = await Promise.all([
      prisma.nasDevice.findMany({
        where,
        include: { location: true, _count: { select: { subscribers: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.nasDevice.count({ where }),
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
    return prisma.nasDevice.findFirst({
      where: { id, tenantId },
      include: { location: true },
    });
  },

  async create(tenantId: string, input: CreateNasDeviceInput) {
    // Check for duplicate IP
    const existing = await prisma.nasDevice.findFirst({
      where: { tenantId, nasIp: input.nasIp },
    });
    if (existing) {
      throw new Error(`A NAS device with IP ${input.nasIp} already exists`);
    }

    const nas = await prisma.nasDevice.create({
      data: {
        tenantId,
        ...input,
        shortName: input.shortName ?? null,
        description: input.description ?? null,
        locationId: input.locationId ?? null,
        ports: input.ports ?? null,
        community: input.community ?? null,
      },
    });

    // Sync to RADIUS and restart FreeRADIUS to pick up new client
    try {
      await radiusService.syncNasDevice(nas);
      reloadFreeRadius();
    } catch (error) {
      console.error("[NAS] RADIUS sync failed on create:", error);
    }

    return nas;
  },

  async update(tenantId: string, id: string, input: UpdateNasDeviceInput) {
    const existing = await prisma.nasDevice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error("NAS device not found");

    const updated = await prisma.nasDevice.update({
      where: { id },
      data: {
        ...input,
        shortName: input.shortName ?? null,
        description: input.description ?? null,
        locationId: input.locationId ?? null,
        ports: input.ports ?? null,
        community: input.community ?? null,
      },
    });

    // Sync to RADIUS and restart FreeRADIUS to pick up changes
    try {
      await radiusService.syncNasDevice(updated);
      reloadFreeRadius();
    } catch (error) {
      console.error("[NAS] RADIUS sync failed on update:", error);
    }

    return updated;
  },

  async delete(tenantId: string, id: string) {
    const nas = await prisma.nasDevice.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { subscribers: true } } },
    });
    if (!nas) throw new Error("NAS device not found");
    if (nas._count.subscribers > 0) {
      throw new Error("Cannot delete NAS with assigned subscribers");
    }

    // Remove from RADIUS and restart FreeRADIUS
    try {
      await radiusService.removeNasDevice(nas.nasIp);
      reloadFreeRadius();
    } catch (error) {
      console.error("[NAS] RADIUS cleanup failed on delete:", error);
    }

    return prisma.nasDevice.delete({ where: { id } });
  },

  async listAll(tenantId: string) {
    return prisma.nasDevice.findMany({
      where: { tenantId, status: "ACTIVE" },
      orderBy: { name: "asc" },
      include: { location: true },
    });
  },
};
