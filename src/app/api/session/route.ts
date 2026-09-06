import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type AvatarRecord = {
  id?: string;
  createdByOrganizationId?: string | null;
};

type AgentSessionConfig = {
  name: string;
  avatarId: string | null;
  voiceId: string | null;
  profileId: string | null;
};

const requestWindows = new Map<string, { count: number; resetAt: number }>();
const SESSION_WINDOW_MS = 10 * 60 * 1000;
const MAX_SESSIONS_PER_WINDOW = 12;
let avatarCache: { avatars: AvatarRecord[]; expiresAt: number } | null = null;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function requestAllowed(ip: string) {
  const now = Date.now();
  const current = requestWindows.get(ip);
  if (!current || current.resetAt <= now) {
    requestWindows.set(ip, { count: 1, resetAt: now + SESSION_WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_SESSIONS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}

async function getAvailableAvatars(apiKey: string) {
  if (avatarCache && avatarCache.expiresAt > Date.now()) return avatarCache.avatars;

  const response = await fetch("https://api.anam.ai/v1/avatars", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const payload = await response.json();
  const avatars: AvatarRecord[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.avatars)
        ? payload.avatars
        : [];
  avatarCache = { avatars, expiresAt: Date.now() + 5 * 60 * 1000 };
  return avatars;
}

function resolveAvatarId(avatars: AvatarRecord[], preferred: string | null) {
  const ids = new Set(avatars.flatMap((avatar) => avatar.id ? [avatar.id] : []));
  if (preferred && ids.has(preferred)) return preferred;

  const environmentAvatar = process.env.ANAM_AVATAR_ID;
  if (environmentAvatar && ids.has(environmentAvatar)) return environmentAvatar;

  return avatars.find((avatar) => avatar.id && avatar.createdByOrganizationId)?.id
    ?? avatars.find((avatar) => avatar.id)?.id
    ?? environmentAvatar
    ?? null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "local";

  if (!requestAllowed(ip)) {
    return NextResponse.json(
      { error: "Too many new sessions. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANAM_API_KEY;
  const fallbackVoiceId = process.env.ANAM_VOICE_ID;
  if (!apiKey || !fallbackVoiceId) {
    return NextResponse.json({ error: "Live avatar sessions are not configured." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const agentId = isUuid(body.agentId) ? body.agentId : null;
    const requestedProfileId = isUuid(body.profileId) ? body.profileId : null;
    const pageUrl = typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 2_000) : null;
    const orientation = body.orientation === "portrait" ? "portrait" : "landscape";

    let agentConfig: AgentSessionConfig | null = null;
    if (body.agentId && !agentId) {
      return NextResponse.json({ error: "Invalid agent identifier." }, { status: 400 });
    }

    if (agentId) {
      const { data: agent, error } = await supabaseAdmin
        .from("agents")
        .select("name, anam_avatar_id, anam_voice_id, profile_id")
        .eq("id", agentId)
        .maybeSingle();

      if (error || !agent) {
        return NextResponse.json({ error: "This agent is unavailable." }, { status: 404 });
      }

      agentConfig = {
        name: agent.name,
        avatarId: isUuid(agent.anam_avatar_id) ? agent.anam_avatar_id : null,
        voiceId: isUuid(agent.anam_voice_id) ? agent.anam_voice_id : null,
        profileId: isUuid(agent.profile_id) ? agent.profile_id : null,
      };
    }

    const avatars = await getAvailableAvatars(apiKey);
    const avatarId = resolveAvatarId(avatars, agentConfig?.avatarId ?? null);
    const voiceId = agentConfig?.voiceId ?? fallbackVoiceId;
    if (!avatarId || !voiceId) {
      return NextResponse.json({ error: "This agent is missing its voice or avatar." }, { status: 503 });
    }

    const anamResponse = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personaConfig: {
          name: agentConfig?.name ?? "Ruhana guide",
          avatarId,
          avatarModel: "cara-4",
          voiceId,
          llmId: "CUSTOMER_CLIENT_V1",
        },
        sessionOptions: {
          videoWidth: orientation === "portrait" ? 768 : 1152,
          videoHeight: orientation === "portrait" ? 1152 : 768,
          videoQuality: "high",
        },
      }),
    });

    if (!anamResponse.ok) {
      console.error("Anam session token failed", anamResponse.status);
      return NextResponse.json({ error: "The live avatar could not connect." }, { status: 502 });
    }

    const { sessionToken } = await anamResponse.json();
    if (typeof sessionToken !== "string" || !sessionToken) {
      return NextResponse.json({ error: "The live avatar returned an invalid session." }, { status: 502 });
    }

    const effectiveProfileId = agentConfig?.profileId ?? requestedProfileId;
    const { data: session, error: databaseError } = await supabaseAdmin
      .from("sessions")
      .insert({
        page_url: pageUrl,
        ...(effectiveProfileId ? { profile_id: effectiveProfileId } : {}),
        ...(agentId ? { agent_id: agentId } : {}),
      })
      .select("id")
      .single();

    if (databaseError || !session) {
      return NextResponse.json({ error: "The conversation could not be recorded." }, { status: 500 });
    }

    return NextResponse.json({ sessionToken, sessionId: session.id });
  } catch (error) {
    console.error("Session creation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The live avatar could not start." }, { status: 500 });
  }
}
