import { prisma } from "@/lib/prisma";
import { smsService } from "./sms/sms.service";
import { templateService } from "./notification/template.service";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "3", 10);

export interface SendOtpParams {
  tenantId: string;
  phone: string;
  purpose: string;
}

export interface SendOtpResponse {
  success: boolean;
  expiresAt?: Date;
  error?: string;
}

export interface VerifyOtpParams {
  tenantId: string;
  phone: string;
  code: string;
  purpose: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  error?: string;
}

export const otpService = {
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async sendOtp(params: SendOtpParams): Promise<SendOtpResponse> {
    try {
      const { tenantId, phone, purpose } = params;

      // Check if there's a recent OTP (within 1 minute)
      const recentOtp = await prisma.otp.findFirst({
        where: {
          tenantId,
          phone,
          purpose,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000), // 1 minute ago
          },
        },
      });

      if (recentOtp) {
        return {
          success: false,
          error: "Please wait 1 minute before requesting another OTP",
        };
      }

      const code = this.generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await prisma.otp.create({
        data: {
          tenantId,
          phone,
          code,
          purpose,
          expiresAt,
        },
      });

      const template = await templateService.getTemplate(tenantId, "OTP", "SMS");

      let message: string;
      if (template) {
        message = templateService.renderTemplate(template.template, {
          password: code, // Using "password" variable name for OTP
          tenantName: "", // Will be filled by notification worker
        });
      } else {
        message = `Your OTP is ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code with anyone.`;
      }

      const smsResult = await smsService.sendSms(tenantId, phone, message);

      if (!smsResult.success) {
        return {
          success: false,
          error: `Failed to send OTP: ${smsResult.error}`,
        };
      }

      return {
        success: true,
        expiresAt,
      };
    } catch (error) {
      console.error("[OTP Service] Failed to send OTP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResponse> {
    try {
      const { tenantId, phone, code, purpose } = params;

      const otp = await prisma.otp.findFirst({
        where: {
          tenantId,
          phone,
          purpose,
          verified: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!otp) {
        return {
          success: false,
          error: "No OTP found or OTP already verified",
        };
      }

      if (new Date() > otp.expiresAt) {
        return {
          success: false,
          error: "OTP has expired. Please request a new one",
        };
      }

      if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        return {
          success: false,
          error: "Too many failed attempts. Please request a new OTP",
        };
      }

      if (otp.code !== code) {
        await prisma.otp.update({
          where: { id: otp.id },
          data: { attempts: otp.attempts + 1 },
        });

        return {
          success: false,
          error: `Invalid OTP. ${OTP_MAX_ATTEMPTS - otp.attempts - 1} attempts remaining`,
        };
      }

      await prisma.otp.update({
        where: { id: otp.id },
        data: { verified: true },
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error("[OTP Service] Failed to verify OTP:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.otp.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error("[OTP Service] Failed to cleanup expired OTPs:", error);
      return 0;
    }
  },

  async getStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, verified, expired] = await Promise.all([
      prisma.otp.count({ where }),
      prisma.otp.count({ where: { ...where, verified: true } }),
      prisma.otp.count({
        where: {
          ...where,
          verified: false,
          expiresAt: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      verified,
      expired,
      pending: total - verified - expired,
      verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : "0",
    };
  },
};
