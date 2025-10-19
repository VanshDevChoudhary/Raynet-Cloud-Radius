import type { User, Tenant, UserRole } from "@/generated/prisma";
import { Decimal } from "@/generated/prisma/runtime/library";
import { z } from "zod";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export type UserWithTenant = User & {
  tenant: Tenant | null;
};

/**
 * Recursively converts Prisma Decimal fields to number for Client Component serialization.
 * Use this when passing server data to client components.
 */
export type Serialized<T> = T extends Decimal
  ? number
  : T extends Date
    ? Date
    : T extends Array<infer U>
      ? Array<Serialized<U>>
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

/**
 * Extract a safe, user-facing error message from any caught error.
 * Never leaks Prisma internals, stack traces, or database schema info.
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  // Zod validation errors — return the first human-readable message
  if (error instanceof z.ZodError) {
    return error.errors[0]?.message || fallback;
  }

  // Known application errors — return as-is if they look safe
  if (error instanceof Error) {
    const msg = error.message;

    // Block Prisma/database internals from leaking
    const unsafePatterns = [
      "prisma",
      "unique constraint",
      "foreign key",
      "violates",
      "invalid input syntax",
      "column",
      "relation",
      "connect",
      "p2",
      "Invalid `prisma",
    ];
    const lower = msg.toLowerCase();
    if (unsafePatterns.some((p) => lower.includes(p))) {
      // Special case: unique constraint on username is user-actionable
      if (lower.includes("unique") && lower.includes("username")) {
        return "This username is already taken";
      }
      if (lower.includes("unique") && lower.includes("email")) {
        return "This email is already in use";
      }
      console.error("[Sanitized Error]", msg);
      return fallback;
    }

    // Safe application-level error messages
    return msg;
  }

  return fallback;
}

/** Detect Prisma Decimal objects (duck-typing since instanceof can fail across module boundaries) */
function isDecimal(obj: unknown): boolean {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "d" in obj &&
    "e" in obj &&
    "s" in obj &&
    typeof (obj as Record<string, unknown>).toFixed === "function"
  );
}

/** Convert an object with Decimal fields to plain numbers (for Server→Client serialization) */
export function serialize<T>(obj: T): Serialized<T> {
  if (obj === null || obj === undefined) return obj as Serialized<T>;
  if (isDecimal(obj)) return Number(obj) as Serialized<T>;
  if (obj instanceof Date) return obj as Serialized<T>;
  if (Array.isArray(obj)) return obj.map(serialize) as Serialized<T>;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serialize(value);
    }
    return result as Serialized<T>;
  }
  return obj as Serialized<T>;
}
