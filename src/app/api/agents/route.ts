import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: agents, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const agentIds = agents.map((a) => a.id);

    // Fetch conversation counts per agent
    const { data: sessions } = await supabaseAdmin
      .from("sessions")
      .select("id, agent_id, started_at, ended_at")
      .in("agent_id", agentIds.length ? agentIds : ["__none__"]);

    const sessionIds = (sessions ?? []).map((s) => s.id);

    const { data: analyses } = await supabaseAdmin
      .from("analyses")
      .select("session_id")
      .in("session_id", sessionIds.length ? sessionIds : ["__none__"]);

    const sessionsByAgent = new Map<string, typeof sessions>();
    for (const s of sessions ?? []) {
      const arr = sessionsByAgent.get(s.agent_id) ?? [];
      arr.push(s);
      sessionsByAgent.set(s.agent_id, arr);
    }

    const analysisSessionIds = new Set((analyses ?? []).map((a) => a.session_id));

    const enriched = agents.map((agent) => {
      const agentSessions = sessionsByAgent.get(agent.id) ?? [];
      const outcomes = agentSessions.filter((s) => analysisSessionIds.has(s.id)).length;
      const conversionRate =
        agentSessions.length > 0
          ? `${((outcomes / agentSessions.length) * 100).toFixed(1)}%`
          : "—";

      let lastActive = "No activity yet";
      if (agentSessions.length > 0) {
        const latest = agentSessions[0]?.started_at;
        if (latest) {
          const diff = Date.now() - new Date(latest).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 60) lastActive = `${mins} min ago`;
          else if (mins < 1440) lastActive = `${Math.floor(mins / 60)}h ago`;
          else lastActive = `${Math.floor(mins / 1440)}d ago`;
        }
      }

      return {
        ...agent,
        conversations: agentSessions.length,
        outcomes,
        conversionRate,
        lastActive,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .insert({
        name: body.name,
        role: body.role ?? "Sales concierge",
        website: body.website ?? "",
        status: body.status ?? "Draft",
        avatar_id: body.avatarId ?? "sarah",
        anam_avatar_id: body.anamAvatarId ?? null,
        anam_voice_id: body.anamVoiceId ?? null,
        avatar_image_url: body.avatarImageUrl ?? null,
        greeting: body.greeting ?? "Hi! I'm here if you'd like help finding the right option.",
        tone: body.tone ?? "Warm and professional",
        response_length: body.responseLength ?? "Balanced",
        instructions: body.instructions ?? null,
        language: body.language ?? "English",
        purpose: body.purpose ?? "sales",
        profile_id: body.profileId ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(agent, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
