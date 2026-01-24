"use server";

import { getSessionUser } from "@/lib/session";
import { tenantService } from "@/services/tenant.service";
import { createTenantSchema, updateTenantSchema } from "@/lib/validations/user.schema";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/lib/types";

export async function createTenant(formData: unknown): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validated = createTenantSchema.safeParse(formData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    await tenantService.create(validated.data);
    revalidatePath("/super-admin/tenants");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create tenant",
    };
  }
}

export async function updateTenant(id: string, formData: unknown): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const validated = updateTenantSchema.safeParse(formData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || "Invalid input",
    };
  }

  try {
    await tenantService.update(id, validated.data);
    revalidatePath("/super-admin/tenants");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update tenant",
    };
  }
}

export async function suspendTenant(id: string): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await tenantService.suspend(id);
    revalidatePath("/super-admin/tenants");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to suspend tenant",
    };
  }
}

export async function activateTenant(id: string): Promise<ActionResponse> {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await tenantService.activate(id);
    revalidatePath("/super-admin/tenants");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to activate tenant",
    };
  }
}
