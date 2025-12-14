import { prisma } from "@/lib/prisma";
import type { CreateLocationInput, UpdateLocationInput } from "@/lib/validations/location.schema";
import type { LocationType, Prisma } from "@/generated/prisma";

export interface LocationListParams {
  tenantId: string;
  search?: string;
  type?: string;
  parentId?: string | null;
  page?: number;
  pageSize?: number;
}

export const locationService = {
  async list(params: LocationListParams) {
    const {
      tenantId,
      search,
      type,
      parentId,
      page = 1,
      pageSize = 50,
    } = params;

    const where: Prisma.LocationWhereInput = { tenantId };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (type) where.type = type as LocationType;
    if (parentId !== undefined) where.parentId = parentId;

    const [data, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          parent: true,
          _count: { select: { children: true, subscribers: true, nasDevices: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.location.count({ where }),
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

  async getTree(tenantId: string) {
    const locations = await prisma.location.findMany({
      where: { tenantId },
      include: {
        _count: { select: { children: true, subscribers: true, nasDevices: true } },
      },
      orderBy: { name: "asc" },
    });

    // Build tree structure
    const map = new Map<string, typeof locations[0] & { children: typeof locations }>();
    const roots: (typeof locations[0] & { children: typeof locations })[] = [];

    for (const loc of locations) {
      map.set(loc.id, { ...loc, children: [] });
    }

    for (const loc of locations) {
      const node = map.get(loc.id)!;
      if (loc.parentId && map.has(loc.parentId)) {
        map.get(loc.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  },

  async getById(tenantId: string, id: string) {
    return prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        parent: true,
        children: true,
        _count: { select: { subscribers: true, nasDevices: true } },
      },
    });
  },

  async create(tenantId: string, input: CreateLocationInput) {
    return prisma.location.create({
      data: {
        tenantId,
        name: input.name,
        type: input.type,
        parentId: input.parentId ?? null,
      },
    });
  },

  async update(tenantId: string, id: string, input: UpdateLocationInput) {
    const existing = await prisma.location.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error("Location not found");

    if (input.parentId === id) {
      throw new Error("Location cannot be its own parent");
    }

    return prisma.location.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        parentId: input.parentId ?? null,
      },
    });
  },

  async delete(tenantId: string, id: string) {
    const location = await prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { children: true, subscribers: true, nasDevices: true } },
      },
    });
    if (!location) throw new Error("Location not found");
    if (location._count.children > 0) {
      throw new Error("Cannot delete location with child locations");
    }
    if (location._count.subscribers > 0 || location._count.nasDevices > 0) {
      throw new Error("Cannot delete location with assigned subscribers or NAS devices");
    }

    return prisma.location.delete({ where: { id } });
  },

  async listAll(tenantId: string) {
    return prisma.location.findMany({
      where: { tenantId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  },
};
