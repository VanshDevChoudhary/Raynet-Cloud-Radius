"use server";

import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResponse } from "@/lib/types";

const companyProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  domain: z.string().trim().url("Domain must be a valid URL").max(200).optional().or(z.literal("")),
  logo: z.string().trim().url("Logo must be a valid URL").max(500).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().regex(/^[+]?[\d\s()-]{7,15}$/, "Invalid phone number").optional().or(z.literal("")),
  taxNumber: z.string().trim().max(30).regex(/^[A-Za-z0-9\- ]*$/, "Invalid tax number format").optional().or(z.literal("")),
});

export async function saveCompanyProfile(data: {
  name: string;
  domain?: string;
  logo?: string;
  address?: string;
  phone?: string;
  taxNumber?: string;
}): Promise<ActionResponse> {
  try {
    const user = await requireTenantUser();
    authorize(user.role, "settings", "edit");

    const validated = companyProfileSchema.parse(data);

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId! },
      select: { settings: true },
    });

    const currentSettings = (tenant?.settings as Record<string, unknown>) || {};

    await prisma.tenant.update({
      where: { id: user.tenantId! },
      data: {
        name: validated.name,
        domain: validated.domain || null,
        logo: validated.logo || null,
        settings: {
          ...currentSettings,
          address: validated.address || "",
          phone: validated.phone || "",
          taxNumber: validated.taxNumber || "",
        },
      },
    });

    revalidatePath("/settings/company");
    return { success: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.errors[0]?.message || "Invalid input" };
    }
    return { success: false, error: "Failed to save company profile" };
  }
}
