"use client";

import { createBrowserSupabaseClient } from "./supabase/client";

export { createBrowserSupabaseClient } from "./supabase/client";

// Kept for existing dashboard data reads. The implementation now uses the
// cookie-aware SSR client so browser queries share the authenticated session.
export const supabaseBrowser = createBrowserSupabaseClient();
