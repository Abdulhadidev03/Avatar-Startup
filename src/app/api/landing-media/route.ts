import { NextResponse } from "next/server";
import { getLiveAgent, resolveLandingAvatar } from "@/lib/landing-demo";

export const dynamic = "force-dynamic";

const EMPTY = { id: null, name: null, imageUrl: null, videoUrl: null };

export async function GET() {
  const apiKey = process.env.ANAM_API_KEY;
  if (!apiKey) return NextResponse.json(EMPTY, { status: 200 });

  try {
    const agent = await getLiveAgent();
    // Same resolver the session route uses, so the still preview and the live
    // stream always show the same face.
    const avatar = await resolveLandingAvatar(apiKey, agent?.anam_avatar_id);

    if (!avatar?.id) return NextResponse.json(EMPTY, { status: 200 });

    return NextResponse.json(
      {
        id: avatar.id,
        name: agent?.name ?? avatar.displayName ?? "Ruhana guide",
        imageUrl: avatar.imageUrl ?? null,
        videoUrl: avatar.videoUrl ?? null,
      },
      {
        // Short window: a stale preview here is exactly what made the preview
        // and the live avatar disagree after an avatar or API-key change.
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      },
    );
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
