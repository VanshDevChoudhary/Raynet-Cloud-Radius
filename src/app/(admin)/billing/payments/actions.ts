"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { paymentSchema } from "@/lib/validations/payment.schema";
import { paymentService } from "@/services/payment.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function recordPayment(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId, user } = await requireAuthorized("payments", "create");
    const validated = paymentSchema.safeParse(formData);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message ?? "Invalid input",
      };
    }

    await paymentService.recordPayment(
      tenantId,
      validated.data,
      user.id
    );

    revalidatePath("/billing/payments");
    revalidatePath("/billing/invoices");
    if (validated.data.invoiceId) {
      revalidatePath(`/billing/invoices/${validated.data.invoiceId}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to record payment"),
    };
  }
}
