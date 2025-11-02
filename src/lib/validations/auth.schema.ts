import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(15)
    .regex(/^[+]?[\d\s()-]{7,15}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
