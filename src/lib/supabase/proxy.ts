import { createServerClient } from "@supabase/ssr";
import type { JwtPayload } from "@supabase/auth-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";

export type ProxyAuthResult = {
  claims: JwtPayload | null;
  reason: "authenticated" | "unauthenticated" | "configuration" | "unavailable";
  response: NextResponse;
};

/**
 * Refreshes a Supabase cookie session before rendering. The refreshed cookies
 * are applied to both the request (for Server Components) and the response
 * (for the browser), as required by @supabase/ssr.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<ProxyAuthResult> {
  const config = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  if (!config) {
    return { claims: null, reason: "configuration", response };
  }

  try {
    const supabase = createServerClient(config.url, config.key, {
      auth: {
        flowType: "pkce",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.getClaims();
    const claims = error ? null : data?.claims ?? null;
    return {
      claims,
      reason: claims ? "authenticated" : "unauthenticated",
      response,
    };
  } catch {
    // A temporary provider outage should not take down public pages. Protected
    // routes still reject the request in src/proxy.ts and the dashboard layout.
    return { claims: null, reason: "unavailable", response };
  }
}
