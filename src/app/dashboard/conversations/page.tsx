"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AvatarPortrait, PageHeader } from "../dashboard-ui";
import { type Conversation, type ConversationOutcome } from "../mock-data";
import { supabaseBrowser } from "@/lib/supabase-browser";

const outcomeOptions: Array<"All" | ConversationOutcome> = [
  "All",
  "Purchase",
  "Lead",
  "Resolved",
  "Booked",
  "Open",
];

type DateRange = "today" | "yesterday" | "7" | "30" | "90";

const rangeTrendLabels: Record<DateRange, string> = {
  today: "Since midnight",
  yesterday: "Complete day",
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
};

function outcomeClass(outcome: ConversationOutcome) {
  return `ruh-outcome-badge is-${outcome.toLowerCase()}`;
}

function mapOutcome(dbOutcome?: string): ConversationOutcome {
  switch (dbOutcome) {
    case "lead_captured": return "Lead";
    case "demo_booked": return "Booked";
    case "no_conversion": return "Open";
    case "abandoned": return "Open";
    default: return "Open";
  }
}

function formatDuration(startedAt: string, endedAt?: string): string {
  if (!endedAt) return "In progress";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${String(sec).padStart(2, "0")}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatStartedAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function daysSinceNow(startedAt: string): number {
  const ms = Date.now() - new Date(startedAt).getTime();
  return Math.floor(ms / 86400000);
}

function ConversationsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [agent, setAgent] = useState("All agents");
  const [outcome, setOutcome] = useState<(typeof outcomeOptions)[number]>("All");
  const [range, setRange] = useState<DateRange>("30");
  const [notice, setNotice] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    async function fetchRealConversations() {
      const { data: sessions } = await supabaseBrowser
        .from("sessions")
        .select("id, started_at, ended_at, page_url, status, agent_id")
        .order("started_at", { ascending: false })
        .limit(50);

      if (!sessions?.length) return;

      const sessionIds = sessions.map((s) => s.id);

      // Load agents for name + avatar resolution
      const agentIds = [...new Set(sessions.map((s) => s.agent_id).filter(Boolean))];
      const agentMap = new Map<string, { name: string; avatarId: string }>();
      if (agentIds.length) {
        const { data: agents } = await supabaseBrowser
          .from("agents")
          .select("id, name, avatar_id")
          .in("id", agentIds);
        for (const a of agents ?? []) agentMap.set(a.id, { name: a.name, avatarId: a.avatar_id ?? "sarah" });
      }

      const [turnsRes, analysesRes, leadsRes] = await Promise.all([
        supabaseBrowser.from("turns").select("session_id, role, content, created_at").in("session_id", sessionIds).order("created_at", { ascending: true }),
        supabaseBrowser.from("analyses").select("session_id, outcome, lead_score, summary").in("session_id", sessionIds),
        supabaseBrowser.from("leads").select("session_id, name, email").in("session_id", sessionIds),
      ]);

      const turnsBySession = new Map<string, typeof turnsRes.data>();
      for (const turn of turnsRes.data ?? []) {
        const arr = turnsBySession.get(turn.session_id) ?? [];
        arr.push(turn);
        turnsBySession.set(turn.session_id, arr);
      }

      const analysisMap = new Map((analysesRes.data ?? []).map((a) => [a.session_id, a]));
      const leadMap = new Map((leadsRes.data ?? []).map((l) => [l.session_id, l]));

      const realConversations: Conversation[] = sessions.map((session) => {
        const turns = turnsBySession.get(session.id) ?? [];
        const analysis = analysisMap.get(session.id);
        const lead = leadMap.get(session.id);
        const agentInfo = session.agent_id ? agentMap.get(session.agent_id) : undefined;
        const agentName = agentInfo?.name ?? "Sarah";
        const avatarId = agentInfo?.avatarId ?? "sarah";

        return {
          id: session.id.slice(0, 8).toUpperCase(),
          visitor: lead?.name || "Anonymous visitor",
          agent: agentName,
          avatarId,
          startedAt: formatStartedAt(session.started_at),
          duration: formatDuration(session.started_at, session.ended_at),
          intent: analysis?.summary?.split(".")[0] ?? "Sales inquiry",
          page: session.page_url ?? "/",
          outcome: mapOutcome(analysis?.outcome),
          value: analysis?.lead_score ? `Score: ${analysis.lead_score}` : undefined,
          summary: analysis?.summary ?? "Conversation recorded.",
          messages: turns.map((t) => ({
            speaker: (t.role === "user" ? "Visitor" : "Agent") as "Visitor" | "Agent",
            time: formatTime(t.created_at),
            text: t.content,
          })),
          events: [],
          _realStartedAt: session.started_at,
          _durationMs: session.ended_at ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime() : 0,
        } as Conversation & { _realStartedAt?: string; _durationMs?: number };
      });

      setConversations(realConversations);
    }

    fetchRealConversations();
  }, []);

  const agentOptions = useMemo(
    () => ["All agents", ...Array.from(new Set(conversations.map((item) => item.agent)))],
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const real = conversation as Conversation & { _realStartedAt?: string };
      const ageDays = real._realStartedAt
        ? daysSinceNow(real._realStartedAt)
        : conversation.startedAt.startsWith("Today") ? 0 : 1;
      const matchesRange =
        range === "today"
          ? ageDays === 0
          : range === "yesterday"
            ? ageDays === 1
            : ageDays <= Number(range);
      const matchesQuery =
        !normalizedQuery ||
        [
          conversation.id,
          conversation.visitor,
          conversation.agent,
          conversation.intent,
          conversation.page,
          conversation.summary,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesAgent = agent === "All agents" || conversation.agent === agent;
      const matchesOutcome = outcome === "All" || conversation.outcome === outcome;
      return matchesRange && matchesQuery && matchesAgent && matchesOutcome;
    });
  }, [agent, conversations, outcome, query, range]);

  const computedMetrics = useMemo(() => {
    const total = filteredConversations.length;
    const withOutcome = filteredConversations.filter((c) => c.outcome !== "Open").length;
    const rate = total > 0 ? ((withOutcome / total) * 100).toFixed(1) + "%" : "—";
    const durations = filteredConversations
      .map((c) => (c as Conversation & { _durationMs?: number })._durationMs ?? 0)
      .filter((d) => d > 0);
    let avgDuration = "—";
    let totalMinutes = 0;
    if (durations.length) {
      const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
      const avgSec = Math.round(avgMs / 1000);
      avgDuration = `${Math.floor(avgSec / 60)}m ${String(avgSec % 60).padStart(2, "0")}s`;
      totalMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / 60000);
    }
    return {
      conversations: String(total),
      outcomes: String(withOutcome),
      rate,
      duration: avgDuration,
      trend: rangeTrendLabels[range],
      minutes: `${totalMinutes.toLocaleString()} connected minutes`,
    };
  }, [filteredConversations, range]);

  const selectedId = searchParams.get("id") ?? filteredConversations[0]?.id ?? "";

  const activeConversation =
    filteredConversations.find((conversation) => conversation.id === selectedId) ??
    filteredConversations[0] ??
    null;

  function clearFilters() {
    setQuery("");
    setAgent("All agents");
    setOutcome("All");
    setRange("30");
  }

  function selectConversation(id: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("id", id);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  function exportConversations() {
    const rows = filteredConversations.map((conversation) => [
      conversation.id,
      conversation.startedAt,
      conversation.visitor,
      conversation.agent,
      conversation.intent,
      conversation.page,
      conversation.outcome,
      conversation.value ?? "",
      conversation.duration,
    ]);
    const csv = [
      ["ID", "Started", "Visitor", "Agent", "Intent", "Page", "Outcome", "Value", "Duration"],
      ...rows,
    ]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ruhana-conversations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${filteredConversations.length} conversations exported.`);
  }

  return (
    <div className="ruh-page-stack ruh-conversations-page">
      <PageHeader
        eyebrow="Agents"
        title="Conversations"
        description="See what visitors asked, what your agents did, and which conversations produced a result."
        actions={
          <button className="ruh-secondary-button" type="button" onClick={exportConversations}>
            Export CSV
          </button>
        }
      />

      {notice ? (
        <div className="ruh-inline-notice is-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="ruh-metric-grid" aria-label="Conversation performance">
        <article>
          <p>Conversations</p>
          <strong>{computedMetrics.conversations}</strong>
          <span>{computedMetrics.trend}</span>
        </article>
        <article>
          <p>Completed outcomes</p>
          <strong>{computedMetrics.outcomes}</strong>
          <span>Sales and support results</span>
        </article>
        <article>
          <p>Result rate</p>
          <strong>{computedMetrics.rate}</strong>
          <span>Conversations with a useful result</span>
        </article>
        <article>
          <p>Average duration</p>
          <strong>{computedMetrics.duration}</strong>
          <span>{computedMetrics.minutes}</span>
        </article>
      </section>

      <section className="ruh-data-surface ruh-conversation-workspace" aria-label="Conversation history">
        <div className="ruh-data-toolbar">
          <label className="ruh-search-control">
            <span className="ruh-sr-only">Search conversations</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search visitor, intent, page, or ID"
            />
          </label>
          <div className="ruh-filter-controls">
            <label>
              <span className="ruh-sr-only">Date range</span>
              <select value={range} onChange={(event) => setRange(event.target.value as DateRange)}>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </label>
            <label>
              <span className="ruh-sr-only">Filter by agent</span>
              <select value={agent} onChange={(event) => setAgent(event.target.value)}>
                {agentOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="ruh-sr-only">Filter by outcome</span>
              <select
                value={outcome}
                onChange={(event) =>
                  setOutcome(event.target.value as (typeof outcomeOptions)[number])
                }
              >
                {outcomeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "All" ? "All outcomes" : option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="ruh-conversation-layout">
          <div className="ruh-table-scroll">
            {filteredConversations.length ? (
              <table className="ruh-data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Intent</th>
                    <th>Outcome</th>
                    <th>Value</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConversations.map((conversation) => (
                    <tr
                      key={conversation.id}
                      className={activeConversation?.id === conversation.id ? "is-selected" : ""}
                      onClick={() => selectConversation(conversation.id)}
                    >
                      <td>
                        <button
                          className="ruh-conversation-identity"
                          type="button"
                          onClick={() => selectConversation(conversation.id)}
                          aria-label={`Open conversation with ${conversation.visitor}`}
                        >
                          <AvatarPortrait avatarId={conversation.avatarId} />
                          <span>
                            <strong>{conversation.visitor}</strong>
                            <small>{conversation.agent} · {conversation.duration}</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <strong>{conversation.intent}</strong>
                        <small>{conversation.page}</small>
                      </td>
                      <td>
                        <span className={outcomeClass(conversation.outcome)}>
                          {conversation.outcome}
                        </span>
                      </td>
                      <td>{conversation.value ?? "—"}</td>
                      <td>{conversation.startedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ruh-filter-empty">
                <h2>No conversations match these filters</h2>
                <p>Clear the filters to see all visitor activity.</p>
                <button className="ruh-secondary-button" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {activeConversation ? (
            <aside className="ruh-conversation-detail" aria-live="polite">
              <div className="ruh-detail-header">
                <div>
                  <p className="ruh-kicker">{activeConversation.id}</p>
                  <h2>{activeConversation.visitor}</h2>
                  <p>{activeConversation.startedAt} · {activeConversation.duration}</p>
                </div>
                <span className={outcomeClass(activeConversation.outcome)}>
                  {activeConversation.outcome}
                </span>
              </div>

              <div className="ruh-outcome-summary">
                <span>Outcome</span>
                <strong>
                  {activeConversation.outcome}
                  {activeConversation.value ? ` · ${activeConversation.value}` : ""}
                </strong>
                <small>Attributed to {activeConversation.agent}</small>
              </div>

              <div className="ruh-detail-summary">
                <h3>Summary</h3>
                <p>{activeConversation.summary}</p>
                <dl>
                  <div>
                    <dt>Intent</dt>
                    <dd>{activeConversation.intent}</dd>
                  </div>
                  <div>
                    <dt>Entry page</dt>
                    <dd>{activeConversation.page}</dd>
                  </div>
                </dl>
              </div>

              <div className="ruh-transcript">
                <h3>Transcript</h3>
                {activeConversation.messages.map((message, index) => (
                  <article
                    className={message.speaker === "Agent" ? "is-agent" : "is-visitor"}
                    key={`${message.time}-${index}`}
                  >
                    <div>
                      <strong>{message.speaker === "Agent" ? activeConversation.agent : message.speaker}</strong>
                      <time>{message.time}</time>
                    </div>
                    <p>{message.text}</p>
                  </article>
                ))}
              </div>

              <div className="ruh-journey-timeline">
                <h3>Visitor journey</h3>
                {activeConversation.events.length > 0 ? (
                  <ol>
                    {activeConversation.events.map((event, index) => (
                      <li key={`${event.time}-${index}`}>
                        <time>{event.time}</time>
                        <span>
                          <strong>{event.label}</strong>
                          <small>{event.detail}</small>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>Page-level journey tracking is not yet enabled for this agent.</p>
                )}
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="ruh-page-stack ruh-page-loading">Loading conversations…</div>}>
      <ConversationsContent />
    </Suspense>
  );
}
