"use server";

import { requireAuthorized } from "@/lib/session";
import { radiusService } from "@/services/radius.service";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { safeErrorMessage } from "@/lib/types";

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function cleanupStaleSessionsAction(): Promise<ActionResponse & { cleaned?: number }> {
  try {
    const { user } = await requireAuthorized("online_users", "edit");

    if (!user.tenantSlug) {
      return { success: false, error: "No tenant context" };
    }

    const cleaned = await radiusService.cleanupStaleSessions(user.tenantSlug, 15);

    revalidatePath("/online-users");
    return { success: true, cleaned };
  } catch (error) {
    console.error("Cleanup stale sessions error:", error);
    return {
      success: false,
      error: safeErrorMessage(error, "Internal error"),
    };
  }
}

export async function disconnectUserAction(
  radiusUsername: string,
  nasIp: string
): Promise<ActionResponse> {
  try {
    const { tenantId } = await requireAuthorized("online_users", "edit");

    // Get NAS secret
    const nas = await prisma.nasDevice.findFirst({
      where: { tenantId, nasIp },
    });

    if (!nas) {
      return { success: false, error: "NAS device not found" };
    }

    // Send CoA disconnect
    const success = await radiusService.disconnectUser(
      nasIp,
      radiusUsername,
      nas.secret
    );

    if (!success) {
      return { success: false, error: "Failed to send disconnect command" };
    }

    revalidatePath("/online-users");
    return { success: true };
  } catch (error) {
    console.error("Disconnect action error:", error);
    return {
      success: false,
      error: safeErrorMessage(error, "Internal error"),
    };
  }
}
