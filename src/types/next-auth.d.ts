/**
 * Type augmentation for NextAuth: extends the Session user object with
 * the SPJ app's custom fields (id, role, username, enabledFeatures).
 * Without this, `session.user.role` etc. would be a TypeScript error.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      username?: string;
      role?: string;
      enabledFeatures?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    username?: string;
    enabledFeatures?: string[];
  }
}
