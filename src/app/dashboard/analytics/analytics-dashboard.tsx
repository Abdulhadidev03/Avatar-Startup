"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  agents as mockAgents,
  funnel,
  intentSignals,
  objections,
  outcomeBreakdown,
  periodOptions,
  periodSnapshots,
  recentOutcomes,
  recommendations,
  sites,
  topPages,
  trendLabels,
  trendSeries,
  usageEvents,
  type AnalyticsView,
  type MetricSnapshot,
  type PeriodKey,
} from "./analytics-data";

type RealAnalytics = {
  conversations: number;
  outcomes: number;
  leads: number;
  minutes: number;
  change: { conversations: number; outcomes: number; minutes: number };
  agents: Array<{ id: string; name: string; role: string; status: string; conversations: number; outcomes: number; minutes: number }>;
} | null;

type AgentFilter = "all" | string;
type SiteFilter = "all" | (typeof sites)[number]["id"];
type TrendMetric = keyof typeof trendSeries;
type OutcomeKind = "All" | "Sales" | "Support";
type SignalView = "intent" | "objections";
type VariableStyle = CSSProperties & Record<`--${string}`, string>;

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const pageContent: Record<
  AnalyticsView,
  { eyebrow: string; title: string; description: string }
> = {
  overview: {
    eyebrow: "Analytics",
    title: "Business impact",
    description: "Understand what your agents change—from first conversation to final outcome.",
  },
  results: {
    eyebrow: "Analytics · Outcomes",
    title: "Outcomes",
    description: "Track the revenue, leads, bookings, and resolutions created with Ruhana.",
  },
  insights: {
    eyebrow: "Analytics · Website",
    title: "Website insights",
    description: "See what visitors want, where they hesitate, and which pages influence action.",
  },
  usage: {
    eyebrow: "Analytics · Usage",
    title: "Usage",
    description: "Monitor conversations, connected time, concurrency, and plan allowance.",
  },
};

function formatNumber(value: number) {
  return numberFormatter.format(Math.round(value));
}

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value));
}

function formatAverageDuration(minutes: number, conversations: number) {
  if (!conversations) return "0m 00s";
  const seconds = Math.round((minutes / conversations) * 60);
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

function getFilteredSnapshot(
  period: PeriodKey,
  siteId: SiteFilter,
  agentId: AgentFilter,
): MetricSnapshot {
  const snapshot = periodSnapshots[period];
  const base = periodSnapshots["30d"];
  const site = sites.find((item) => item.id === siteId);
  const agent = mockAgents.find((item) => item.id === agentId);

  if (site && agent && site.agentId !== agent.id) {
    return {
      revenue: 0,
      outcomes: 0,
      conversations: 0,
      minutes: 0,
      change: snapshot.change,
    };
  }

  const factor = (key: "revenue" | "outcomes" | "conversations" | "minutes") => {
    const selected = site ?? agent;
    return selected ? selected[key] / base[key] : 1;
  };

  return {
    revenue: Math.round(snapshot.revenue * factor("revenue")),
    outcomes: Math.round(snapshot.outcomes * factor("outcomes")),
    conversations: Math.round(snapshot.conversations * factor("conversations")),
    minutes: Math.round(snapshot.minutes * factor("minutes")),
    change: snapshot.change,
  };
}

function AnalyticsFilters({
  period,
  site,
  agent,
  onPeriodChange,
  onSiteChange,
  onAgentChange,
  agentList,
}: {
  period: PeriodKey;
  site: SiteFilter;
  agent: AgentFilter;
  onPeriodChange: (period: PeriodKey) => void;
  onSiteChange: (site: SiteFilter) => void;
  onAgentChange: (agent: AgentFilter) => void;
  agentList: readonly { id: string; name: string; role: string }[];
}) {
  const hasFilters = period !== "30d" || site !== "all" || agent !== "all";

  return (
    <section className="ruh-analytics-filterbar" aria-label="Analytics filters">
      <div className="ruh-analytics-sync-state">
        <span aria-hidden="true" />
        <div>
          <strong>Workspace data</strong>
          <small>Updated 2 minutes ago</small>
        </div>
      </div>
      <div className="ruh-analytics-filter-controls">
        <label className="ruh-analytics-select">
          <span>Date range</span>
          <select
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as PeriodKey)}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ruh-analytics-select">
          <span>Website</span>
          <select
            value={site}
            onChange={(event) => onSiteChange(event.target.value as SiteFilter)}
          >
            <option value="all">All websites</option>
            {sites.map((item) => (
              <option key={item.id} value={item.id}>
                {item.domain}
              </option>
            ))}
          </select>
        </label>
        <label className="ruh-analytics-select">
          <span>Agent</span>
          <select
            value={agent}
            onChange={(event) => onAgentChange(event.target.value as AgentFilter)}
          >
            <option value="all">All agents</option>
            {agentList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.role}
              </option>
            ))}
          </select>
        </label>
        {hasFilters ? (
          <button
            className="ruh-analytics-reset"
            type="button"
            onClick={() => {
              onPeriodChange("30d");
              onSiteChange("all");
              onAgentChange("all");
            }}
          >
            Reset
          </button>
        ) : null}
      </div>
    </section>
  );
}

function MetricCards({ metrics }: { metrics: MetricSnapshot }) {
  const hasActivity = metrics.conversations > 0;
  const cards = [
    {
      label: "Agent-assisted revenue",
      value: formatCurrency(metrics.revenue),
      change: metrics.change.revenue,
      note: "Attributed revenue",
    },
    {
      label: "Outcomes generated",
      value: formatNumber(metrics.outcomes),
      change: metrics.change.outcomes,
      note: "Sales and support",
    },
    {
      label: "Conversations",
      value: formatNumber(metrics.conversations),
      change: metrics.change.conversations,
      note: "Visitor conversations",
    },
    {
      label: "Connected time",
      value: `${formatNumber(metrics.minutes)} min`,
      change: metrics.change.minutes,
      note: "Across all agents",
    },
  ];

  return (
    <section className="ruh-metric-grid ruh-analytics-kpis" aria-label="Key performance metrics">
      {cards.map((metric) => (
        <article key={metric.label}>
          <p>{metric.label}</p>
          <strong>{metric.value}</strong>
          {hasActivity ? (
            <span>
              <b className="ruh-positive-change">↑ {metric.change}%</b> {metric.note}
            </span>
          ) : (
            <span>No live activity in this view</span>
          )}
        </article>
      ))}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="ruh-data-card-header">
      <div>
        {eyebrow ? <p className="ruh-data-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

function TrendChart({
  metric,
  metrics,
  period,
}: {
  metric: TrendMetric;
  metrics: MetricSnapshot;
  period: PeriodKey;
}) {
  const series = trendSeries[metric];
  const labels = trendLabels[period];
  const baselineTotal = periodSnapshots[period][metric];
  const selectedTotal = metrics[metric];
  const values = series.values[period].map((value) =>
    Math.round(value * (selectedTotal / baselineTotal)),
  );
  const maximum = Math.max(1, ...values);

  return (
    <>
      <div className="ruh-analytics-chart" aria-hidden="true">
        <div className="ruh-analytics-chart-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="ruh-analytics-bars">
          {values.map((value, index) => {
            const formatted = series.formatter === "currency" ? formatCurrency(value) : formatNumber(value);
            return (
              <div className="ruh-analytics-bar-column" key={labels[index]}>
                <span
                  className="ruh-analytics-bar"
                  style={{ "--bar-size": `${value ? Math.max(8, (value / maximum) * 100) : 0}%` } as VariableStyle}
                  title={`${labels[index]}: ${formatted}`}
                />
                <small>{labels[index]}</small>
              </div>
            );
          })}
        </div>
      </div>
      <table className="ruh-sr-only">
        <caption>{series.label} trend over the selected period</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">{series.label}</th></tr></thead>
        <tbody>
          {values.map((value, index) => (
            <tr key={labels[index]}>
              <th scope="row">{labels[index]}</th>
              <td>{series.formatter === "currency" ? formatCurrency(value) : formatNumber(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Funnel({ metrics }: { metrics: MetricSnapshot }) {
  const conversationRatio = metrics.conversations / periodSnapshots["30d"].conversations;
  const outcomeRatio = metrics.outcomes / periodSnapshots["30d"].outcomes;
  const steps = funnel.map((step, index) => ({
    ...step,
    value: Math.max(
      1,
      Math.round(step.value * (index < 2 ? conversationRatio : index === 4 ? outcomeRatio : conversationRatio)),
    ),
  }));

  return (
    <ol className="ruh-impact-funnel" aria-label="Visitor outcome funnel">
      {steps.map((step, index) => (
        <li key={step.label}>
          <div
            style={{ "--funnel-size": `${100 - index * 12}%` } as VariableStyle}
            aria-hidden="true"
          />
          <span>
            <small>{step.label}</small>
            <strong>{formatNumber(step.value)}</strong>
          </span>
          {index ? (
            <em>{Math.round((step.value / steps[index - 1].value) * 100)}%</em>
          ) : (
            <em>Reach</em>
          )}
        </li>
      ))}
    </ol>
  );
}

function Overview({
  metrics,
  agentFilter,
  period,
  siteFilter,
  agentList,
}: {
  metrics: MetricSnapshot;
  agentFilter: AgentFilter;
  period: PeriodKey;
  siteFilter: SiteFilter;
  agentList: readonly { id: string; name: string; role: string; status: string; conversations: number; outcomes: number; revenue: number; minutes?: number }[];
}) {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("revenue");
  const periodSnapshot = periodSnapshots[period];
  const baseSnapshot = periodSnapshots["30d"];
  const selectedSite = sites.find((site) => site.id === siteFilter);
  const visibleAgents = agentList.filter(
    (item) =>
      (agentFilter === "all" || item.id === agentFilter) &&
      (!selectedSite || selectedSite.agentId === item.id),
  );

  return (
    <>
      <MetricCards metrics={metrics} />

      <div className="ruh-analytics-layout ruh-analytics-layout-primary">
        <section className="ruh-data-card ruh-data-card-wide">
          <SectionHeader
            eyebrow="Performance trend"
            title={trendSeries[trendMetric].label}
            description="Eight checkpoints across the selected period."
            action={
              <div className="ruh-segmented-control" aria-label="Trend metric">
                {(["revenue", "conversations", "outcomes"] as TrendMetric[]).map((item) => (
                  <button
                    className={trendMetric === item ? "is-active" : ""}
                    type="button"
                    aria-pressed={trendMetric === item}
                    onClick={() => setTrendMetric(item)}
                    key={item}
                  >
                    {trendSeries[item].label}
                  </button>
                ))}
              </div>
            }
          />
          <TrendChart metric={trendMetric} metrics={metrics} period={period} />
        </section>

        <section className="ruh-data-card">
          <SectionHeader
            eyebrow="Conversion journey"
            title="Outcome funnel"
            description="Where visitors progress or leave."
          />
          <Funnel metrics={metrics} />
        </section>
      </div>

      <section className="ruh-data-card">
        <SectionHeader
          eyebrow="Agent comparison"
          title="Performance by agent"
          description="Business contribution alongside conversation volume."
          action={
            <Link className="ruh-text-link" href="/dashboard/analytics/results">
              View all outcomes →
            </Link>
          }
        />
        <div className="ruh-table-scroll">
          <table className="ruh-data-table">
            <thead>
              <tr>
                <th scope="col">Agent</th>
                <th scope="col">Status</th>
                <th scope="col">Conversations</th>
                <th scope="col">Outcomes</th>
                <th scope="col">Outcome rate</th>
                <th scope="col">Assisted revenue</th>
              </tr>
            </thead>
            <tbody>
              {visibleAgents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <span className="ruh-table-identity">
                      <b className={`ruh-agent-miniature is-${agent.id}`}>{agent.name.slice(0, 1)}</b>
                      <span>
                        <strong>{agent.name}</strong>
                        <small>{agent.role}</small>
                      </span>
                    </span>
                  </td>
                  <td><span className={`ruh-table-status is-${agent.status.toLowerCase()}`}>{agent.status}</span></td>
                  <td>{formatNumber(agent.conversations * (periodSnapshot.conversations / baseSnapshot.conversations))}</td>
                  <td>{formatNumber(agent.outcomes * (periodSnapshot.outcomes / baseSnapshot.outcomes))}</td>
                  <td>{agent.conversations ? `${((agent.outcomes / agent.conversations) * 100).toFixed(1)}%` : "—"}</td>
                  <td><strong>{formatCurrency(agent.revenue * (periodSnapshot.revenue / baseSnapshot.revenue))}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Outcomes({
  metrics,
  siteFilter,
  agentFilter,
}: {
  metrics: MetricSnapshot;
  siteFilter: SiteFilter;
  agentFilter: AgentFilter;
}) {
  const [kind, setKind] = useState<OutcomeKind>("All");
  const outcomeScale = metrics.outcomes / periodSnapshots["30d"].outcomes;
  const visibleOutcomes = recentOutcomes.filter(
    (outcome) =>
      (kind === "All" || outcome.kind === kind) &&
      (siteFilter === "all" || outcome.siteId === siteFilter) &&
      (agentFilter === "all" || outcome.agentId === agentFilter),
  );

  return (
    <>
      <section className="ruh-outcome-kpis" aria-label="Outcome totals">
        {outcomeBreakdown.map((outcome) => (
          <article className="ruh-data-card ruh-outcome-kpi" key={outcome.id}>
            <span>{outcome.label}</span>
            <strong>{formatNumber(outcome.value * outcomeScale)}</strong>
            <small>{outcome.share}% of generated outcomes</small>
          </article>
        ))}
      </section>

      <div className="ruh-analytics-layout ruh-analytics-layout-even">
        <section className="ruh-data-card">
          <SectionHeader
            eyebrow="Journey"
            title="From attention to action"
            description="A qualified visitor reaches an outcome 79% of the time."
          />
          <Funnel metrics={metrics} />
        </section>
        <section className="ruh-data-card">
          <SectionHeader
            eyebrow="Outcome mix"
            title="What agents completed"
            description={`${formatNumber(metrics.outcomes)} measurable results in this view.`}
          />
          <div className="ruh-ranked-bars">
            {outcomeBreakdown.map((outcome) => (
              <div key={outcome.id}>
                <span>
                  <strong>{outcome.label}</strong>
                  <small>{formatNumber(outcome.value * outcomeScale)}</small>
                </span>
                <div><i style={{ "--rank-size": `${outcome.share}%` } as VariableStyle} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="ruh-data-card">
        <SectionHeader
          eyebrow="Attribution"
          title="Recent outcomes"
          description="Each result stays connected to its visitor, agent, and source page."
          action={
            <div className="ruh-segmented-control" aria-label="Outcome type">
              {(["All", "Sales", "Support"] as OutcomeKind[]).map((item) => (
                <button
                  className={kind === item ? "is-active" : ""}
                  type="button"
                  aria-pressed={kind === item}
                  onClick={() => setKind(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          }
        />
        <div className="ruh-table-scroll">
          <table className="ruh-data-table">
            <thead>
              <tr>
                <th scope="col">Outcome</th>
                <th scope="col">Visitor</th>
                <th scope="col">Agent</th>
                <th scope="col">Influenced on</th>
                <th scope="col">Value</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleOutcomes.map((outcome) => (
                <tr key={outcome.id}>
                  <td><span className="ruh-table-outcome"><i />{outcome.type}</span></td>
                  <td>{outcome.visitor}</td>
                  <td>{outcome.agent}</td>
                  <td>{outcome.source}</td>
                  <td><strong>{outcome.value}</strong></td>
                  <td>{outcome.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleOutcomes.length ? (
            <div className="ruh-table-empty">No outcomes match the selected filters.</div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function Insights({ metrics, period, siteFilter, agentFilter }: { metrics: MetricSnapshot; period: PeriodKey; siteFilter: SiteFilter; agentFilter: AgentFilter }) {
  const [signalView, setSignalView] = useState<SignalView>("intent");
  const signals = signalView === "intent" ? intentSignals : objections;
  const maximum = Math.max(...signals.map((signal) => signal.value));
  const insightScale = metrics.conversations / periodSnapshots["30d"].conversations;
  const selectedAgent = agentFilter === "all" ? null : agentFilter;
  const visiblePages = topPages.filter((page) => {
    const pageSite = sites.find((site) => site.id === page.siteId);
    return (siteFilter === "all" || page.siteId === siteFilter) &&
      (!selectedAgent || pageSite?.agentId === selectedAgent);
  });
  const pagePeriodScale = periodSnapshots[period].conversations / periodSnapshots["30d"].conversations;

  return (
    <>
      <section className="ruh-insight-summary" aria-label="Website insight summary">
        <article><span>High-intent visitors</span><strong>{formatNumber(312 * insightScale)}</strong><small>↑ 16.2% from the previous period</small></article>
        <article><span>Products discussed</span><strong>{formatNumber(Math.max(1, 28 * Math.sqrt(insightScale)))}</strong><small>Across the selected website view</small></article>
        <article><span>Recommendation clicks</span><strong>{formatNumber(617 * insightScale)}</strong><small>47.8% of conversations</small></article>
      </section>

      <div className="ruh-analytics-layout ruh-analytics-layout-primary">
        <section className="ruh-data-card ruh-data-card-wide">
          <SectionHeader
            eyebrow="Visitor language"
            title={signalView === "intent" ? "Top visitor intentions" : "Common objections"}
            description="Grouped from conversation context, clicks, and page activity."
            action={
              <div className="ruh-segmented-control" aria-label="Insight category">
                <button
                  className={signalView === "intent" ? "is-active" : ""}
                  type="button"
                  aria-pressed={signalView === "intent"}
                  onClick={() => setSignalView("intent")}
                >
                  Intent
                </button>
                <button
                  className={signalView === "objections" ? "is-active" : ""}
                  type="button"
                  aria-pressed={signalView === "objections"}
                  onClick={() => setSignalView("objections")}
                >
                  Objections
                </button>
              </div>
            }
          />
          <div className="ruh-ranked-bars ruh-ranked-bars-large">
            {signals.map((signal) => (
              <div key={signal.label}>
                <span><strong>{signal.label}</strong><small>{formatNumber(signal.value * insightScale)} conversations</small></span>
                <div><i style={{ "--rank-size": `${(signal.value / maximum) * 100}%` } as VariableStyle} /></div>
              </div>
            ))}
          </div>
        </section>

        <aside className="ruh-data-card ruh-impact-note">
          <p className="ruh-data-eyebrow">Ruhana signal</p>
          <strong>Pricing visitors are your highest-value audience.</strong>
          <p>They account for 32% of conversations but 58% of agent-assisted revenue.</p>
          <span><b>2.4×</b> higher outcome rate after an agent answers an implementation question.</span>
        </aside>
      </div>

      <section className="ruh-data-card">
        <SectionHeader
          eyebrow="Page influence"
          title="Pages that create action"
          description="Website traffic connected to conversations and measurable outcomes."
        />
        <div className="ruh-table-scroll">
          <table className="ruh-data-table">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Visitors</th>
                <th scope="col">Conversations</th>
                <th scope="col">Outcomes</th>
                <th scope="col">Conversation rate</th>
                <th scope="col">Revenue influence</th>
              </tr>
            </thead>
            <tbody>
              {visiblePages.map((page) => (
                <tr key={`${page.siteId}-${page.page}`}>
                  <td><span className="ruh-table-page"><strong>{page.title}</strong><small>{page.page}</small></span></td>
                  <td>{formatNumber(page.visitors * pagePeriodScale)}</td>
                  <td>{formatNumber(page.conversations * pagePeriodScale)}</td>
                  <td>{formatNumber(page.outcomes * pagePeriodScale)}</td>
                  <td>{((page.conversations / page.visitors) * 100).toFixed(1)}%</td>
                  <td><strong>{page.influence}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visiblePages.length ? <div className="ruh-table-empty">No page activity matches this website.</div> : null}
        </div>
      </section>

      <section className="ruh-recommendation-grid" aria-labelledby="recommendations-title">
        <div className="ruh-recommendation-intro">
          <p className="ruh-data-eyebrow">Recommended next moves</p>
          <h2 id="recommendations-title">Turn insight into improvement</h2>
          <p>Prioritized from visitor behavior and successful conversations.</p>
        </div>
        {recommendations.map((item) => (
          <article className="ruh-data-card ruh-recommendation-card" key={item.title}>
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
            <strong>{item.impact}</strong>
          </article>
        ))}
      </section>
    </>
  );
}

function Usage({
  metrics,
  period,
  siteFilter,
  agentFilter,
  agentList,
}: {
  metrics: MetricSnapshot;
  period: PeriodKey;
  siteFilter: SiteFilter;
  agentFilter: AgentFilter;
  agentList: readonly { id: string; name: string; role: string; status: string; conversations: number; outcomes: number; revenue: number; minutes?: number }[];
}) {
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("minutes");
  const allowance = 10000;
  const usagePercent = (metrics.minutes / allowance) * 100;
  const displayedUsagePercent = Math.min(100, usagePercent);
  const selectedSite = sites.find((site) => site.id === siteFilter);
  const visibleAgents = agentList.filter(
    (item) =>
      (agentFilter === "all" || item.id === agentFilter) &&
      (!selectedSite || selectedSite.agentId === item.id),
  );
  const conversationPeriodScale = periodSnapshots[period].conversations / periodSnapshots["30d"].conversations;
  const minutePeriodScale = periodSnapshots[period].minutes / periodSnapshots["30d"].minutes;
  const visibleEvents = usageEvents.filter(
    (event) =>
      (agentFilter === "all" || event.agentId === agentFilter) &&
      (siteFilter === "all" || sites.find((site) => site.id === siteFilter)?.name === event.site),
  );

  return (
    <>
      <section className="ruh-insight-summary ruh-usage-summary" aria-label="Usage summary">
        <article><span>Connected time</span><strong>{formatNumber(metrics.minutes)} min</strong><small>Across all live sessions</small></article>
        <article><span>Conversations</span><strong>{formatNumber(metrics.conversations)}</strong><small>{formatAverageDuration(metrics.minutes, metrics.conversations)} average duration</small></article>
        <article><span>Peak concurrency</span><strong>18</strong><small>30 concurrent sessions available</small></article>
      </section>

      <div className="ruh-analytics-layout ruh-analytics-layout-primary">
        <section className="ruh-data-card ruh-data-card-wide">
          <SectionHeader
            eyebrow="Usage trend"
            title={trendSeries[trendMetric].label}
            description="Daily activity grouped across the selected period."
            action={
              <div className="ruh-segmented-control" aria-label="Usage metric">
                {(["minutes", "conversations"] as TrendMetric[]).map((item) => (
                  <button
                    className={trendMetric === item ? "is-active" : ""}
                    type="button"
                    aria-pressed={trendMetric === item}
                    onClick={() => setTrendMetric(item)}
                    key={item}
                  >
                    {trendSeries[item].label}
                  </button>
                ))}
              </div>
            }
          />
          <TrendChart metric={trendMetric} metrics={metrics} period={period} />
        </section>

        <aside className="ruh-data-card ruh-plan-usage">
          <SectionHeader eyebrow="Growth plan" title="Monthly allowance" />
          <div className="ruh-plan-usage-total">
            <strong>{formatNumber(metrics.minutes)}</strong>
            <span>of {formatNumber(allowance)} minutes</span>
          </div>
          <div
            className="ruh-plan-progress"
            role="progressbar"
            aria-label="Growth plan minute allowance"
            aria-valuemin={0}
            aria-valuemax={allowance}
            aria-valuenow={Math.min(metrics.minutes, allowance)}
            aria-valuetext={`${formatNumber(metrics.minutes)} of ${formatNumber(allowance)} minutes used`}
          >
            <i style={{ "--usage-size": `${displayedUsagePercent}%` } as VariableStyle} />
          </div>
          <p>
            {metrics.minutes <= allowance
              ? `${formatNumber(allowance - metrics.minutes)} minutes remain in this allowance.`
              : `${formatNumber(metrics.minutes - allowance)} minutes exceed this allowance in the selected period.`}
          </p>
          <Link className="ruh-secondary-button" href="/dashboard/billing">Manage plan</Link>
        </aside>
      </div>

      <section className="ruh-data-card">
        <SectionHeader
          eyebrow="Allocation"
          title="Usage by agent"
          description="Connected time and conversation volume for each active agent."
        />
        <div className="ruh-usage-agent-list">
          {visibleAgents.map((agent) => (
            <article key={agent.id}>
              <span className="ruh-table-identity">
                <b className={`ruh-agent-miniature is-${agent.id}`}>{agent.name.slice(0, 1)}</b>
                <span><strong>{agent.name}</strong><small>{agent.role}</small></span>
              </span>
              <div>
                <span><small>Conversations</small><strong>{formatNumber(agent.conversations * conversationPeriodScale)}</strong></span>
                <span><small>Minutes</small><strong>{formatNumber((agent.minutes ?? 0) * minutePeriodScale)}</strong></span>
                <span><small>Share</small><strong>{(((agent.minutes ?? 0) / periodSnapshots["30d"].minutes) * 100).toFixed(1)}%</strong></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ruh-data-card">
        <SectionHeader
          eyebrow="Recent activity"
          title="Daily usage"
          description="The latest recorded usage grouped by agent and website."
        />
        <div className="ruh-table-scroll">
          <table className="ruh-data-table">
            <thead>
              <tr><th scope="col">Date</th><th scope="col">Agent</th><th scope="col">Website</th><th scope="col">Conversations</th><th scope="col">Minutes</th><th scope="col">Peak sessions</th></tr>
            </thead>
            <tbody>
              {visibleEvents.map((event) => (
                <tr key={`${event.date}-${event.agent}`}>
                  <td>{event.date}</td><td>{event.agent}</td><td>{event.site}</td><td>{event.conversations}</td><td>{event.minutes}</td><td>{event.peak}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleEvents.length ? <div className="ruh-table-empty">No usage entries match the selected filters.</div> : null}
        </div>
      </section>
    </>
  );
}

export function AnalyticsDashboard({ view }: { view: AnalyticsView }) {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [site, setSite] = useState<SiteFilter>("all");
  const [agent, setAgent] = useState<AgentFilter>("all");
  const [realData, setRealData] = useState<RealAnalytics>(null);
  const content = pageContent[view];

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch(`/api/analytics?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          if (data.conversations > 0 || data.agents?.length > 0) {
            setRealData(data);
          }
        }
      } catch {
        // Use mock data
      }
    }
    loadAnalytics();
  }, [period]);

  const metrics = useMemo(() => {
    if (realData) {
      return {
        revenue: 0,
        outcomes: realData.outcomes,
        conversations: realData.conversations,
        minutes: realData.minutes,
        change: {
          revenue: 0,
          outcomes: realData.change.outcomes,
          conversations: realData.change.conversations,
          minutes: realData.change.minutes,
        },
      } satisfies MetricSnapshot;
    }
    return getFilteredSnapshot(period, site, agent);
  }, [realData, period, site, agent]);

  const agents = realData?.agents?.length
    ? realData.agents.map((a) => ({ ...a, revenue: 0 }))
    : mockAgents;

  return (
    <div className="ruh-page-stack ruh-analytics-page">
      <div className="ruh-page-heading ruh-analytics-page-heading">
        <div>
          <p className="ruh-kicker">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
        <div className="ruh-analytics-heading-summary">
          <span>Outcome rate</span>
          <strong>{metrics.conversations ? ((metrics.outcomes / metrics.conversations) * 100).toFixed(1) : "0.0"}%</strong>
        </div>
      </div>

      <AnalyticsFilters
        period={period}
        site={site}
        agent={agent}
        onPeriodChange={setPeriod}
        onSiteChange={setSite}
        onAgentChange={setAgent}
        agentList={agents}
      />

      {view === "overview" ? <Overview metrics={metrics} agentFilter={agent} period={period} siteFilter={site} agentList={agents} /> : null}
      {view === "results" ? <Outcomes metrics={metrics} siteFilter={site} agentFilter={agent} /> : null}
      {view === "insights" ? <Insights metrics={metrics} period={period} siteFilter={site} agentFilter={agent} /> : null}
      {view === "usage" ? (
        <Usage metrics={metrics} period={period} siteFilter={site} agentFilter={agent} agentList={agents} />
      ) : null}
    </div>
  );
}
