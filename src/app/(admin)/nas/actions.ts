"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { nasDeviceSchema } from "@/lib/validations/nas.schema";
import { nasService } from "@/services/nas.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function createNasDevice(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("nas", "create");
    const validated = nasDeviceSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const nas = await nasService.create(tenantId, validated.data);
    revalidatePath("/nas");
    return { success: true, data: nas };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to create NAS device") };
  }
}

export async function updateNasDevice(id: string, formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("nas", "edit");
    const validated = nasDeviceSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const nas = await nasService.update(tenantId, id, validated.data);
    revalidatePath("/nas");
    return { success: true, data: nas };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to update NAS device") };
  }
}

export async function deleteNasDevice(id: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("nas", "delete");
    await nasService.delete(tenantId, id);
    revalidatePath("/nas");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to delete NAS device") };
  }
}
