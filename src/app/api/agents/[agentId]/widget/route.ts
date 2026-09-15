import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveLandingAvatar } from "@/lib/landing-demo";
import { resolveStockAvatarImage } from "@/lib/stock-avatars";

type RouteContext = { params: Promise<{ agentId: string }> };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

/**
 * Lean public payload for the embed launcher (cross-origin).
 * Avoids exposing instructions / internal fields from the full agent GET.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { agentId } = await ctx.params;
    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select("name, greeting, avatar_id, avatar_image_url, anam_avatar_id")
      .eq("id", agentId)
      .maybeSingle();

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404, headers: CORS });
    }

    let avatarImageUrl = resolveStockAvatarImage(agent.avatar_id, agent.avatar_image_url);

    if (!avatarImageUrl && process.env.ANAM_API_KEY) {
      const effective = await resolveLandingAvatar(
        process.env.ANAM_API_KEY,
        agent.anam_avatar_id,
      );
      avatarImageUrl = effective?.imageUrl ?? null;
    }

    return NextResponse.json(
      {
        name: agent.name,
        greeting: agent.greeting,
        avatarImageUrl,
      },
      { headers: CORS },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
