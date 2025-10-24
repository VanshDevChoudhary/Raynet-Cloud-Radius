import { z } from "zod";

export const nasDeviceSchema = z.object({
  name: z.string().trim().min(2, "NAS name must be at least 2 characters").max(100),
  shortName: z.string().trim().max(30).optional().nullable(),
  nasIp: z
    .string()
    .min(7, "IP address is required")
    .regex(
      /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
      "Enter a valid IPv4 address"
    ),
  secret: z.string().min(6, "RADIUS secret must be at least 6 characters").max(128),
  nasType: z.enum(["MIKROTIK", "CISCO", "UBIQUITI", "OTHER"]).default("MIKROTIK"),
  description: z.string().trim().max(500).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  ports: z.preprocess(
    (val) => (val === "" || val === 0 || val === null || val === undefined ? null : val),
    z.coerce.number().int().positive().nullable().optional()
  ),
  community: z.string().trim().max(100).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "UNREACHABLE"]).default("ACTIVE"),
});

export type CreateNasDeviceInput = z.infer<typeof nasDeviceSchema>;
export type UpdateNasDeviceInput = z.infer<typeof nasDeviceSchema>;
