import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function mapOutcome(dbOutcome?: string, hasLead?: boolean): string {
  if (dbOutcome === "lead_captured" || (!dbOutcome && hasLead)) return "Lead";
  if (dbOutcome === "demo_booked") return "Booked";
  if (dbOutcome === "no_conversion" || dbOutcome === "abandoned") return "Open";
  return hasLead ? "Lead" : "Open";
}

function formatDuration(startedAt: string, endedAt?: string | null): string {
  if (!endedAt) return "In progress";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalSec = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(totalSec / 60)}m ${String(totalSec % 60).padStart(2, "0")}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatStartedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function resolveVisitor(
  lead: { name?: string | null; email?: string | null } | undefined,
  userTurns: Array<{ content: string }>,
): string {
  if (lead?.name?.trim()) return lead.name.trim();
  if (lead?.email?.trim()) {
    const local = lead.email.split("@")[0] ?? lead.email;
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  // Best-effort: "my name is Alex" / "I'm Alex"
  for (const t of userTurns) {
    const m = t.content.match(/(?:my name is|i'?m|i am)\s+([A-Z][a-z]+)/i);
    if (m?.[1]) return m[1];
  }
  return "Anonymous visitor";
}

export async function GET() {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from("sessions")
      .select("id, started_at, ended_at, page_url, status, agent_id")
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!sessions?.length) {
      return NextResponse.json({ conversations: [] });
    }

    const sessionIds = sessions.map((s) => s.id);
    const agentIds = [...new Set(sessions.map((s) => s.agent_id).filter(Boolean))] as string[];

    const agentMap = new Map<string, { name: string; avatarId: string }>();
    if (agentIds.length) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, avatar_id")
        .in("id", agentIds);
      for (const a of agents ?? []) {
        agentMap.set(a.id, { name: a.name, avatarId: a.avatar_id ?? "sarah" });
      }
    }

    const [turnsRes, analysesRes, leadsRes] = await Promise.all([
      supabaseAdmin
        .from("turns")
        .select("session_id, role, content, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("analyses")
        .select("session_id, outcome, lead_score, summary")
        .in("session_id", sessionIds),
      supabaseAdmin
        .from("leads")
        .select("session_id, name, email")
        .in("session_id", sessionIds),
    ]);

    const turnsBySession = new Map<string, NonNullable<typeof turnsRes.data>>();
    for (const turn of turnsRes.data ?? []) {
      const arr = turnsBySession.get(turn.session_id) ?? [];
      arr.push(turn);
      turnsBySession.set(turn.session_id, arr);
    }

    const analysisMap = new Map((analysesRes.data ?? []).map((a) => [a.session_id, a]));
    const leadMap = new Map((leadsRes.data ?? []).map((l) => [l.session_id, l]));

    const conversations = sessions.map((session) => {
      const turns = turnsBySession.get(session.id) ?? [];
      const analysis = analysisMap.get(session.id);
      const lead = leadMap.get(session.id);
      const agentInfo = session.agent_id ? agentMap.get(session.agent_id) : undefined;
      const userTurns = turns.filter((t) => t.role === "user");
      const durationMs = session.ended_at
        ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
        : 0;

      return {
        id: session.id,
        shortId: session.id.slice(0, 8).toUpperCase(),
        visitor: resolveVisitor(lead, userTurns),
        leadEmail: lead?.email ?? null,
        agent: agentInfo?.name ?? "Sarah",
        avatarId: agentInfo?.avatarId ?? "sarah",
        startedAt: formatStartedAt(session.started_at),
        duration: formatDuration(session.started_at, session.ended_at),
        intent: analysis?.summary?.split(".")[0] ?? (turns.length ? "Sales inquiry" : "No conversation yet"),
        page: session.page_url ?? "/",
        outcome: mapOutcome(analysis?.outcome, Boolean(lead)),
        value: analysis?.lead_score != null ? `Score: ${analysis.lead_score}` : lead ? "Lead captured" : undefined,
        summary: analysis?.summary ?? (turns.length ? "Conversation recorded. Analysis pending." : "No messages in this session."),
        messages: turns.map((t) => ({
          speaker: (t.role === "user" ? "Visitor" : "Agent") as "Visitor" | "Agent",
          time: formatTime(t.created_at),
          text: t.content,
        })),
        events: [] as Array<{ time: string; label: string; detail: string }>,
        startedAtIso: session.started_at,
        durationMs,
        status: session.status ?? null,
      };
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
