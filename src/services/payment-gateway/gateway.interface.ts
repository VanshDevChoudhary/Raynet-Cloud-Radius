export interface PaymentGatewayConfig {
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
  isTestMode: boolean;
}

export interface CreateOrderParams {
  amount: number; // In smallest currency unit (paise for INR)
  currency: string;
  receiptId: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGatewayAdapter {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResponse>;
  verifyPayment(params: VerifyPaymentParams): Promise<boolean>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
