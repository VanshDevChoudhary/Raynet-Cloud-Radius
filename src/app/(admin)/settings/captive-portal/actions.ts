"use server";

import { revalidatePath } from "next/cache";
import { requireAuthorized } from "@/lib/session";
import { captivePortalService } from "@/services/captive-portal.service";
import { safeErrorMessage, type ActionResponse } from "@/lib/types";

export async function saveCaptivePortalConfig(formData: unknown): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("settings", "edit");
    const data = formData as Record<string, unknown>;

    const config = await captivePortalService.upsertConfig(tenantId, {
      isEnabled: data.isEnabled as boolean,
      logoUrl: (data.logoUrl as string) || null,
      backgroundUrl: (data.backgroundUrl as string) || null,
      primaryColor: (data.primaryColor as string) || "#2563eb",
      welcomeTitle: (data.welcomeTitle as string) || "Welcome to WiFi",
      welcomeMessage: (data.welcomeMessage as string) || null,
      termsOfService: (data.termsOfService as string) || null,
      redirectUrl: (data.redirectUrl as string) || null,
      enableOtpLogin: data.enableOtpLogin as boolean,
      enableVoucherLogin: data.enableVoucherLogin as boolean,
      enableUserPassLogin: data.enableUserPassLogin as boolean,
    });

    revalidatePath("/settings/captive-portal");
    return { success: true, data: config };
  } catch (error) {
    return { success: false, error: safeErrorMessage(error, "Failed to save config") };
  }
}
