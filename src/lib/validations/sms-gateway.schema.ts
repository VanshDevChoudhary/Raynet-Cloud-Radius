import { z } from "zod";

export const smsGatewaySchema = z.object({
  provider: z.enum(["MSG91", "TEXTLOCAL", "TWILIO", "CUSTOM"], {
    required_error: "Provider is required",
  }),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  apiKey: z.string().min(1, "API key is required"),
  senderId: z
    .string()
    .min(3, "Sender ID must be at least 3 characters")
    .max(11, "Sender ID must be at most 11 characters")
    .regex(/^[A-Z0-9]+$/, "Sender ID must contain only uppercase letters and numbers"),
  apiUrl: z.string().url("Invalid API URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  config: z.record(z.unknown()).optional(),
});

export const testSmsSchema = z.object({
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[0-9]{10,15}$/, "Invalid phone number format"),
  message: z.string().min(1, "Message is required").max(160, "Message is too long (max 160 characters)"),
});

export type SmsGatewayInput = z.infer<typeof smsGatewaySchema>;
export type TestSmsInput = z.infer<typeof testSmsSchema>;
