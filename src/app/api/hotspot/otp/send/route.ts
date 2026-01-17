import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { otpService } from "@/services/otp.service";
import { otpSendLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, phone } = body;

    if (!tenantSlug || !phone) {
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
    const rateLimitResult = await otpSendLimiter.check(phone);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429 }
      );
    }

    // Send OTP
    const result = await otpService.sendOtp({
      tenantId: tenant.id,
      phone,
      purpose: "login",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("[Hotspot OTP Send] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
