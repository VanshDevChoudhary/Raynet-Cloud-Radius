"use server";

import { prisma } from "@/lib/prisma";

/**
 * Check if the tenant associated with the given email is suspended.
 * Returns true if suspended, false otherwise. Does NOT confirm if email exists.
 */
export async function isTenantSuspended(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { tenant: { select: { status: true } } },
  });

  if (!user?.tenant) return false;
  return !["ACTIVE", "TRIAL"].includes(user.tenant.status);
}
