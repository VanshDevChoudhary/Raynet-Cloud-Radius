import { z } from "zod";

const phoneRegex = /^[+]?[\d\s()-]{7,15}$/;
const macRegex = /^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$/;
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

export const subscriberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15)
    .regex(phoneRegex, "Invalid phone number format"),
  email: z.string().trim().email("Invalid email").max(200).optional().or(z.literal("")),
  alternatePhone: z.string().trim().max(15).regex(phoneRegex, "Invalid phone number").optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  gpsCoordinates: z.string().trim().max(50).optional().or(z.literal("")),
  subscriberType: z.enum(["RESIDENTIAL", "COMMERCIAL"]).default("RESIDENTIAL"),
  connectionType: z.enum(["PPPOE", "HOTSPOT", "STATIC_IP", "MAC_BIND"]).default("PPPOE"),

  // Auth
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9._@-]+$/, "Username can only contain letters, numbers, dots, hyphens, underscores, and @"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),

  // Network
  planId: z.string().uuid("Select a plan").optional().nullable(),
  nasDeviceId: z.string().uuid("Select a NAS device").optional().nullable(),
  locationId: z.string().uuid("Select a location").optional().nullable(),
  macAddress: z.string().trim().regex(macRegex, "Invalid MAC address (use XX:XX:XX:XX:XX:XX)").optional().or(z.literal("")),
  ipAddress: z.string().trim().regex(ipv4Regex, "Invalid IPv4 address").optional().or(z.literal("")),
  staticIp: z.string().trim().regex(ipv4Regex, "Invalid IPv4 address").optional().or(z.literal("")),

  // Dates
  installationDate: z.string().max(30).optional().or(z.literal("")),
  expiryDate: z.string().max(30).optional().or(z.literal("")),

  // Status
  status: z.enum(["ACTIVE", "EXPIRED", "DISABLED", "SUSPENDED", "TRIAL"]).default("ACTIVE"),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),

  // Auto-renewal
  autoRenewal: z.boolean().default(false),
});

export const subscriberUpdateSchema = subscriberSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(6).max(128).optional().or(z.literal("")),
  });

export type CreateSubscriberInput = z.infer<typeof subscriberSchema>;
export type UpdateSubscriberInput = z.infer<typeof subscriberUpdateSchema>;
