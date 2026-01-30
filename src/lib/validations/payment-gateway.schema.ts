import { z } from "zod";
import { PaymentGatewayProvider } from "@/generated/prisma";

export const paymentGatewaySchema = z.object({
  provider: z.nativeEnum(PaymentGatewayProvider),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  apiKey: z.string().trim().min(1, "API Key is required").max(500),
  apiSecret: z.string().trim().min(1, "API Secret is required").max(500),
  webhookSecret: z.string().trim().max(500).optional(),
  isTestMode: z.boolean().default(true),
});

export type CreatePaymentGatewayInput = z.infer<typeof paymentGatewaySchema>;
