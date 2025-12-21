import type { SmsAdapter, SmsConfig, SendSmsParams, SendSmsResponse } from "./sms.interface";

/**
 * WhatsApp Business API Adapter
 * Supports Meta Cloud API (default) and Twilio WhatsApp API
 */
export class WhatsAppAdapter implements SmsAdapter {
  private apiUrl: string;
  private authToken: string;
  private phoneNumberId: string;
  private provider: "meta" | "twilio";

  constructor(config: SmsConfig) {
    this.provider = (config.config?.whatsappProvider as "meta" | "twilio") || "meta";

    if (this.provider === "twilio") {
      this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.apiKey}/Messages.json`;
      this.authToken = (config.config?.authToken as string) || "";
      this.phoneNumberId = config.senderId;
    } else {
      this.phoneNumberId = (config.config?.phoneNumberId as string) || config.senderId;
      this.apiUrl = config.apiUrl || `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      this.authToken = config.apiKey;
    }
  }

  async sendSms(params: SendSmsParams): Promise<SendSmsResponse> {
    if (this.provider === "twilio") {
      return this.sendViaTwilio(params);
    }
    return this.sendViaMeta(params);
  }

  private async sendViaMeta(params: SendSmsParams): Promise<SendSmsResponse> {
    try {
      const to = params.to.replace(/[^0-9]/g, "");
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: params.message },
        }),
      });

      const data = await response.json() as Record<string, unknown>;
      const messages = data.messages as Array<{ id: string }> | undefined;
      const error = data.error as { message: string } | undefined;

      if (response.ok && messages?.[0]?.id) {
        return {
          success: true,
          messageId: messages[0].id,
          gatewayResponse: data,
        };
      }

      return {
        success: false,
        error: error?.message || "Failed to send WhatsApp message",
        gatewayResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async sendViaTwilio(params: SendSmsParams): Promise<SendSmsResponse> {
    try {
      const to = params.to.startsWith("+") ? params.to : `+${params.to}`;
      const from = this.phoneNumberId.startsWith("whatsapp:")
        ? this.phoneNumberId
        : `whatsapp:${this.phoneNumberId}`;

      const body = new URLSearchParams({
        To: `whatsapp:${to}`,
        From: from,
        Body: params.message,
      });

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.phoneNumberId.split(":")[0]}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json() as Record<string, unknown>;

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid as string,
          gatewayResponse: data,
        };
      }

      return {
        success: false,
        error: (data.message as string) || "Failed to send WhatsApp via Twilio",
        gatewayResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
