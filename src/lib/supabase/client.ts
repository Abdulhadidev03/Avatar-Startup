"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

let browserClient: SupabaseClient | undefined;

/**
 * Browser client for interactive auth and browser-side Supabase queries.
 * `@supabase/ssr` persists the PKCE verifier and session in cookies so the
 * server can verify the same session on the next request.
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error("Supabase sign-in is not configured for this deployment.");
  }

  browserClient ??= createBrowserClient(config.url, config.key, {
    auth: {
      flowType: "pkce",
    },
  });

  return browserClient;
}
