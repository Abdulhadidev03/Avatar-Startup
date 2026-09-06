import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type AnamAvatar = {
  id?: string;
  displayName?: string;
  createdByOrganizationId?: string | null;
};

const requests = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SESSIONS = 6;

function allowed(ip: string) {
  const now = Date.now();
  const current = requests.get(ip);
  if (!current || current.resetAt <= now) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_SESSIONS) return false;
  current.count += 1;
  return true;
}

async function getOwnedAvatar(apiKey: string) {
  const response = await fetch("https://api.anam.ai/v1/avatars", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const avatars: AnamAvatar[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.avatars)
        ? payload.avatars
        : [];
  return avatars.find((avatar) => Boolean(avatar.createdByOrganizationId)) ?? null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip)) {
    return NextResponse.json(
      { error: "The live preview has reached its temporary limit. Please try again shortly." },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANAM_API_KEY;
  const voiceId = process.env.ANAM_VOICE_ID;
  if (!apiKey || !voiceId) {
    return NextResponse.json({ error: "The live preview is not configured yet." }, { status: 503 });
  }

  try {
    const { data: agent } = await supabaseAdmin
      .from("agents")
      .select("id, name, profile_id")
      .eq("status", "Live")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ownedAvatar = await getOwnedAvatar(apiKey);
    const avatarId = ownedAvatar?.id ?? process.env.ANAM_AVATAR_ID;
    if (!avatarId) throw new Error("No avatar is configured");

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({
        page_url: "/#live-demo",
        ...(agent?.id ? { agent_id: agent.id } : {}),
        ...(agent?.profile_id ? { profile_id: agent.profile_id } : {}),
      })
      .select("id")
      .single();

    if (sessionError || !session) throw new Error(sessionError?.message ?? "Could not create the preview");

    const anamResponse = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personaConfig: {
          name: agent?.name ?? "Ruhana guide",
          avatarId,
          avatarModel: "cara-4",
          voiceId,
          llmId: "CUSTOMER_CLIENT_V1",
        },
        sessionOptions: {
          videoWidth: 768,
          videoHeight: 1152,
          videoQuality: "high",
        },
      }),
    });

    if (!anamResponse.ok) throw new Error("The live avatar could not connect");
    const { sessionToken } = await anamResponse.json();

    return NextResponse.json({
      sessionToken,
      sessionId: session.id,
      agentName: agent?.name ?? ownedAvatar?.displayName ?? "Ruhana guide",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The live preview could not start";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
