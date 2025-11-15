import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma";

export const paymentSchema = z.object({
  subscriberId: z.string().uuid("Invalid subscriber"),
  invoiceId: z.string().uuid("Invalid invoice").optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  method: z.nativeEnum(PaymentMethod),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).default("COMPLETED"),
});

export type RecordPaymentInput = z.infer<typeof paymentSchema>;
