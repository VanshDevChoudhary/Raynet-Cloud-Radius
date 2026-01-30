import { z } from "zod";

const phoneRegex = /^[+]?[\d\s()-]{7,15}$/;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(200),
  phone: z.string().trim().regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(["TENANT_ADMIN", "MANAGER", "STAFF", "COLLECTOR", "FRANCHISE"]),
  locationId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  phone: z.string().trim().regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
  role: z.enum(["TENANT_ADMIN", "MANAGER", "STAFF", "COLLECTOR", "FRANCHISE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  locationId: z.string().nullable().optional(),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(2, "Tenant name must be at least 2 characters").max(100),
  slug: z.string().trim().min(2, "Slug must be at least 2 characters").max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  domain: z.string().trim().max(200).optional(),
  planTier: z.enum(["STARTER", "GROWTH", "PROFESSIONAL", "ENTERPRISE"]),
  adminName: z.string().trim().min(2, "Admin name is required").max(100),
  adminEmail: z.string().trim().toLowerCase().email("Valid admin email is required").max(200),
  adminPassword: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const updateTenantSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  domain: z.string().trim().max(200).optional(),
  planTier: z.enum(["STARTER", "GROWTH", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL"]).optional(),
  maxOnline: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(1).optional()
  ),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
