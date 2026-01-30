"use server";

import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { userService } from "@/services/user.service";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user.schema";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/lib/types";

export async function createUser(formData: unknown): Promise<ActionResponse> {
  const user = await requireTenantUser();
  authorize(user.role, "users", "create");

  const validated = createUserSchema.safeParse(formData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    await userService.create(user.tenantId!, validated.data);
    revalidatePath("/settings/users");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create user",
    };
  }
}

export async function updateUser(
  userId: string,
  formData: unknown
): Promise<ActionResponse> {
  const user = await requireTenantUser();
  authorize(user.role, "users", "edit");

  const validated = updateUserSchema.safeParse(formData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    await userService.update(user.tenantId!, userId, validated.data);
    revalidatePath("/settings/users");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update user",
    };
  }
}

export async function activateUser(userId: string): Promise<ActionResponse> {
  const user = await requireTenantUser();
  authorize(user.role, "users", "edit");

  try {
    await userService.activate(user.tenantId!, userId);
    revalidatePath("/settings/users");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to activate user",
    };
  }
}

export async function deactivateUser(userId: string): Promise<ActionResponse> {
  const user = await requireTenantUser();
  authorize(user.role, "users", "delete");

  try {
    await userService.deactivate(user.tenantId!, userId);
    revalidatePath("/settings/users");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to deactivate user",
    };
  }
}
