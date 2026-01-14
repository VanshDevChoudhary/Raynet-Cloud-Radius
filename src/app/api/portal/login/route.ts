import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { z } from "zod";

function getPortalSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET must be set and at least 32 characters long"
    );
  }
  return new TextEncoder().encode(secret);
}

// Rate limiter: track failed attempts per IP
const loginAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return true;
  if (now - record.lastAttempt > LOCKOUT_MS) {
    loginAttempts.delete(ip);
    return true;
  }
  return record.count < MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.lastAttempt > LOCKOUT_MS) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// Cleanup stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts) {
    if (now - val.lastAttempt > LOCKOUT_MS) loginAttempts.delete(key);
  }
}, 30 * 60 * 1000);

const portalLoginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
  tenantSlug: z.string().trim().min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = portalLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password, tenantSlug } = parsed.data;

    // Resolve tenant first
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true, status: true },
    });

    if (!tenant || !["ACTIVE", "TRIAL"].includes(tenant.status)) {
      // Constant-time: always compare a dummy password to prevent timing leak
      const bcrypt = await import("bcryptjs");
      await bcrypt.compare(password, "$2a$12$000000000000000000000uGEBJHnSON3HPq8tOMiPbZxp0h8DpC");
      recordFailedAttempt(ip);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Tenant-scoped subscriber lookup — NEVER search across all tenants
    const subscriber = await prisma.subscriber.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [{ username }, { phone: username }],
        deletedAt: null,
      },
    });

    if (!subscriber) {
      const bcrypt = await import("bcryptjs");
      await bcrypt.compare(password, "$2a$12$000000000000000000000uGEBJHnSON3HPq8tOMiPbZxp0h8DpC");
      recordFailedAttempt(ip);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const bcrypt = await import("bcryptjs");
    const isValid = await bcrypt.compare(password, subscriber.passwordHash);
    if (!isValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    clearAttempts(ip);

    // Create JWT token for portal session
    const token = await new SignJWT({
      subscriberId: subscriber.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      username: subscriber.username,
      name: subscriber.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(getPortalSecret());

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("portal-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Portal Login]", error);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
