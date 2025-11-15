"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { invoiceSchema } from "@/lib/validations/invoice.schema";
import { billingService } from "@/services/billing.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function createInvoice(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("billing", "create");
    const validated = invoiceSchema.safeParse(formData);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Invalid input",
      };
    }

    await billingService.createInvoice(tenantId, validated.data);
    revalidatePath("/billing/invoices");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to create invoice"),
    };
  }
}

export async function updateInvoice(
  id: string,
  formData: unknown
): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("billing", "edit");
    const validated = invoiceSchema.partial().safeParse(formData);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Invalid input",
      };
    }

    await billingService.updateInvoice(tenantId, id, validated.data);
    revalidatePath("/billing/invoices");
    revalidatePath(`/billing/invoices/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to update invoice"),
    };
  }
}

export async function cancelInvoice(id: string, reason?: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("billing", "delete");
    await billingService.voidInvoice(tenantId, id, reason);
    revalidatePath("/billing/invoices");
    revalidatePath(`/billing/invoices/${id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to cancel invoice"),
    };
  }
}

export async function getPendingInvoices(subscriberId: string): Promise<ActionResponse<Array<{ id: string; invoiceNumber: string; balanceDue: string }>>> {
  try {
    const { tenantId } = await requireAuthorized("billing", "view");
    const { prisma } = await import("@/lib/prisma");
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        subscriberId,
        status: { in: ["ISSUED", "OVERDUE"] },
        balanceDue: { gt: 0 },
      },
      select: { id: true, invoiceNumber: true, balanceDue: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        balanceDue: String(inv.balanceDue),
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to fetch invoices"),
    };
  }
}

export async function downloadInvoicePdf(id: string): Promise<ActionResponse<string>> {
  try {
    await requireAuthorized("billing", "export");
    return { success: true, data: `/api/invoices/${id}/pdf` };
  } catch (error) {
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to generate PDF"),
    };
  }
}
