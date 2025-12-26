import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailConfig } from "@/generated/prisma";

export interface SendEmailParams {
  tenantId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const emailService = {
  async getConfig(tenantId: string): Promise<EmailConfig | null> {
    return prisma.emailConfig.findUnique({
      where: { tenantId, isActive: true },
    });
  },

  async upsertConfig(
    tenantId: string,
    data: {
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPassword: string;
      fromEmail: string;
      fromName: string;
      useTls?: boolean;
      isActive?: boolean;
    }
  ) {
    return prisma.emailConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...data,
        useTls: data.useTls ?? true,
        isActive: data.isActive ?? true,
      },
      update: data,
    });
  },

  async deleteConfig(tenantId: string) {
    return prisma.emailConfig.delete({
      where: { tenantId },
    });
  },

  createTransporter(config: EmailConfig): Transporter {
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.useTls, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  },

  async sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
    try {
      const config = await this.getConfig(params.tenantId);

      if (!config) {
        return {
          success: false,
          error: "No email configuration found for this tenant",
        };
      }

      const transporter = this.createTransporter(config);
      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("[Email Service] Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async testConfig(
    config: EmailConfig,
    testEmail: string,
    testSubject: string,
    testBody: string
  ): Promise<SendEmailResponse> {
    try {
      const transporter = this.createTransporter(config);

      await transporter.verify();
      const info = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: testEmail,
        subject: testSubject,
        html: testBody,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("[Email Service] Test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async verifyConfig(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.createTransporter(config);
      await transporter.verify();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  },
};
