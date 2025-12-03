"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { leadSchema } from "@/lib/validations/lead.schema";
import { leadService } from "@/services/lead.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function createLead(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("leads", "create");
    const validated = leadSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const lead = await leadService.create(tenantId, validated.data);
    revalidatePath("/leads");
    return { success: true, data: lead };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to create lead") };
  }
}

export async function updateLead(leadId: string, formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("leads", "edit");
    const validated = leadSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const lead = await leadService.update(tenantId, leadId, validated.data);
    revalidatePath("/leads");
    return { success: true, data: lead };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to update lead") };
  }
}

export async function updateLeadStatus(leadId: string, status: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("leads", "edit");
    const lead = await leadService.updateStatus(tenantId, leadId, status);
    revalidatePath("/leads");
    return { success: true, data: lead };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to update status") };
  }
}

export async function deleteLead(leadId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("leads", "delete");
    await leadService.delete(tenantId, leadId);
    revalidatePath("/leads");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to delete lead") };
  }
}

export async function markLeadConverted(leadId: string, subscriberId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("leads", "edit");
    await leadService.markConverted(tenantId, leadId, subscriberId);
    revalidatePath("/leads");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to mark converted") };
  }
}
