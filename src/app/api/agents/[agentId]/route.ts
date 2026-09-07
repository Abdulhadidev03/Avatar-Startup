import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveLandingAvatar } from "@/lib/landing-demo";

type RouteContext = { params: Promise<{ agentId: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const { agentId } = await ctx.params;

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Compute stats
    const { data: sessions } = await supabaseAdmin
      .from("sessions")
      .select("id, started_at, ended_at")
      .eq("agent_id", agentId)
      .order("started_at", { ascending: false });

    const sessionIds = (sessions ?? []).map((s) => s.id);

    const { count: outcomeCount } = await supabaseAdmin
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .in("session_id", sessionIds.length ? sessionIds : ["__none__"]);

    const conversations = sessions?.length ?? 0;
    const outcomes = outcomeCount ?? 0;
    const conversionRate =
      conversations > 0 ? `${((outcomes / conversations) * 100).toFixed(1)}%` : "—";

    let lastActive = "No activity yet";
    if (sessions?.length) {
      const latest = sessions[0].started_at;
      const diff = Date.now() - new Date(latest).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) lastActive = `${mins} min ago`;
      else if (mins < 1440) lastActive = `${Math.floor(mins / 60)}h ago`;
      else lastActive = `${Math.floor(mins / 1440)}d ago`;
    }

    // The saved image can be empty even though the agent has an Anam avatar.
    // Resolve the same effective avatar the session flow will use so the
    // pre-call/fallback face never changes when live video begins.
    let avatarImageUrl = agent.avatar_image_url ?? null;
    const anamApiKey = process.env.ANAM_API_KEY;
    if (!avatarImageUrl && anamApiKey) {
      const effectiveAvatar = await resolveLandingAvatar(
        anamApiKey,
        agent.anam_avatar_id,
      );
      avatarImageUrl = effectiveAvatar?.imageUrl ?? null;
    }

    return NextResponse.json({
      ...agent,
      avatar_image_url: avatarImageUrl,
      conversations,
      outcomes,
      conversionRate,
      lastActive,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: RouteContext) {
  try {
    const { agentId } = await ctx.params;
    const body = await req.json();

    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };

    const fieldMap: Record<string, string> = {
      name: "name",
      role: "role",
      website: "website",
      status: "status",
      avatarId: "avatar_id",
      anamAvatarId: "anam_avatar_id",
      anamVoiceId: "anam_voice_id",
      greeting: "greeting",
      tone: "tone",
      responseLength: "response_length",
      instructions: "instructions",
      language: "language",
      purpose: "purpose",
      profileId: "profile_id",
      avatarImageUrl: "avatar_image_url",
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) updateFields[dbKey] = body[jsKey];
    }

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .update(updateFields)
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    const { agentId } = await ctx.params;

    // Find all sessions linked to this agent
    const { data: sessions } = await supabaseAdmin
      .from("sessions")
      .select("id")
      .eq("agent_id", agentId);

    const sessionIds = (sessions ?? []).map((s) => s.id);

    if (sessionIds.length > 0) {
      // Delete child rows that reference these sessions
      await supabaseAdmin.from("turns").delete().in("session_id", sessionIds);
      await supabaseAdmin.from("leads").delete().in("session_id", sessionIds);
      await supabaseAdmin.from("analyses").delete().in("session_id", sessionIds);
      // Delete the sessions themselves
      await supabaseAdmin.from("sessions").delete().eq("agent_id", agentId);
    }

    // Now safe to delete the agent
    const { error } = await supabaseAdmin
      .from("agents")
      .delete()
      .eq("id", agentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
