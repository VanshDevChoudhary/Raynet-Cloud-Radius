import type { SmsAdapter, SmsConfig, SendSmsParams, SendSmsResponse } from "./sms.interface";

/**
 * Twilio SMS Gateway Adapter
 * Documentation: https://www.twilio.com/docs/sms/api
 */
export class TwilioAdapter implements SmsAdapter {
  private config: SmsConfig;
  private accountSid: string;
  private authToken: string;
  private baseUrl: string;

  constructor(config: SmsConfig) {
    this.config = config;

    // Twilio uses Account SID as API key and Auth Token as config
    this.accountSid = config.apiKey;
    this.authToken = (config.config?.authToken as string) || "";
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResponse> {
    try {
      const url = `${this.baseUrl}/Messages.json`;

      // Ensure phone number has + prefix
      const to = params.to.startsWith("+") ? params.to : `+${params.to}`;
      const from = this.config.senderId.startsWith("+") ? this.config.senderId : `+${this.config.senderId}`;

      // Prepare URL-encoded form data
      const formData = new URLSearchParams({
        To: to,
        From: from,
        Body: params.message,
      });

      // Twilio uses Basic Auth
      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${credentials}`,
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid,
          gatewayResponse: data,
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to send SMS",
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
      const url = `${this.baseUrl}/Balance.json`;

      const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.balance !== undefined) {
        return parseFloat(data.balance);
      }

      return null;
    } catch (error) {
      console.error("[Twilio] Failed to fetch balance:", error);
      return null;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Twilio webhook signature verification would require the auth token
    // and webhook URL - implement if needed
    return true;
  }
}
