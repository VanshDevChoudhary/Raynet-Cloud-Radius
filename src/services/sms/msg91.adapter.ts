import type { SmsAdapter, SmsConfig, SendSmsParams, SendSmsResponse } from "./sms.interface";

/**
 * MSG91 SMS Gateway Adapter
 * Documentation: https://docs.msg91.com/p/tf9GTextN/e/VLHxMIntO/MSG91
 */
export class MSG91Adapter implements SmsAdapter {
  private config: SmsConfig;
  private baseUrl: string;

  constructor(config: SmsConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || "https://api.msg91.com/api";
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResponse> {
    try {
      // MSG91 API endpoint for sending SMS
      const url = `${this.baseUrl}/v5/flow/`;

      // Prepare request body
      const body = {
        sender: this.config.senderId,
        route: "4", // 4 = Transactional Route
        country: "91", // India country code
        sms: [
          {
            message: params.message,
            to: [params.to.replace(/^\+/, "")], // Remove + prefix if present
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": this.config.apiKey,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.type === "success") {
        return {
          success: true,
          messageId: data.request_id || data.message_id,
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
      const url = `${this.baseUrl}/balance.php?authkey=${this.config.apiKey}&type=4`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.balance !== undefined) {
        return parseFloat(data.balance);
      }

      return null;
    } catch (error) {
      console.error("[MSG91] Failed to fetch balance:", error);
      return null;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // MSG91 doesn't use webhook signatures
    // Verification would be done via IP whitelist on MSG91 dashboard
    return true;
  }
}
