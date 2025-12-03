import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[0-9]{10,15}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  locationId: z.string().uuid("Invalid location ID").optional().or(z.literal("")),
  source: z.enum(["WALK_IN", "REFERRAL", "WEBSITE", "PHONE", "SOCIAL_MEDIA", "OTHER"]),
  status: z.enum(["NEW", "CONTACTED", "SITE_SURVEY", "INSTALLATION_SCHEDULED", "CONVERTED", "LOST"]).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;
