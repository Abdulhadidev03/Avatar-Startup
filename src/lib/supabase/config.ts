export type SupabasePublicConfig = {
  url: string;
  key: string;
};

/**
 * The project still uses the legacy anon-key environment variable. Prefer the
 * publishable-key name when it is added, without making current deployments
 * fail during the transition.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabasePublicConfig() !== null;
}
