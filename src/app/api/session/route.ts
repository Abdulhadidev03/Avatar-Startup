import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { pageUrl, profileId, agentId, orientation } = await req.json();

    // If an agentId is provided, load the agent's config from DB
    let agentConfig: {
      name: string;
      avatarId: string;
      voiceId: string;
      profileId?: string;
    } | null = null;

    if (agentId) {
      const { data: agent } = await supabaseAdmin
        .from("agents")
        .select("name, anam_avatar_id, anam_voice_id, profile_id")
        .eq("id", agentId)
        .single();

      if (agent) {
        // Only use DB values if they look like valid UUIDs; otherwise fall back to env defaults
        const isUUID = (v: string | null) => v ? /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(v) : false;
        agentConfig = {
          name: agent.name,
          avatarId: isUUID(agent.anam_avatar_id) ? agent.anam_avatar_id! : process.env.ANAM_AVATAR_ID!,
          voiceId: isUUID(agent.anam_voice_id) ? agent.anam_voice_id! : process.env.ANAM_VOICE_ID!,
          profileId: agent.profile_id ?? undefined,
        };
      }
    }

    const effectiveProfileId = agentConfig?.profileId ?? profileId ?? null;

    const { data: session, error: dbError } = await supabaseAdmin
      .from("sessions")
      .insert({
        page_url: pageUrl,
        ...(effectiveProfileId ? { profile_id: effectiveProfileId } : {}),
        ...(agentId ? { agent_id: agentId } : {}),
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const anamRes = await fetch(
      "https://api.anam.ai/v1/auth/session-token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personaConfig: {
            name: agentConfig?.name ?? "Sarah",
            avatarId: agentConfig?.avatarId ?? process.env.ANAM_AVATAR_ID,
            avatarModel: "cara-4",
            voiceId: agentConfig?.voiceId ?? process.env.ANAM_VOICE_ID,
            llmId: "CUSTOMER_CLIENT_V1",
          },
          sessionOptions: {
            videoWidth: orientation === "portrait" ? 768 : 1152,
            videoHeight: orientation === "portrait" ? 1152 : 768,
            videoQuality: "high",
          },
        }),
      }
    );

    if (!anamRes.ok) {
      const text = await anamRes.text();
      return NextResponse.json(
        { error: `Anam token request failed: ${text}` },
        { status: 502 },
      );
    }

    const { sessionToken } = await anamRes.json();

    return NextResponse.json({ sessionToken, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
