import { supabaseAdmin } from "@/lib/supabase";

export type AnamAvatar = {
  id?: string;
  displayName?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdByOrganizationId?: string | null;
};

export type LiveAgent = {
  id: string;
  name: string;
  profile_id: string | null;
  anam_avatar_id: string | null;
  anam_voice_id: string | null;
};

async function anamGet<T>(path: string, apiKey: string): Promise<T | null> {
  try {
    const response = await fetch(`https://api.anam.ai/v1${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function listAnamAvatars(apiKey: string): Promise<AnamAvatar[]> {
  const payload = await anamGet<unknown>("/avatars", apiKey);
  if (Array.isArray(payload)) return payload as AnamAvatar[];
  const record = payload as { data?: unknown; avatars?: unknown } | null;
  if (Array.isArray(record?.data)) return record.data as AnamAvatar[];
  if (Array.isArray(record?.avatars)) return record.avatars as AnamAvatar[];
  return [];
}

/**
 * The agent the public landing demo speaks as: the most recently created Live
 * agent. Both the preview media and the session route must agree on this, so
 * neither should run the query itself.
 */
export async function getLiveAgent(): Promise<LiveAgent | null> {
  const { data } = await supabaseAdmin
    .from("agents")
    .select("id, name, profile_id, anam_avatar_id, anam_voice_id")
    .eq("status", "Live")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as LiveAgent | null) ?? null;
}

/**
 * Single source of truth for which Anam avatar the landing demo uses.
 *
 * The preview image and the live stream used to resolve this independently,
 * which let them disagree. The preview looked only for an org-owned avatar and
 * had no fallback, while the session route fell back to ANAM_AVATAR_ID. After
 * an API-key rotation there were no org-owned avatars at all, so the preview
 * fell through to a hardcoded sprite while the stream showed ANAM_AVATAR_ID.
 *
 * `preferredId` is an agent's stored anam_avatar_id. It is honoured only when
 * that avatar still exists under the current key — ids saved under a previous
 * key would otherwise 404 and take the whole demo down with them.
 */
export async function resolveLandingAvatar(
  apiKey: string,
  preferredId?: string | null,
): Promise<AnamAvatar | null> {
  const avatars = await listAnamAvatars(apiKey);
  if (avatars.length === 0) return null;

  const byId = (id?: string | null) => (id ? avatars.find((avatar) => avatar.id === id) : undefined);

  const chosen =
    byId(preferredId) ??
    byId(process.env.ANAM_AVATAR_ID) ??
    avatars.find((avatar) => Boolean(avatar.createdByOrganizationId)) ??
    avatars[0];

  if (!chosen?.id) return null;

  // The list endpoint can omit media, so top up from the detail endpoint.
  if (chosen.imageUrl && chosen.videoUrl) return chosen;
  const detail = await anamGet<AnamAvatar>(`/avatars/${chosen.id}`, apiKey);
  return { ...chosen, ...(detail ?? {}), id: chosen.id };
}
