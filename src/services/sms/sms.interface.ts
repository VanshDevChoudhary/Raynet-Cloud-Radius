export interface SmsConfig {
  apiKey: string;
  senderId: string;
  apiUrl?: string;
  config?: Record<string, unknown>;
}

export interface SendSmsParams {
  to: string; // Phone number with country code (e.g., +919876543210)
  message: string;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  gatewayResponse?: Record<string, unknown>;
}

export interface SmsAdapter {
  sendSms(params: SendSmsParams): Promise<SendSmsResponse>;
  getBalance?(): Promise<number | null>;
  verifyWebhookSignature?(payload: string, signature: string): boolean;
}
