"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { createTicketSchema, updateTicketSchema, addCommentSchema } from "@/lib/validations/ticket.schema";
import { ticketService } from "@/services/ticket.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function createTicket(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("complaints", "create");
    const validated = createTicketSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const ticket = await ticketService.create(tenantId, validated.data);
    revalidatePath("/complaints");
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to create ticket") };
  }
}

export async function updateTicket(ticketId: string, formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("complaints", "edit");
    const validated = updateTicketSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const ticket = await ticketService.update(tenantId, ticketId, validated.data);
    revalidatePath("/complaints");
    revalidatePath(`/complaints/${ticketId}`);
    return { success: true, data: ticket };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to update ticket") };
  }
}

export async function addComment(ticketId: string, formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId, user } = await requireAuthorized("complaints", "edit");
    const validated = addCommentSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const comment = await ticketService.addComment(tenantId, ticketId, user.id, validated.data);
    revalidatePath(`/complaints/${ticketId}`);
    return { success: true, data: comment };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to add comment") };
  }
}

export async function deleteTicket(ticketId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("complaints", "delete");
    await ticketService.delete(tenantId, ticketId);
    revalidatePath("/complaints");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to delete ticket") };
  }
}
