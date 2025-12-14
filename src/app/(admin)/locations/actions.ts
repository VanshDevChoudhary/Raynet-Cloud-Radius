"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { locationSchema } from "@/lib/validations/location.schema";
import { locationService } from "@/services/location.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function createLocation(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("locations", "create");
    const validated = locationSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const location = await locationService.create(tenantId, validated.data);
    revalidatePath("/locations");
    return { success: true, data: location };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to create location") };
  }
}

export async function updateLocation(id: string, formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("locations", "edit");
    const validated = locationSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const location = await locationService.update(tenantId, id, validated.data);
    revalidatePath("/locations");
    return { success: true, data: location };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to update location") };
  }
}

export async function deleteLocation(id: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("locations", "delete");
    await locationService.delete(tenantId, id);
    revalidatePath("/locations");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to delete location") };
  }
}
