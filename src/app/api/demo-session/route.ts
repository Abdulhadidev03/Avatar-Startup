import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getLiveAgent, resolveLandingAvatar } from "@/lib/landing-demo";

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

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip)) {
    return NextResponse.json(
      { error: "The live preview has reached its temporary limit. Please try again shortly." },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "The live preview is not configured yet." }, { status: 503 });
  }

  try {
    const agent = await getLiveAgent();

    // Shared with /api/landing-media so the preview still and the live stream
    // resolve to the same avatar.
    const avatar = await resolveLandingAvatar(apiKey, agent?.anam_avatar_id);
    const avatarId = avatar?.id ?? process.env.ANAM_AVATAR_ID;
    if (!avatarId) throw new Error("No avatar is configured");

    const voiceId = agent?.anam_voice_id ?? process.env.ANAM_VOICE_ID;
    if (!voiceId) throw new Error("No voice is configured");

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
      agentName: agent?.name ?? avatar?.displayName ?? "Ruhana guide",
      avatarId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The live preview could not start";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
