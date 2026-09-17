"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";

/**
 * Combined client-side providers wrapper.
 *
 * Wraps the entire app with:
 *   1. SessionProvider (NextAuth) — so components can use `useSession()`
 *      to read the current logged-in user's session, role, enabledFeatures
 *   2. QueryClientProvider (TanStack Query) — server-state cache for
 *      data fetching across the SPJ app
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
