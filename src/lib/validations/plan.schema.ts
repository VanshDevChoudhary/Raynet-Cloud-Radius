import { z } from "zod";

/** Optional positive integer — treats 0, "", null, undefined as null */
const optionalPositiveInt = z.preprocess(
  (val) => (val === "" || val === 0 || val === null || val === undefined ? null : val),
  z.coerce.number().int().positive().nullable().optional()
);

export const planSchema = z.object({
  name: z.string().trim().min(2, "Plan name must be at least 2 characters").max(100),
  description: z.string().trim().max(1000).optional(),
  downloadSpeed: z.coerce.number().int().positive("Download speed is required"),
  uploadSpeed: z.coerce.number().int().positive("Upload speed is required"),
  speedUnit: z.enum(["KBPS", "MBPS"]).default("MBPS"),
  dataLimit: optionalPositiveInt,
  dataUnit: z.enum(["MB", "GB", "TB", "UNLIMITED"]).default("UNLIMITED"),
  validityDays: z.coerce.number().int().positive("Validity is required"),
  validityUnit: z.enum(["HOURS", "DAYS", "WEEKS", "MONTHS"]).default("DAYS"),
  price: z.coerce.number().positive("Price is required"),
  billingType: z.enum(["PREPAID", "POSTPAID"]).default("PREPAID"),
  planType: z.enum(["PPPOE", "HOTSPOT", "BOTH"]).default("PPPOE"),

  // FUP
  fupDownloadSpeed: optionalPositiveInt,
  fupUploadSpeed: optionalPositiveInt,
  fupSpeedUnit: z.enum(["KBPS", "MBPS"]).optional().nullable(),

  // Burst
  burstDownloadSpeed: optionalPositiveInt,
  burstUploadSpeed: optionalPositiveInt,
  burstThreshold: optionalPositiveInt,
  burstTime: optionalPositiveInt,

  // Time restriction
  timeSlotStart: z.string().optional().nullable(),
  timeSlotEnd: z.string().optional().nullable(),

  // Limits
  simultaneousDevices: z.coerce.number().int().min(1).default(1),
  priority: z.coerce.number().int().min(1).max(8).default(8),
  poolName: z.string().trim().max(50).optional().nullable(),

  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CreatePlanInput = z.infer<typeof planSchema>;
export type UpdatePlanInput = z.infer<typeof planSchema>;
