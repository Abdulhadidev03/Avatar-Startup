import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30d";

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const previousSince = new Date(
      Date.now() - days * 2 * 86400000,
    ).toISOString();

    // Current period sessions
    const { data: currentSessions } = await supabaseAdmin
      .from("sessions")
      .select("id, started_at, ended_at, agent_id")
      .gte("started_at", since);

    // Previous period sessions (for % change)
    const { data: previousSessions } = await supabaseAdmin
      .from("sessions")
      .select("id, started_at, ended_at, agent_id")
      .gte("started_at", previousSince)
      .lt("started_at", since);

    const currentIds = (currentSessions ?? []).map((s) => s.id);
    const previousIds = (previousSessions ?? []).map((s) => s.id);

    // Outcomes for current period
    const { count: currentOutcomes } = await supabaseAdmin
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .in("session_id", currentIds.length ? currentIds : ["__none__"]);

    const { count: previousOutcomes } = await supabaseAdmin
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .in("session_id", previousIds.length ? previousIds : ["__none__"]);

    // Leads for current period
    const { count: currentLeads } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("session_id", currentIds.length ? currentIds : ["__none__"]);

    // Calculate total minutes from sessions with end times
    function totalMinutes(sessions: Array<{ started_at: string; ended_at?: string }>) {
      return sessions.reduce((sum, s) => {
        if (!s.ended_at) return sum;
        return sum + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
      }, 0);
    }

    const currentMinutes = Math.round(totalMinutes(currentSessions ?? []));
    const previousMinutes = Math.round(totalMinutes(previousSessions ?? []));
    const currentConversations = currentSessions?.length ?? 0;
    const previousConversations = previousSessions?.length ?? 0;

    function pctChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    }

    // Per-agent breakdown
    const agentMap = new Map<
      string,
      { conversations: number; outcomes: number; minutes: number }
    >();
    for (const s of currentSessions ?? []) {
      const key = s.agent_id ?? "unassigned";
      const existing = agentMap.get(key) ?? {
        conversations: 0,
        outcomes: 0,
        minutes: 0,
      };
      existing.conversations++;
      if (s.ended_at) {
        existing.minutes += Math.round(
          (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000,
        );
      }
      agentMap.set(key, existing);
    }

    // Load agent names
    const { data: agents } = await supabaseAdmin
      .from("agents")
      .select("id, name, role, status");

    const agentBreakdown = (agents ?? []).map((a) => {
      const stats = agentMap.get(a.id) ?? { conversations: 0, outcomes: 0, minutes: 0 };
      return { id: a.id, name: a.name, role: a.role, status: a.status, ...stats };
    });

    return NextResponse.json({
      period,
      conversations: currentConversations,
      outcomes: currentOutcomes ?? 0,
      leads: currentLeads ?? 0,
      minutes: currentMinutes,
      change: {
        conversations: pctChange(currentConversations, previousConversations),
        outcomes: pctChange(currentOutcomes ?? 0, previousOutcomes ?? 0),
        minutes: pctChange(currentMinutes, previousMinutes),
      },
      agents: agentBreakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
