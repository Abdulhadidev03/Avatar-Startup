import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

export type AuthenticatedRuhanaUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export type ServerAuthResult = {
  user: AuthenticatedRuhanaUser | null;
  reason: "authenticated" | "unauthenticated" | "configuration" | "unavailable";
};

/**
 * Creates a request-scoped Supabase server client. Never share this client
 * across requests: its cookie adapter belongs to the current request.
 */
export async function createServerSupabaseClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error("Supabase sign-in is not configured for this deployment.");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    auth: {
      flowType: "pkce",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set response cookies. src/proxy.ts
          // refreshes and persists auth cookies before a page renders.
        }
      },
    },
  });
}

/**
 * Verifies the session before returning only the identity needed by the UI.
 * `getClaims()` validates the access token; unlike getSession(), it is safe
 * to use for access control when session storage is cookie based.
 */
export async function getAuthenticatedRuhanaUser(): Promise<ServerAuthResult> {
  if (!getSupabasePublicConfig()) {
    return { user: null, reason: "configuration" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims || typeof claims.sub !== "string") {
      return { user: null, reason: "unauthenticated" };
    }

    const metadata =
      claims.user_metadata && typeof claims.user_metadata === "object"
        ? claims.user_metadata as Record<string, unknown>
        : {};
    const name = [metadata.full_name, metadata.name]
      .find((value): value is string => typeof value === "string" && value.trim().length > 0)
      ?.trim() ?? null;

    return {
      user: {
        id: claims.sub,
        email: typeof claims.email === "string" ? claims.email : null,
        name,
      },
      reason: "authenticated",
    };
  } catch {
    return { user: null, reason: "unavailable" };
  }
}
