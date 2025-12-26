import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/session";
import { otpService } from "@/services/otp.service";
import { verifyOtpSchema } from "@/lib/validations/otp.schema";
import { otpVerifyLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Get tenant ID
    const tenantId = await requireTenantId();

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = verifyOtpSchema.parse(body);

    // Rate limiting - per phone number
    const rateLimitResult = await otpVerifyLimiter.check(validated.phone);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.error,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Verify OTP
    const result = await otpService.verifyOtp({
      tenantId,
      phone: validated.phone,
      code: validated.code,
      purpose: validated.purpose,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        {
          status: 400,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully",
      },
      {
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error) {
    console.error("[Verify OTP API] Error:", error);

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
