import { z } from "zod";

export const csvSubscriberRowSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  connectionType: z
    .enum(["PPPOE", "HOTSPOT", "STATIC_IP", "MAC_BIND"])
    .default("PPPOE"),
  subscriberType: z
    .enum(["RESIDENTIAL", "COMMERCIAL"])
    .default("RESIDENTIAL"),
  planId: z.string().optional().or(z.literal("")),
  macAddress: z.string().optional().or(z.literal("")),
  staticIp: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  alternatePhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z
    .enum(["ACTIVE", "EXPIRED", "DISABLED", "SUSPENDED", "TRIAL"])
    .default("ACTIVE"),
  expiryDate: z.string().optional().or(z.literal("")),
  installationDate: z.string().optional().or(z.literal("")),
});

export type CsvSubscriberRow = z.infer<typeof csvSubscriberRowSchema>;
