import { createClient } from "@supabase/supabase-js";

// Browser-safe Supabase client — uses the public anon key for read-only dashboard queries
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
