import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  type: z.enum(["REGION", "CITY", "AREA"]).default("AREA"),
  parentId: z.string().uuid().optional().nullable(),
});

export type CreateLocationInput = z.infer<typeof locationSchema>;
export type UpdateLocationInput = z.infer<typeof locationSchema>;
