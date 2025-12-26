import { z } from "zod";

export const emailConfigSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.coerce.number().int().min(1).max(65535, "Invalid port number"),
  smtpUser: z.string().min(1, "SMTP user is required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  fromEmail: z.string().email("Invalid email address"),
  fromName: z.string().min(1, "From name is required"),
  useTls: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const testEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type EmailConfigInput = z.infer<typeof emailConfigSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;
