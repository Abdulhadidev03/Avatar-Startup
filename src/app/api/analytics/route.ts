import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

function extractPath(urlStr?: string): string {
  if (!urlStr) return "/";
  try {
    const parsed = new URL(urlStr);
    return parsed.pathname || "/";
  } catch {
    return urlStr.startsWith("/") ? urlStr : `/${urlStr}`;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30d";
    const agentFilter = searchParams.get("agentId");

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const now = Date.now();
    const since = new Date(now - days * 86400000).toISOString();
    const previousSince = new Date(now - days * 2 * 86400000).toISOString();

    // Query agents
    const { data: agents } = await supabaseAdmin
      .from("agents")
      .select("id, name, role, status, website");

    const agentLookup = new Map<string, { id: string; name: string; role: string; status: string; website?: string }>();
    for (const a of agents ?? []) {
      agentLookup.set(a.id, a);
    }

    // Query sessions for current period
    let currentQuery = supabaseAdmin
      .from("sessions")
      .select("id, started_at, ended_at, agent_id, page_url, status")
      .gte("started_at", since);

    if (agentFilter && agentFilter !== "all") {
      currentQuery = currentQuery.eq("agent_id", agentFilter);
    }

    const { data: currentSessions } = await currentQuery;

    // Query sessions for previous period (for % change)
    let prevQuery = supabaseAdmin
      .from("sessions")
      .select("id, started_at, ended_at, agent_id")
      .gte("started_at", previousSince)
      .lt("started_at", since);

    if (agentFilter && agentFilter !== "all") {
      prevQuery = prevQuery.eq("agent_id", agentFilter);
    }

    const { data: previousSessions } = await prevQuery;

    const currentIds = (currentSessions ?? []).map((s) => s.id);
    const previousIds = (previousSessions ?? []).map((s) => s.id);

    // Query analyses
    const { data: currentAnalyses } = await supabaseAdmin
      .from("analyses")
      .select("session_id, outcome, lead_score, summary, created_at")
      .in("session_id", currentIds.length ? currentIds : ["__none__"]);

    const { count: previousOutcomes } = await supabaseAdmin
      .from("analyses")
      .select("*", { count: "exact", head: true })
      .in("session_id", previousIds.length ? previousIds : ["__none__"]);

    // Query leads
    const { data: currentLeads } = await supabaseAdmin
      .from("leads")
      .select("id, session_id, name, email, interest, created_at")
      .in("session_id", currentIds.length ? currentIds : ["__none__"]);

    // Calculate minutes
    function totalMinutes(sessions: Array<{ started_at: string; ended_at?: string }>) {
      return sessions.reduce((sum, s) => {
        if (!s.ended_at) return sum;
        return sum + Math.max(0, (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
      }, 0);
    }

    const currentMinutes = Math.round(totalMinutes(currentSessions ?? []));
    const previousMinutes = Math.round(totalMinutes(previousSessions ?? []));
    const currentConversations = currentSessions?.length ?? 0;
    const previousConversations = previousSessions?.length ?? 0;
    const currentOutcomes = currentAnalyses?.length ?? 0;
    const currentLeadsCount = currentLeads?.length ?? 0;

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
          Math.max(0, (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
        );
      }
      agentMap.set(key, existing);
    }

    const analysesSessionSet = new Set((currentAnalyses ?? []).map((a) => a.session_id));
    for (const s of currentSessions ?? []) {
      if (analysesSessionSet.has(s.id)) {
        const key = s.agent_id ?? "unassigned";
        const existing = agentMap.get(key);
        if (existing) {
          existing.outcomes++;
        }
      }
    }

    const agentBreakdown = (agents ?? []).map((a) => {
      const stats = agentMap.get(a.id) ?? { conversations: 0, outcomes: 0, minutes: 0 };
      return { id: a.id, name: a.name, role: a.role, status: a.status, ...stats };
    });

    // 1. Time-series Buckets for Trend Charts
    const numCheckpoints = period === "7d" ? 7 : period === "30d" ? 8 : 9;
    const stepMs = (days * 86400000) / numCheckpoints;
    const trendBuckets: {
      labels: string[];
      conversations: number[];
      outcomes: number[];
      minutes: number[];
      revenue: number[];
    } = {
      labels: [],
      conversations: Array(numCheckpoints).fill(0),
      outcomes: Array(numCheckpoints).fill(0),
      minutes: Array(numCheckpoints).fill(0),
      revenue: Array(numCheckpoints).fill(0),
    };

    const startTime = now - days * 86400000;
    for (let i = 0; i < numCheckpoints; i++) {
      const bucketTime = new Date(startTime + i * stepMs + stepMs / 2);
      trendBuckets.labels.push(
        bucketTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    }

    // Populate trend buckets with session data
    const sessionMap = new Map((currentSessions ?? []).map((s) => [s.id, s]));
    for (const s of currentSessions ?? []) {
      const sTime = new Date(s.started_at).getTime();
      const idx = Math.min(numCheckpoints - 1, Math.max(0, Math.floor((sTime - startTime) / stepMs)));
      trendBuckets.conversations[idx]++;
      if (s.ended_at) {
        const mins = Math.max(0, (new Date(s.ended_at).getTime() - sTime) / 60000);
        trendBuckets.minutes[idx] += Math.round(mins);
      }
    }

    for (const a of currentAnalyses ?? []) {
      const s = sessionMap.get(a.session_id);
      const aTime = a.created_at ? new Date(a.created_at).getTime() : s ? new Date(s.started_at).getTime() : now;
      const idx = Math.min(numCheckpoints - 1, Math.max(0, Math.floor((aTime - startTime) / stepMs)));
      trendBuckets.outcomes[idx]++;
      trendBuckets.revenue[idx] += a.outcome === "lead_captured" ? 450 : a.outcome === "demo_booked" ? 650 : 150;
    }

    // 2. Outcome breakdown mix
    const outcomeCounts = {
      lead_captured: 0,
      demo_booked: 0,
      no_conversion: 0,
      abandoned: 0,
    };
    for (const a of currentAnalyses ?? []) {
      const key = (a.outcome in outcomeCounts ? a.outcome : "no_conversion") as keyof typeof outcomeCounts;
      outcomeCounts[key]++;
    }

    const totalOutcomesCount = Math.max(1, currentOutcomes);
    const outcomeBreakdown = [
      {
        id: "lead",
        label: "Leads captured",
        value: outcomeCounts.lead_captured,
        share: Math.round((outcomeCounts.lead_captured / totalOutcomesCount) * 1000) / 10,
        kind: "Sales" as const,
      },
      {
        id: "booking",
        label: "Meetings booked",
        value: outcomeCounts.demo_booked,
        share: Math.round((outcomeCounts.demo_booked / totalOutcomesCount) * 1000) / 10,
        kind: "Sales" as const,
      },
      {
        id: "resolved",
        label: "Support resolved",
        value: outcomeCounts.no_conversion,
        share: Math.round((outcomeCounts.no_conversion / totalOutcomesCount) * 1000) / 10,
        kind: "Support" as const,
      },
      {
        id: "abandoned",
        label: "Early drop-offs",
        value: outcomeCounts.abandoned,
        share: Math.round((outcomeCounts.abandoned / totalOutcomesCount) * 1000) / 10,
        kind: "Support" as const,
      },
    ];

    // 3. Attributed recent outcomes ledger
    const leadsBySession = new Map<string, { name?: string; email?: string; interest?: string }>();
    for (const lead of currentLeads ?? []) {
      leadsBySession.set(lead.session_id, lead);
    }

    const recentOutcomes = (currentAnalyses ?? [])
      .slice()
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 15)
      .map((analysis) => {
        const session = sessionMap.get(analysis.session_id);
        const agent = session?.agent_id ? agentLookup.get(session.agent_id) : undefined;
        const lead = leadsBySession.get(analysis.session_id);

        let typeName = "Conversation completed";
        let kind: "Sales" | "Support" = "Support";
        if (analysis.outcome === "lead_captured") {
          typeName = "Lead captured";
          kind = "Sales";
        } else if (analysis.outcome === "demo_booked") {
          typeName = "Meeting booked";
          kind = "Sales";
        } else if (analysis.outcome === "no_conversion") {
          typeName = "Inquiry resolved";
          kind = "Support";
        }

        const visitorName = lead?.name || lead?.email || `Visitor ${analysis.session_id.slice(0, 4).toUpperCase()}`;
        const sourcePath = extractPath(session?.page_url);

        return {
          id: `OC-${analysis.session_id.slice(0, 4).toUpperCase()}`,
          visitor: visitorName,
          type: typeName,
          kind,
          agentId: session?.agent_id ?? "unknown",
          agent: agent?.name ?? "Sales Agent",
          siteId: session?.agent_id ? "northstar" : "help",
          source: sourcePath,
          value: lead?.interest ? lead.interest : analysis.lead_score ? `Score ${analysis.lead_score}` : "Qualified",
          when: analysis.created_at ? formatRelativeTime(analysis.created_at) : "Recently",
        };
      });

    // 4. Page Influence aggregation
    const pagesMap = new Map<string, { visitors: number; conversations: number; outcomes: number }>();
    for (const s of currentSessions ?? []) {
      const path = extractPath(s.page_url);
      const existing = pagesMap.get(path) ?? { visitors: 0, conversations: 0, outcomes: 0 };
      existing.conversations++;
      existing.visitors += 3;
      if (analysesSessionSet.has(s.id)) {
        existing.outcomes++;
      }
      pagesMap.set(path, existing);
    }

    const topPages = Array.from(pagesMap.entries())
      .map(([pagePath, stats]) => {
        const title = pagePath === "/" ? "Home" : pagePath.replace(/^\//, "").split(/[-_/]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        return {
          page: pagePath,
          title,
          siteId: "northstar",
          visitors: stats.visitors,
          conversations: stats.conversations,
          outcomes: stats.outcomes,
          influence: `$${stats.outcomes * 420}`,
        };
      })
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 8);

    // 5. Daily usage events
    const usageByDateAgent = new Map<string, { date: string; agentId: string; agent: string; site: string; conversations: number; minutes: number }>();
    for (const s of currentSessions ?? []) {
      const dateKey = new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const agentObj = s.agent_id ? agentLookup.get(s.agent_id) : undefined;
      const compositeKey = `${dateKey}__${s.agent_id ?? "unassigned"}`;
      const existing = usageByDateAgent.get(compositeKey) ?? {
        date: dateKey,
        agentId: s.agent_id ?? "unassigned",
        agent: agentObj?.name ?? "Sales Agent",
        site: agentObj?.website ? extractPath(agentObj.website) : "Client site",
        conversations: 0,
        minutes: 0,
      };
      existing.conversations++;
      if (s.ended_at) {
        existing.minutes += Math.round(
          Math.max(0, (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
        );
      }
      usageByDateAgent.set(compositeKey, existing);
    }

    const usageEvents = Array.from(usageByDateAgent.values())
      .map((entry) => ({
        ...entry,
        peak: Math.min(10, Math.max(1, Math.ceil(entry.conversations / 4))),
      }))
      .slice(0, 15);

    const estimatedRevenue = currentOutcomes * 450;

    return NextResponse.json({
      period,
      conversations: currentConversations,
      outcomes: currentOutcomes,
      leads: currentLeadsCount,
      minutes: currentMinutes,
      revenue: estimatedRevenue,
      change: {
        conversations: pctChange(currentConversations, previousConversations),
        outcomes: pctChange(currentOutcomes, previousOutcomes ?? 0),
        minutes: pctChange(currentMinutes, previousMinutes),
        revenue: pctChange(currentOutcomes, previousOutcomes ?? 0),
      },
      agents: agentBreakdown,
      trendBuckets,
      outcomeBreakdown,
      recentOutcomes,
      topPages,
      usageEvents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
