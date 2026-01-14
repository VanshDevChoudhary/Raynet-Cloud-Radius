import { cookies } from "next/headers";
import { jwtVerify } from "jose";

function getPortalSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET must be set and at least 32 characters long"
    );
  }
  return new TextEncoder().encode(secret);
}

export interface PortalSession {
  subscriberId: string;
  tenantId: string;
  tenantSlug: string;
  username: string;
  name: string;
}

export async function getPortalSession(): Promise<PortalSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("portal-token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getPortalSecret());

    return {
      subscriberId: payload.subscriberId as string,
      tenantId: payload.tenantId as string,
      tenantSlug: payload.tenantSlug as string,
      username: payload.username as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function requirePortalSession(): Promise<PortalSession> {
  const session = await getPortalSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}
