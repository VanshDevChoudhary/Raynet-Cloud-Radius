"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { planSchema } from "@/lib/validations/plan.schema";
import { planService } from "@/services/plan.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function createPlan(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("plans", "create");
    const validated = planSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    await planService.create(tenantId, validated.data);
    revalidatePath("/plans");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to create plan") };
  }
}

export async function updatePlan(id: string, formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("plans", "edit");
    const validated = planSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    await planService.update(tenantId, id, validated.data);
    revalidatePath("/plans");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to update plan") };
  }
}

export async function togglePlanStatus(id: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("plans", "edit");
    await planService.toggleStatus(tenantId, id);
    revalidatePath("/plans");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to toggle plan status") };
  }
}

export async function deletePlan(id: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("plans", "delete");
    await planService.delete(tenantId, id);
    revalidatePath("/plans");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to delete plan") };
  }
}
