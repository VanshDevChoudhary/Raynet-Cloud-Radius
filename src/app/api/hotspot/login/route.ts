import { NextRequest, NextResponse } from "next/server";
import { captivePortalService } from "@/services/captive-portal.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, method } = body;

    if (!tenantSlug || !method) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (method === "userpass") {
      const { username, password } = body;
      if (!username || !password) {
        return NextResponse.json(
          { success: false, error: "Username and password required" },
          { status: 400 }
        );
      }

      const result = await captivePortalService.authenticateUserPass(
        tenantSlug,
        username,
        password
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        name: result.subscriber.name,
        plan: result.subscriber.plan,
        radiusUsername: result.radiusUsername,
      });
    }

    if (method === "voucher") {
      const { voucherCode } = body;
      if (!voucherCode) {
        return NextResponse.json(
          { success: false, error: "Voucher code required" },
          { status: 400 }
        );
      }

      const result = await captivePortalService.authenticateVoucher(
        tenantSlug,
        voucherCode
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        plan: result.plan,
        expiresAt: result.expiresAt,
        radiusUsername: result.radiusUsername,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid login method" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Hotspot Login] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
