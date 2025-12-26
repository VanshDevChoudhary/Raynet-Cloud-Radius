import { z } from "zod";

export const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[0-9]{10,15}$/, "Invalid phone number format"),
  purpose: z.enum(["login", "registration", "verification", "password-reset"], {
    required_error: "Purpose is required",
  }),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[0-9]{10,15}$/, "Invalid phone number format"),
  code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^[0-9]{6}$/, "OTP must contain only digits"),
  purpose: z.enum(["login", "registration", "verification", "password-reset"], {
    required_error: "Purpose is required",
  }),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
