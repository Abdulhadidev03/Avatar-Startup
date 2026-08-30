import { createClient } from "@supabase/supabase-js";

// Server-side client — uses the service role key, NEVER expose to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
