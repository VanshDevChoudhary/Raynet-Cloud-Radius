"use server";

import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/lib/types";

export async function saveBillingPreferences(data: {
  currency: string;
  invoicePrefix: string;
  taxRate: number;
  taxLabel: string;
  gracePeriodDays: number;
  autoGenerateInvoices: boolean;
}): Promise<ActionResponse> {
  const user = await requireTenantUser();
  authorize(user.role, "settings", "edit");

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId! },
      select: { settings: true },
    });
    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};
    const currentBilling = (currentSettings.billing as Record<string, unknown>) || {};

    await prisma.tenant.update({
      where: { id: user.tenantId! },
      data: {
        settings: {
          ...currentSettings,
          billing: {
            ...currentBilling,
            currency: data.currency,
            invoicePrefix: data.invoicePrefix,
            taxRate: data.taxRate,
            taxLabel: data.taxLabel,
            gracePeriodDays: data.gracePeriodDays,
            autoGenerateInvoices: data.autoGenerateInvoices,
          },
        },
      },
    });

    revalidatePath("/settings/billing-preferences");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save" };
  }
}
