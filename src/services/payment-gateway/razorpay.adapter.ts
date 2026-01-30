import crypto from "crypto";
import type {
  PaymentGatewayAdapter,
  PaymentGatewayConfig,
  CreateOrderParams,
  CreateOrderResponse,
  VerifyPaymentParams,
} from "./gateway.interface";

export class RazorpayAdapter implements PaymentGatewayAdapter {
  private config: PaymentGatewayConfig;
  private baseUrl: string;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
    this.baseUrl = config.isTestMode
      ? "https://api.razorpay.com/v1"
      : "https://api.razorpay.com/v1";
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString(
      "base64"
    );

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        receipt: params.receiptId,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay API error: ${error.error?.description}`);
    }

    const data = await response.json();

    return {
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<boolean> {
    const { orderId, paymentId, signature } = params;

    const generatedSignature = crypto
      .createHmac("sha256", this.config.apiSecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return generatedSignature === signature;
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) return false;

    const generatedSignature = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("hex");

    return generatedSignature === signature;
  }
}
