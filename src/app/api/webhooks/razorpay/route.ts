import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RazorpayAdapter } from "@/services/payment-gateway/razorpay.adapter";
import { billingService } from "@/services/billing.service";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Parse payload
    const event = JSON.parse(payload);
    const { payment, order } = event.payload;

    // Get tenant from order notes
    const tenantId = order.notes?.tenantId;
    if (!tenantId) {
      console.error("Missing tenantId in order notes");
      return NextResponse.json({ error: "Invalid order" }, { status: 400 });
    }

    // Get gateway config
    const gateway = await prisma.paymentGateway.findFirst({
      where: { tenantId, provider: "RAZORPAY", status: "ACTIVE" },
    });

    if (!gateway) {
      return NextResponse.json({ error: "Gateway not configured" }, { status: 400 });
    }

    // Verify signature
    const adapter = new RazorpayAdapter({
      apiKey: gateway.apiKey,
      apiSecret: gateway.apiSecret,
      webhookSecret: gateway.webhookSecret || "",
      isTestMode: gateway.isTestMode,
    });

    if (!adapter.verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Handle event
    if (event.event === "payment.captured") {
      // Find pending payment record
      const existingPayment = await prisma.payment.findFirst({
        where: {
          tenantId,
          gatewayOrderId: order.id,
          status: "PENDING",
        },
      });

      if (existingPayment) {
        // Update to completed
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "COMPLETED",
            transactionId: payment.id,
            gatewayResponse: event.payload,
          },
        });

        // Mark invoice as paid if linked
        if (existingPayment.invoiceId) {
          await billingService.markAsPaid(tenantId, existingPayment.invoiceId);
        }
      }
    }

    if (event.event === "payment.failed") {
      const existingPayment = await prisma.payment.findFirst({
        where: { tenantId, gatewayOrderId: order.id },
      });

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "FAILED",
            gatewayResponse: event.payload,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
