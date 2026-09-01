"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AvatarPortrait, PageHeader } from "../dashboard-ui";
import { conversations, type ConversationOutcome } from "../mock-data";

const outcomeOptions: Array<"All" | ConversationOutcome> = [
  "All",
  "Purchase",
  "Lead",
  "Resolved",
  "Booked",
  "Open",
];

type DateRange = "today" | "yesterday" | "7" | "30" | "90";

const rangeMetrics: Record<
  DateRange,
  { conversations: string; outcomes: string; rate: string; duration: string; trend: string; minutes: string }
> = {
  today: { conversations: "47", outcomes: "19", rate: "40.4%", duration: "3m 28s", trend: "Since midnight", minutes: "163 connected minutes" },
  yesterday: { conversations: "52", outcomes: "21", rate: "40.4%", duration: "3m 51s", trend: "Complete day", minutes: "200 connected minutes" },
  "7": { conversations: "342", outcomes: "137", rate: "40.1%", duration: "3m 46s", trend: "↑ 6.8% from previous period", minutes: "1,288 connected minutes" },
  "30": { conversations: "1,284", outcomes: "514", rate: "40.0%", duration: "3m 45s", trend: "↑ 8.3% from previous period", minutes: "4,820 connected minutes" },
  "90": { conversations: "3,415", outcomes: "1,367", rate: "40.0%", duration: "3m 46s", trend: "↑ 11.2% from previous period", minutes: "12,840 connected minutes" },
};

function outcomeClass(outcome: ConversationOutcome) {
  return `ruh-outcome-badge is-${outcome.toLowerCase()}`;
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

  const agentOptions = useMemo(
    () => ["All agents", ...Array.from(new Set(conversations.map((item) => item.agent)))],
    [],
  );

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const ageDays = conversation.startedAt.startsWith("Today") ? 0 : 1;
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
  }, [agent, outcome, query, range]);

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
          <strong>{rangeMetrics[range].conversations}</strong>
          <span>{rangeMetrics[range].trend}</span>
        </article>
        <article>
          <p>Completed outcomes</p>
          <strong>{rangeMetrics[range].outcomes}</strong>
          <span>Sales and support results</span>
        </article>
        <article>
          <p>Result rate</p>
          <strong>{rangeMetrics[range].rate}</strong>
          <span>Conversations with a useful result</span>
        </article>
        <article>
          <p>Average duration</p>
          <strong>{rangeMetrics[range].duration}</strong>
          <span>{rangeMetrics[range].minutes}</span>
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
