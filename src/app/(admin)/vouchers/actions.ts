"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { generateVoucherBatchSchema, markVoucherSoldSchema } from "@/lib/validations/voucher.schema";
import { voucherService } from "@/services/voucher.service";
import { safeErrorMessage, serialize, type ActionResponse } from "@/lib/types";

export async function generateVoucherBatch(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("vouchers", "create");
    const validated = generateVoucherBatchSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const batch = await voucherService.generateBatch(tenantId, validated.data);
    revalidatePath("/vouchers");
    return { success: true, data: serialize(batch) };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to generate vouchers") };
  }
}

export async function markVouchersSold(voucherIds: string[], formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("vouchers", "edit");
    const validated = markVoucherSoldSchema.safeParse(formData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Invalid input" };
    }
    const result = await voucherService.markAsSold(tenantId, voucherIds, validated.data.soldTo);
    revalidatePath("/vouchers");
    return { success: true, data: serialize(result) };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to mark vouchers as sold") };
  }
}

export async function deleteVoucherBatch(batchId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("vouchers", "delete");
    await voucherService.deleteBatch(tenantId, batchId);
    revalidatePath("/vouchers");
    return { success: true };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to delete batch") };
  }
}

export async function getVouchersForPrint(batchId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("vouchers", "view");
    const data = await voucherService.getVouchersForPrint(tenantId, batchId);
    return { success: true, data: serialize(data) };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to get vouchers") };
  }
}

export async function exportVoucherBatchCsv(batchId: string): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("vouchers", "export");
    const data = await voucherService.exportBatchCsv(tenantId, batchId);
    return { success: true, data: serialize(data) };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to export vouchers") };
  }
}
