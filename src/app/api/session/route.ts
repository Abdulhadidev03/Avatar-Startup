import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { pageUrl, profileId } = await req.json();

    // 1. Create our own session row (optionally linked to a business profile)
    const { data: session, error: dbError } = await supabaseAdmin
      .from("sessions")
      .insert({ page_url: pageUrl, ...(profileId ? { profile_id: profileId } : {}) })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    // 2. Ask Anam for a browser-safe session token
    //    llmId "CUSTOMER_CLIENT_V1" = we supply our own replies via anam.talk()
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
            name: "Sarah",
            avatarId: process.env.ANAM_AVATAR_ID,
            avatarModel: "cara-4",
            voiceId: process.env.ANAM_VOICE_ID,
            llmId: "CUSTOMER_CLIENT_V1",
          },
        }),
      }
    );

    if (!anamRes.ok) {
      const text = await anamRes.text();
      return NextResponse.json(
        { error: `Anam token request failed: ${text}` },
        { status: 502 }
      );
    }

    const { sessionToken } = await anamRes.json();

    return NextResponse.json({
      sessionToken,
      sessionId: session.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
