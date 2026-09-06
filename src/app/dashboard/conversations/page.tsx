"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AvatarPortrait, PageHeader } from "../dashboard-ui";
import { type ConversationOutcome } from "../mock-data";

const outcomeOptions: Array<"All" | ConversationOutcome> = [
  "All",
  "Purchase",
  "Lead",
  "Resolved",
  "Booked",
  "Open",
];

type DateRange = "today" | "yesterday" | "7" | "30" | "90";

type DashboardConversation = {
  id: string;
  shortId: string;
  visitor: string;
  leadEmail: string | null;
  agent: string;
  avatarId: string;
  startedAt: string;
  duration: string;
  intent: string;
  page: string;
  outcome: ConversationOutcome;
  value?: string;
  summary: string;
  messages: Array<{ speaker: "Visitor" | "Agent"; time: string; text: string }>;
  events: Array<{ time: string; label: string; detail: string }>;
  startedAtIso: string;
  durationMs: number;
};

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

function daysSinceNow(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<DashboardConversation[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/conversations");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Failed (${res.status})`);
        if (!cancelled) setConversations(data.conversations ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load conversations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const agentOptions = useMemo(
    () => ["All agents", ...Array.from(new Set(conversations.map((item) => item.agent)))],
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const ageDays = daysSinceNow(conversation.startedAtIso);
      const matchesRange =
        range === "today"
          ? ageDays === 0
          : range === "yesterday"
            ? ageDays === 1
            : ageDays <= Number(range);
      const matchesQuery =
        !normalizedQuery ||
        [
          conversation.shortId,
          conversation.id,
          conversation.visitor,
          conversation.leadEmail ?? "",
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
    const durations = filteredConversations.map((c) => c.durationMs).filter((d) => d > 0);
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
    filteredConversations.find((conversation) => conversation.id === selectedId || conversation.shortId === selectedId) ??
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
      conversation.shortId,
      conversation.startedAt,
      conversation.visitor,
      conversation.leadEmail ?? "",
      conversation.agent,
      conversation.intent,
      conversation.page,
      conversation.outcome,
      conversation.value ?? "",
      conversation.duration,
    ]);
    const csv = [
      ["ID", "Started", "Visitor", "Email", "Agent", "Intent", "Page", "Outcome", "Value", "Duration"],
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

      {error ? (
        <div className="ruh-inline-notice" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      <section className="ruh-metric-grid" aria-label="Conversation performance">
        <article>
          <p>Conversations</p>
          <strong>{loading ? "…" : computedMetrics.conversations}</strong>
          <span>{computedMetrics.trend}</span>
        </article>
        <article>
          <p>Completed outcomes</p>
          <strong>{loading ? "…" : computedMetrics.outcomes}</strong>
          <span>Sales and support results</span>
        </article>
        <article>
          <p>Result rate</p>
          <strong>{loading ? "…" : computedMetrics.rate}</strong>
          <span>Conversations with a useful result</span>
        </article>
        <article>
          <p>Average duration</p>
          <strong>{loading ? "…" : computedMetrics.duration}</strong>
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
            {loading ? (
              <div className="ruh-filter-empty">
                <h2>Loading conversations…</h2>
                <p>Pulling sessions, transcripts, and outcomes from your workspace.</p>
              </div>
            ) : filteredConversations.length ? (
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
                <h2>{conversations.length ? "No conversations match these filters" : "No conversations yet"}</h2>
                <p>{conversations.length ? "Clear the filters to see all visitor activity." : "Test an agent or install the widget to start recording calls."}</p>
                {conversations.length ? (
                  <button className="ruh-secondary-button" type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {activeConversation ? (
            <aside className="ruh-conversation-detail" aria-live="polite">
              <div className="ruh-detail-header">
                <div>
                  <p className="ruh-kicker">{activeConversation.shortId}</p>
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
                  {activeConversation.leadEmail ? (
                    <div>
                      <dt>Email</dt>
                      <dd>{activeConversation.leadEmail}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="ruh-transcript">
                <h3>Transcript</h3>
                {activeConversation.messages.length ? (
                  activeConversation.messages.map((message, index) => (
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
                  ))
                ) : (
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>
                    No transcript recorded for this session. Messages appear after the visitor talks and `/api/brain` saves turns.
                  </p>
                )}
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
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>
                    Page-level journey tracking is not yet enabled. It will appear here after the analytics embed ships.
                  </p>
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
