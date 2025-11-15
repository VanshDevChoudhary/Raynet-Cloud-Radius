import { z } from "zod";

export const invoiceSchema = z.object({
  subscriberId: z.string().uuid("Invalid subscriber"),
  planId: z.string().uuid().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;
