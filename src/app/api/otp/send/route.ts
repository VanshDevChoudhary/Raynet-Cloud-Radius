import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/session";
import { otpService } from "@/services/otp.service";
import { sendOtpSchema } from "@/lib/validations/otp.schema";
import { otpSendLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Get tenant ID
    const tenantId = await requireTenantId();

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = sendOtpSchema.parse(body);

    // Rate limiting - per phone number
    const rateLimitResult = await otpSendLimiter.check(validated.phone);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Send OTP
    const result = await otpService.sendOtp({
      tenantId,
      phone: validated.phone,
      purpose: validated.purpose,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        expiresAt: result.expiresAt,
        message: "OTP sent successfully",
      },
      {
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error("[Send OTP API] Error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
