import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth.schema";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// Rate limiter for registration: max 3 per hour per IP
const registerAttempts = new Map<
  string,
  { count: number; firstAttempt: number }
>();
const REG_MAX = 3;
const REG_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRegisterRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = registerAttempts.get(ip);
  if (!record) return true;
  if (now - record.firstAttempt > REG_WINDOW_MS) {
    registerAttempts.delete(ip);
    return true;
  }
  return record.count < REG_MAX;
}

function recordRegisterAttempt(ip: string): void {
  const now = Date.now();
  const record = registerAttempts.get(ip);
  if (!record || now - record.firstAttempt > REG_WINDOW_MS) {
    registerAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (!checkRegisterRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, password, companyName } = validated.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create tenant slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug is taken
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "This company name is already taken. Please choose a different name." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          status: "TRIAL",
          planTier: "STARTER",
          maxOnline: 50,
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          phone,
          passwordHash,
          role: "TENANT_ADMIN",
          status: "ACTIVE",
        },
      });

      return { tenant, user };
    });

    recordRegisterAttempt(ip);

    return NextResponse.json(
      {
        data: {
          tenantId: result.tenant.id,
          tenantSlug: result.tenant.slug,
          userId: result.user.id,
        },
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
