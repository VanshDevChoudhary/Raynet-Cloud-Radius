import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// In-memory rate limiter for admin login
const adminLoginAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Dummy hash for constant-time comparison when user not found
const DUMMY_HASH =
  "$2a$12$000000000000000000000uGEBJHnSON3HPq8tOMiPbZxp0h8DpC";

function checkAdminRateLimit(email: string): boolean {
  const now = Date.now();
  const record = adminLoginAttempts.get(email);
  if (!record) return true;
  if (now - record.lastAttempt > ADMIN_LOCKOUT_MS) {
    adminLoginAttempts.delete(email);
    return true;
  }
  return record.count < ADMIN_MAX_ATTEMPTS;
}

function recordAdminFailedAttempt(email: string): void {
  const now = Date.now();
  const record = adminLoginAttempts.get(email);
  if (!record || now - record.lastAttempt > ADMIN_LOCKOUT_MS) {
    adminLoginAttempts.set(email, { count: 1, lastAttempt: now });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
}

function clearAdminAttempts(email: string): void {
  adminLoginAttempts.delete(email);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (hardened from 30)
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Rate limiting check
        if (!checkAdminRateLimit(email)) {
          throw new Error("Too many login attempts. Try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!user || user.status !== "ACTIVE") {
          // Constant-time: always run bcrypt compare to prevent timing attacks
          await bcrypt.compare(password, DUMMY_HASH);
          recordAdminFailedAttempt(email);
          return null;
        }

        // Block login if tenant is suspended or inactive (SUPER_ADMIN has no tenant)
        if (
          user.tenant &&
          !["ACTIVE", "TRIAL"].includes(user.tenant.status)
        ) {
          throw new Error("Your organization has been suspended. Contact support.");
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          recordAdminFailedAttempt(email);
          return null;
        }

        clearAdminAttempts(email);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant?.slug ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token.id = u.id as string;
        token.role = u.role as string;
        token.tenantId = u.tenantId as string | null;
        token.tenantSlug = u.tenantSlug as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.id;
        u.role = token.role;
        u.tenantId = token.tenantId;
        u.tenantSlug = token.tenantSlug;
      }
      return session;
    },
    async authorized({ auth: authSession, request }) {
      const isLoggedIn = !!authSession?.user;
      const { pathname } = request.nextUrl;

      const publicPaths = ["/login", "/register", "/forgot-password", "/api/auth"];
      const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

      if (isPublicPath) return true;
      if (!isLoggedIn) return false;

      return true;
    },
  },
});
