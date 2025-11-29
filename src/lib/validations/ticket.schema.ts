import { z } from "zod";

export const createTicketSchema = z.object({
  subscriberId: z.string().uuid("Invalid subscriber ID").optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  category: z.enum(["CONNECTIVITY", "BILLING", "SPEED", "INSTALLATION", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  assignedToId: z.string().uuid("Invalid assignee ID").optional(),
});

export const updateTicketSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  category: z.enum(["CONNECTIVITY", "BILLING", "SPEED", "INSTALLATION", "OTHER"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});

export const addCommentSchema = z.object({
  message: z.string().min(1, "Comment cannot be empty").max(5000),
  isInternal: z.boolean().optional().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
