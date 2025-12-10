import { z } from "zod";

export const generateVoucherBatchSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
  quantity: z.number().int().min(1, "Minimum 1 voucher").max(1000, "Maximum 1000 vouchers per batch"),
  prefix: z.string().max(6, "Prefix max 6 characters").regex(/^[A-Z0-9]*$/, "Prefix must be uppercase alphanumeric").optional().default(""),
  codeLength: z.number().int().min(6, "Minimum code length 6").max(16, "Maximum code length 16").optional().default(8),
  validityDays: z.number().int().min(1, "Minimum 1 day validity").max(365, "Maximum 365 days validity"),
  notes: z.string().max(500).optional(),
});

export const markVoucherSoldSchema = z.object({
  soldTo: z.string().min(1, "Buyer name is required").max(100),
});

export type GenerateVoucherBatchInput = z.infer<typeof generateVoucherBatchSchema>;
export type MarkVoucherSoldInput = z.infer<typeof markVoucherSoldSchema>;
