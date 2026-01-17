import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpService } from "@/services/otp.service";
import { otpVerifyLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, phone, code } = body;

    if (!tenantSlug || !phone || !code) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Resolve tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Invalid portal" },
        { status: 404 }
      );
    }

    // Rate limit
    const rateLimitResult = await otpVerifyLimiter.check(phone);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Verify OTP
    const result = await otpService.verifyOtp({
      tenantId: tenant.id,
      phone,
      code,
      purpose: "login",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Find subscriber by phone
    const subscriber = await prisma.subscriber.findFirst({
      where: {
        tenantId: tenant.id,
        phone,
        status: "ACTIVE",
      },
      select: { id: true, name: true, username: true },
    });

    return NextResponse.json({
      success: true,
      name: subscriber?.name || "Guest",
      radiusUsername: subscriber
        ? `${tenantSlug}_${subscriber.username}`
        : null,
    });
  } catch (error) {
    console.error("[Hotspot OTP Verify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
