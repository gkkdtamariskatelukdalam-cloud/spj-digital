import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * NextAuth configuration for the SPJ Digital app.
 *
 * - Uses Credentials provider (username + password)
 * - Passwords are hashed with bcrypt (cost factor 10)
 * - Session strategy: JWT (stateless, stored in cookie)
 * - The JWT & session callback includes: id, role, name (display name),
 *   username, enabledFeatures (array of feature keys, empty for admin).
 *
 * Feature keys (kept in sync with the main app's tab IDs):
 *   dashboard, data-belanja, transaksi, dokumen, laporan,
 *   master-data, letterhead, import-excel
 *
 * Admin role always has full access regardless of enabledFeatures.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    // We don't use a separate sign-in page — login happens through a modal
    // on the `/` route that POSTs to the NextAuth credentials endpoint.
    // This satisfies the project constraint of "user can only see the /
    // route". The signIn page setting is here only as a fallback.
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password ?? "";
        if (!username || !password) return null;

        const user = await db.user.findUnique({
          where: { username },
        });
        if (!user) return null;
        if (!user.isActive) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // Parse enabledFeatures JSON → array (defensive: invalid JSON falls
        // back to empty array so a malformed row never blocks login).
        let features: string[] = [];
        try {
          const parsed = JSON.parse(user.enabledFeatures || "[]");
          if (Array.isArray(parsed)) {
            features = parsed.filter((f) => typeof f === "string");
          }
        } catch {
          features = [];
        }

        return {
          id: user.id,
          name: user.name,
          email: user.username, // NextAuth requires email; we store username here
          role: user.role,
          username: user.username,
          enabledFeatures: features,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // On first sign-in: persist user metadata into the JWT
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        token.enabledFeatures = (user as any).enabledFeatures ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
        (session.user as any).enabledFeatures = token.enabledFeatures ?? [];
      }
      return session;
    },
  },
};

/** Feature keys available for per-user access control. Order matches the
 *  tab order in the main navigation so the admin UI shows them in the same
 *  order users see them in the app. */
export const ALL_FEATURE_KEYS = [
  "dashboard",
  "data-belanja",
  "transaksi",
  "dokumen",
  "laporan",
  "master-data",
  "letterhead",
  "import-excel",
] as const;

export type FeatureKey = (typeof ALL_FEATURE_KEYS)[number];

/** Human-readable labels for each feature key (used in the admin UI). */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  dashboard: "Dashboard",
  "data-belanja": "Data Belanja",
  transaksi: "Transaksi",
  dokumen: "Dokumen SPJ",
  laporan: "Laporan",
  "master-data": "Master Data",
  letterhead: "Pengaturan KOP",
  "import-excel": "Import Excel",
};

/** Check if a user (with role + enabledFeatures array) can access a feature.
 *  Admin always has access. Inactive feature is hidden from regular users. */
export function canAccess(
  role: string | undefined | null,
  enabledFeatures: string[] | undefined | null,
  featureKey: string,
): boolean {
  if (role === "admin") return true;
  if (!Array.isArray(enabledFeatures)) return false;
  return enabledFeatures.includes(featureKey);
}
