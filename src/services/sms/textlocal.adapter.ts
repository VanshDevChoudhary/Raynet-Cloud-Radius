import type { SmsAdapter, SmsConfig, SendSmsParams, SendSmsResponse } from "./sms.interface";

/**
 * Textlocal SMS Gateway Adapter
 * Documentation: https://www.textlocal.in/documentation/
 */
export class TextlocalAdapter implements SmsAdapter {
  private config: SmsConfig;
  private baseUrl: string;

  constructor(config: SmsConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || "https://api.textlocal.in";
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResponse> {
    try {
      // Textlocal API endpoint for sending SMS
      const url = `${this.baseUrl}/send/`;

      // Prepare URL-encoded form data
      const formData = new URLSearchParams({
        apikey: this.config.apiKey,
        sender: this.config.senderId,
        numbers: params.to.replace(/^\+/, ""), // Remove + prefix if present
        message: params.message,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          success: true,
          messageId: data.messages?.[0]?.id || data.message_id,
          gatewayResponse: data,
        };
      } else {
        return {
          success: false,
          error: data.errors?.[0]?.message || data.message || "Failed to send SMS",
          gatewayResponse: data,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getBalance(): Promise<number | null> {
    try {
      const url = `${this.baseUrl}/balance/?apikey=${this.config.apiKey}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.status === "success" && data.balance?.sms !== undefined) {
        return parseFloat(data.balance.sms);
      }

      return null;
    } catch (error) {
      console.error("[Textlocal] Failed to fetch balance:", error);
      return null;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Textlocal doesn't use webhook signatures
    // Verification would be done via IP whitelist on Textlocal dashboard
    return true;
  }
}
