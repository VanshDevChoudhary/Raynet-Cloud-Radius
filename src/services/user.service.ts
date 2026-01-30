import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { User, Location, UserRole, UserStatus, Prisma } from "@/generated/prisma";

type UserWithLocation = User & { location: Location | null };

export const userService = {
  async list(
    tenantId: string,
    filters?: { role?: UserRole; status?: UserStatus; search?: string }
  ): Promise<UserWithLocation[]> {
    const where: Prisma.UserWhereInput = { tenantId };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.user.findMany({
      where,
      include: { location: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(tenantId: string, userId: string): Promise<UserWithLocation | null> {
    return prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { location: true },
    });
  },

  async create(
    tenantId: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role: UserRole;
      locationId?: string;
    }
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 12);

    return prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: data.role,
        locationId: data.locationId || null,
      },
    });
  },

  async update(
    tenantId: string,
    userId: string,
    data: {
      name?: string;
      phone?: string;
      role?: UserRole;
      status?: UserStatus;
      locationId?: string | null;
    }
  ): Promise<User> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new Error("User not found");

    const updateData: Prisma.UserUncheckedUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.locationId !== undefined) updateData.locationId = data.locationId;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  },

  async deactivate(tenantId: string, userId: string): Promise<User> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new Error("User not found");

    return prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });
  },

  async activate(tenantId: string, userId: string): Promise<User> {
    const existing = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!existing) throw new Error("User not found");

    return prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });
  },

  // Returns the given location plus all child locations (recursive)
  // for franchise/manager scoping
  async getLocationScope(tenantId: string, locationId: string): Promise<string[]> {
    const ids: string[] = [locationId];

    const children = await prisma.location.findMany({
      where: { tenantId, parentId: locationId },
      select: { id: true },
    });

    for (const child of children) {
      const childIds = await userService.getLocationScope(tenantId, child.id);
      ids.push(...childIds);
    }

    return ids;
  },
};
