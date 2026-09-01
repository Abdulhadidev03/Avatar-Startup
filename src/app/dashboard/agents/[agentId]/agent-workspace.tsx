"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../dashboard-icons";
import { AvatarPortrait, StatusBadge } from "../../dashboard-ui";
import { avatars, type AgentProfile, type Conversation } from "../../mock-data";
import { useDialogFocus } from "../../use-dialog-focus";
import { findStoredAgent, upsertStoredAgent, type FrontendAgent } from "../agent-storage";

type WorkspaceTab = "Overview" | "Configure" | "Knowledge" | "Actions" | "Widget" | "Conversations";

const tabs: WorkspaceTab[] = ["Overview", "Configure", "Knowledge", "Actions", "Widget", "Conversations"];

const defaultKnowledge = [
  { id: "site", name: "Website", source: "northstar.com", items: "42 pages", status: "Ready", updated: "12 min ago", enabled: true },
  { id: "catalog", name: "Product catalog", source: "products.csv", items: "186 products", status: "Ready", updated: "2 hours ago", enabled: true },
  { id: "policy", name: "Returns and delivery", source: "policies.pdf", items: "18 sections", status: "Ready", updated: "Yesterday", enabled: true },
];

const agentActions = [
  { id: "lead", title: "Capture qualified leads", description: "Collect contact details after the visitor shows interest.", state: "Enabled" },
  { id: "product", title: "Recommend products", description: "Use page context and visitor needs to suggest the right option.", state: "Enabled" },
  { id: "cart", title: "Guide checkout", description: "Open the relevant product or checkout step for the visitor.", state: "Enabled" },
  { id: "meeting", title: "Book a meeting", description: "Connect a calendar to offer available meeting times.", state: "Needs setup" },
  { id: "handoff", title: "Human handoff", description: "Route high-intent or unresolved conversations to your team.", state: "Enabled" },
  { id: "ticket", title: "Create support ticket", description: "Connect your help desk to create support requests.", state: "Needs setup" },
];

const usageMinutesByAgent: Record<string, number> = {
  "northstar-sales": 3180,
  "ruh-support": 1640,
};

function WorkspaceAgentVisual({ agent }: { agent: FrontendAgent }) {
  return agent.customAvatarDataUrl ? (
    <Image className="ruh-avatar-portrait ruh-custom-avatar-image" src={agent.customAvatarDataUrl} alt={`${agent.name} avatar`} width={320} height={400} unoptimized />
  ) : <AvatarPortrait avatarId={agent.avatarId} />;
}

function OverviewTab({ agent, conversations }: { agent: FrontendAgent; conversations: Conversation[] }) {
  const [checking, setChecking] = useState(false);
  const draft = agent.status === "Draft";
  const supportAgent = agent.role.toLowerCase().includes("support");
  const purchases = supportAgent ? 0 : Math.round(agent.outcomes * 0.28);
  const leads = supportAgent ? 0 : Math.round(agent.outcomes * 0.19);
  const resolved = supportAgent ? agent.outcomes : Math.max(0, agent.outcomes - purchases - leads);
  const usageMinutes = usageMinutesByAgent[agent.id] ?? Math.round(agent.conversations * 2.24);
  const usage = usageMinutes ? `${Math.floor(usageMinutes / 60)}h ${usageMinutes % 60}m` : "0m";
  const installed = draft ? false : agent.widgetInstalled ?? true;
  return <div className="ruh-agent-tab-content">
    <div className="ruh-agent-kpi-grid">
      <article><span>Conversations</span><strong>{agent.conversations}</strong><small>{draft ? "Starts after deployment" : "Visitor conversations"}</small></article>
      <article><span>Results generated</span><strong>{agent.outcomes}</strong><small>{draft ? "No live outcomes yet" : "Purchases, leads, and resolutions"}</small></article>
      <article><span>Result rate</span><strong>{agent.conversionRate}</strong><small>{draft ? "Available after launch" : "From completed conversations"}</small></article>
      <article><span>Usage</span><strong>{usage}</strong><small>{draft ? "No connected time yet" : "Across all visitor sessions"}</small></article>
    </div>
    <div className="ruh-agent-overview-grid">
      {draft ? <section className="ruh-overview-panel ruh-inline-empty"><h3>Finish the last setup step</h3><p>Add the widget settings and launch this agent before outcomes and website impact can be measured.</p><Link className="ruh-primary-button" href={`/dashboard/agents/new?resume=${agent.id}`}>Continue setup</Link></section> : <section className="ruh-overview-panel ruh-impact-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Last 30 days</p><h2>Business impact</h2></div><Link href="/dashboard/analytics">Open analytics</Link></div><div className="ruh-impact-list"><div><span>Purchases assisted</span><strong>{purchases}</strong><small>Connected to agent outcomes</small></div><div><span>Qualified leads</span><strong>{leads}</strong><small>Captured with permission</small></div><div><span>Questions resolved</span><strong>{resolved}</strong><small>Completed without losing context</small></div></div></section>}
      <section className="ruh-overview-panel ruh-deployment-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Deployment</p><h2>Website status</h2></div>{draft || !installed ? <StatusBadge status="Draft" /> : <span className="ruh-health-label"><i /> {checking ? "Checking" : "Healthy"}</span>}</div><dl><div><dt>Website</dt><dd>{agent.website}</dd></div><div><dt>Widget</dt><dd>{installed ? "Installed" : "Not installed"}</dd></div><div><dt>Knowledge</dt><dd>{draft ? "Draft" : "Synced 12 min ago"}</dd></div><div><dt>Last activity</dt><dd>{agent.lastActive}</dd></div></dl>{draft ? <Link className="ruh-secondary-button" href={`/dashboard/agents/new?resume=${agent.id}`}>Finish setup</Link> : <button className="ruh-secondary-button" type="button" disabled={checking} onClick={() => { setChecking(true); window.setTimeout(() => setChecking(false), 700); }}>{checking ? "Checking…" : "Check installation"}</button>}</section>
    </div>
    <section className="ruh-overview-panel ruh-recent-conversations"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Activity</p><h2>Recent conversations</h2></div><Link href="/dashboard/conversations">View all</Link></div>{conversations.length ? <div className="ruh-conversation-rows">{conversations.slice(0, 3).map((conversation) => <Link href={`/dashboard/conversations?id=${conversation.id}`} key={conversation.id}><span className="ruh-visitor-avatar">{conversation.visitor.charAt(0)}</span><span><strong>{conversation.visitor}</strong><small>{conversation.intent} · {conversation.page}</small></span><span className={`ruh-outcome-pill is-${conversation.outcome.toLowerCase()}`}>{conversation.outcome}</span><span>{conversation.startedAt}</span><Icon name="arrow" width="14" height="14" /></Link>)}</div> : <div className="ruh-inline-empty"><h3>{draft ? "Launch to start conversations" : "No conversations yet"}</h3><p>{draft ? "Complete setup and install the agent when you are ready." : "Test the agent or install it on your website to begin."}</p></div>}</section>
  </div>;
}

function ConfigureTab({ agent }: { agent: AgentProfile }) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [avatarId, setAvatarId] = useState(agent.avatarId);
  const [voice, setVoice] = useState("Marin · Warm and natural");
  const [tone, setTone] = useState("Warm and professional");
  const [responseLength, setResponseLength] = useState("Balanced");
  const [greeting, setGreeting] = useState("Hi! I’m here if you’d like help choosing the right option.");
  const [saved, setSaved] = useState(true);
  const update = (callback: () => void) => { callback(); setSaved(false); };
  return <div className="ruh-agent-tab-content ruh-configure-layout">
    <section className="ruh-settings-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Identity</p><h2>Agent details</h2><p>These details are visible to visitors.</p></div></div><div className="ruh-builder-form-grid"><label className="ruh-form-field"><span>Agent name</span><input value={name} onChange={(event) => update(() => setName(event.target.value))} /></label><label className="ruh-form-field"><span>Role</span><input value={role} onChange={(event) => update(() => setRole(event.target.value))} /></label><label className="ruh-form-field ruh-full-field"><span>Welcome message</span><textarea rows={3} value={greeting} onChange={(event) => update(() => setGreeting(event.target.value))} /></label></div></section>
    <section className="ruh-settings-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Avatar</p><h2>Look and voice</h2><p>Change the visual avatar without changing the agent’s knowledge.</p></div></div><div className="ruh-config-avatar-grid">{avatars.slice(0, 6).map((avatar) => <button className={avatar.id === avatarId ? "is-selected" : ""} type="button" onClick={() => update(() => setAvatarId(avatar.id))} key={avatar.id}><AvatarPortrait avatarId={avatar.id} /><span>{avatar.name}</span>{avatar.id === avatarId ? <Icon name="check" width="13" height="13" /> : null}</button>)}</div><div className="ruh-control-pair"><label className="ruh-form-field"><span>Voice</span><select value={voice} onChange={(event) => update(() => setVoice(event.target.value))}><option>Marin · Warm and natural</option><option>James · Clear and assured</option><option>Zara · Bright and conversational</option><option>Sam · Calm and neutral</option></select></label><label className="ruh-form-field"><span>Tone</span><select value={tone} onChange={(event) => update(() => setTone(event.target.value))}><option>Warm and professional</option><option>Confident and concise</option><option>Calm and reassuring</option></select></label></div></section>
    <section className="ruh-settings-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Conversation style</p><h2>Response behavior</h2></div></div><div className="ruh-control-pair"><label className="ruh-form-field"><span>Response length</span><select value={responseLength} onChange={(event) => update(() => setResponseLength(event.target.value))}><option>Concise</option><option>Balanced</option><option>Detailed</option></select></label><label className="ruh-form-field"><span>Main language</span><select><option>English</option><option>Spanish</option><option>Arabic</option><option>Urdu</option></select></label></div><label className="ruh-form-field"><span>When the agent is unsure</span><textarea rows={3} defaultValue="Be honest that you do not know, offer a helpful next step, and ask whether the visitor wants a human." /></label></section>
    <div className="ruh-sticky-save-bar"><span>{saved ? "All changes published" : "You have unpublished changes"}</span><button className="ruh-primary-button" type="button" disabled={saved} onClick={() => setSaved(true)}>Publish changes</button></div>
  </div>;
}

function KnowledgeTab() {
  const [sources, setSources] = useState(defaultKnowledge);
  const [syncing, setSyncing] = useState(false);
  function syncAll() { setSyncing(true); window.setTimeout(() => { setSyncing(false); setSources((items) => items.map((item) => ({ ...item, updated: "Just now", status: "Ready" }))); }, 700); }
  return <div className="ruh-agent-tab-content"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Knowledge</p><h2>What this agent can use</h2><p>Keep website pages, documents, and product information current.</p></div><div><button className="ruh-secondary-button" type="button" onClick={syncAll}>{syncing ? "Syncing…" : "Sync all"}</button><label className="ruh-primary-button">Add knowledge<input type="file" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) setSources((items) => [...items, { id: `file-${Date.now()}`, name: file.name, source: "Uploaded file", items: "Processing", status: "Ready", updated: "Just now", enabled: true }]); }} /></label></div></div><div className="ruh-knowledge-table"><div className="ruh-table-head"><span>Source</span><span>Content</span><span>Status</span><span>Updated</span><span /></div>{sources.map((source) => <div className="ruh-table-row" key={source.id}><span><i>{source.id === "site" ? "WWW" : "DOC"}</i><span><strong>{source.name}</strong><small>{source.source}</small></span></span><span>{source.items}</span><span className="ruh-ready-label"><i /> {source.status}</span><span>{source.updated}</span><span><label className="ruh-switch"><input type="checkbox" checked={source.enabled} onChange={() => setSources((items) => items.map((item) => item.id === source.id ? { ...item, enabled: !item.enabled } : item))} /><i /></label><button type="button" aria-label={`Refresh ${source.name}`} onClick={() => setSources((items) => items.map((item) => item.id === source.id ? { ...item, updated: "Just now", status: "Ready" } : item))}>Refresh</button></span></div>)}</div></div>;
}

function ActionsTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ lead: true, product: true, cart: true, handoff: true });
  const [configured, setConfigured] = useState<string | null>(null);
  return <div className="ruh-agent-tab-content"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Capabilities</p><h2>Actions your agent can take</h2><p>Give visitors a useful next step instead of ending at an answer.</p></div><Link className="ruh-secondary-button" href="/dashboard/integrations">Manage integrations</Link></div>{configured ? <div className="ruh-inline-success" role="status"><Icon name="check" width="17" height="17" /><div><strong>Action configuration ready</strong><small>{configured} will use the defaults shown for this frontend handoff.</small></div></div> : null}<div className="ruh-workspace-action-grid">{agentActions.map((action) => <article className={enabled[action.id] ? "is-enabled" : ""} key={action.id}><div className="ruh-action-card-head"><span><Icon name={enabled[action.id] ? "check" : "plus"} width="16" height="16" /></span>{action.state === "Needs setup" ? <em>Needs integration</em> : <label className="ruh-switch"><input type="checkbox" checked={Boolean(enabled[action.id])} onChange={() => setEnabled((current) => ({ ...current, [action.id]: !current[action.id] }))} /><i /></label>}</div><h3>{action.title}</h3><p>{action.description}</p>{action.state === "Needs setup" ? <Link href="/dashboard/integrations">Connect to enable <Icon name="arrow" width="13" height="13" /></Link> : <button type="button" onClick={() => setConfigured(action.title)}>{configured === action.title ? "Configured" : "Configure"}</button>}</article>)}</div></div>;
}

function WidgetTab({ agent }: { agent: FrontendAgent }) {
  const [position, setPosition] = useState<"left" | "right">("right");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);
  const [installNotice, setInstallNotice] = useState<"email" | "checked" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const draft = agent.status === "Draft";
  const code = `<script src="https://widget.ruhana.ai/v1.js" data-agent="${agent.id}"></script>`;
  async function copy() { try { await navigator.clipboard.writeText(code); } catch { /* Optional in local preview. */ } setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
  return <div className="ruh-agent-tab-content ruh-widget-workspace"><div className="ruh-widget-settings"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Widget</p><h2>Website experience</h2><p>Control where and how your agent appears.</p></div>{draft ? <StatusBadge status="Draft" /> : <span className="ruh-health-label"><i /> {agent.widgetInstalled === false ? "Ready to install" : "Installed"}</span>}</div><div className="ruh-settings-panel"><div className="ruh-control-pair"><label className="ruh-form-field"><span>Position</span><select value={position} onChange={(event) => setPosition(event.target.value as "left" | "right")}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></label><label className="ruh-form-field"><span>Appearance</span><select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></label></div><label className="ruh-setting-row"><span><strong>Open with a greeting</strong><small>Show a quiet invitation after eight seconds.</small></span><span className="ruh-switch"><input type="checkbox" defaultChecked /><i /></span></label><label className="ruh-setting-row"><span><strong>Show on all pages</strong><small>Use page rules to limit where the agent appears.</small></span><span className="ruh-switch"><input type="checkbox" defaultChecked /><i /></span></label></div><div className="ruh-settings-panel"><div className="ruh-subsection-heading"><div><h3>Installation code</h3><p>{draft ? "Finish setup before installing this agent." : "Add this once before the closing body tag."}</p></div></div><div className="ruh-code-snippet"><code>{code}</code><button type="button" disabled={draft} onClick={copy}>{copied ? "Copied" : "Copy code"}</button></div><div className="ruh-install-actions">{draft ? <Link className="ruh-primary-button" href={`/dashboard/agents/new?resume=${agent.id}`}>Finish setup</Link> : <><button className="ruh-secondary-button" type="button" onClick={() => setInstallNotice("email")}>{installNotice === "email" ? "Email prepared" : "Email instructions"}</button><button className="ruh-secondary-button" type="button" onClick={() => setInstallNotice("checked")}>{installNotice === "checked" ? "Installation healthy" : "Check installation"}</button></>}</div></div></div><div className={`ruh-site-preview is-${theme}`}><div className="ruh-browser-bar"><i /><i /><i /><span>{agent.website}</span></div><div className="ruh-preview-site-content"><span /><strong /><span /><div /><div /></div><div className={`ruh-widget-preview is-${position}`}>{previewOpen ? <div className="ruh-widget-message"><WorkspaceAgentVisual agent={agent} /><span><strong>{agent.name}</strong><small>Hi! Would you like help finding the right option?</small></span><button type="button" aria-label="Close preview" onClick={() => setPreviewOpen(false)}>×</button></div> : null}<button className="ruh-widget-launcher" type="button" aria-expanded={previewOpen} onClick={() => setPreviewOpen((open) => !open)}><WorkspaceAgentVisual agent={agent} /><span>{previewOpen ? "Hide" : "Talk to"} {agent.name}</span></button></div></div></div>;
}

function ConversationsTab({ conversations }: { conversations: Conversation[] }) {
  const [outcome, setOutcome] = useState("All outcomes");
  const visible = outcome === "All outcomes" ? conversations : conversations.filter((conversation) => conversation.outcome === outcome);
  return <div className="ruh-agent-tab-content"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Conversations</p><h2>Visitor history</h2><p>Review what visitors needed, what the agent did, and the result.</p></div><div><select aria-label="Filter outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)}><option>All outcomes</option><option>Purchase</option><option>Lead</option><option>Resolved</option><option>Booked</option><option>Open</option></select><Link className="ruh-secondary-button" href="/dashboard/conversations">Open conversation center</Link></div></div>{visible.length ? <div className="ruh-knowledge-table ruh-conversations-table"><div className="ruh-table-head"><span>Visitor</span><span>Intent</span><span>Outcome</span><span>Duration</span><span>Date</span></div>{visible.map((conversation) => <Link className="ruh-table-row" href={`/dashboard/conversations?id=${conversation.id}`} key={conversation.id}><span><i>{conversation.visitor.charAt(0)}</i><span><strong>{conversation.visitor}</strong><small>{conversation.page}</small></span></span><span>{conversation.intent}</span><span><i className={`ruh-outcome-pill is-${conversation.outcome.toLowerCase()}`}>{conversation.outcome}</i></span><span>{conversation.duration}</span><span>{conversation.startedAt}</span></Link>)}</div> : <div className="ruh-inline-empty"><h3>{conversations.length ? "No matching conversations" : "No conversations yet"}</h3><p>{conversations.length ? "Choose another outcome to see this agent’s history." : "Once visitors talk with this agent, transcripts, page activity, and outcomes will appear here."}</p>{conversations.length ? <button className="ruh-secondary-button" type="button" onClick={() => setOutcome("All outcomes")}>Clear filter</button> : null}</div>}</div>;
}

export function AgentWorkspace({ agentId, initialAgent, conversations }: { agentId: string; initialAgent: AgentProfile | null; conversations: Conversation[] }) {
  const [agent, setAgent] = useState<FrontendAgent | null>(initialAgent);
  const [storageChecked, setStorageChecked] = useState(Boolean(initialAgent));
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Overview");
  const [status, setStatus] = useState<FrontendAgent["status"]>(initialAgent?.status ?? "Draft");
  const [testOpen, setTestOpen] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testMessages, setTestMessages] = useState<string[]>([]);
  const closeTest = useCallback(() => setTestOpen(false), []);
  const testDialogRef = useDialogFocus(testOpen, closeTest);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = findStoredAgent(agentId);
      if (stored) { setAgent(stored); setStatus(stored.status); }
      setStorageChecked(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [agentId]);

  const activeAgent = useMemo(() => agent ? { ...agent, status } : null, [agent, status]);
  function updateStatus(nextStatus: FrontendAgent["status"]) {
    if (!activeAgent) return;
    setStatus(nextStatus);
    const updated = { ...activeAgent, status: nextStatus, lastActive: "Updated just now" };
    setAgent(updated);
    upsertStoredAgent(updated);
  }
  function sendTestMessage() {
    const message = testInput.trim();
    if (!message) return;
    setTestMessages((items) => [...items, message]);
    setTestInput("");
  }

  if (!activeAgent) return <div className="ruh-page-stack"><Link className="ruh-back-link" href="/dashboard/agents">← All agents</Link><section className="ruh-inline-empty" role={storageChecked ? undefined : "status"}><h2>{storageChecked ? "Agent not found" : "Loading agent…"}</h2><p>{storageChecked ? "This local draft may have been removed. Return to My agents to choose another agent." : "Restoring the latest local agent state."}</p>{storageChecked ? <Link className="ruh-primary-button" href="/dashboard/agents">Back to My agents</Link> : null}</section></div>;

  const draft = activeAgent.status === "Draft";
  return <div className="ruh-page-stack ruh-agent-workspace">
    <Link className="ruh-back-link" href="/dashboard/agents">← All agents</Link>
    <header className="ruh-agent-workspace-header"><div className="ruh-agent-identity"><WorkspaceAgentVisual agent={activeAgent} /><div><span><StatusBadge status={status} /> {activeAgent.website}</span><h1>{activeAgent.name}</h1><p>{activeAgent.role}</p></div></div><div className="ruh-agent-header-actions">{draft ? <Link className="ruh-secondary-button" href={`/dashboard/agents/new?resume=${activeAgent.id}`}>Continue setup</Link> : <button className="ruh-secondary-button" type="button" onClick={() => updateStatus(status === "Paused" ? "Live" : "Paused")}>{status === "Paused" ? "Resume agent" : "Pause agent"}</button>}<button className="ruh-primary-button" type="button" onClick={() => setTestOpen(true)}>Test agent</button></div></header>
    <nav className="ruh-agent-tabs" aria-label="Agent settings">{tabs.map((tab) => <button className={activeTab === tab ? "is-active" : ""} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</nav>
    {activeTab === "Overview" ? <OverviewTab agent={activeAgent} conversations={conversations} /> : null}
    {activeTab === "Configure" ? <ConfigureTab agent={activeAgent} /> : null}
    {activeTab === "Knowledge" ? <KnowledgeTab /> : null}
    {activeTab === "Actions" ? <ActionsTab /> : null}
    {activeTab === "Widget" ? <WidgetTab agent={activeAgent} /> : null}
    {activeTab === "Conversations" ? <ConversationsTab conversations={conversations} /> : null}
    {testOpen ? <div className="ruh-dialog-backdrop" role="presentation" onMouseDown={closeTest}><section ref={testDialogRef} className="ruh-test-agent-dialog" role="dialog" aria-modal="true" aria-labelledby="test-agent-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><div className="ruh-test-agent-stage"><WorkspaceAgentVisual agent={activeAgent} /><span className="ruh-live-indicator"><i /> Preview</span></div><div className="ruh-test-agent-copy"><button className="ruh-icon-button" type="button" aria-label="Close test" onClick={closeTest}><Icon name="close" width="18" height="18" /></button><p className="ruh-kicker">Private test</p><h2 id="test-agent-title">Talk with {activeAgent.name}</h2><p>Try a real customer question. Test conversations do not affect analytics.</p><div className="ruh-test-transcript"><span><strong>{activeAgent.name}</strong><small>Hi! What can I help you find today?</small></span>{testMessages.map((message, index) => <span className="is-visitor" key={`${message}-${index}`}><strong>You</strong><small>{message}</small></span>)}</div><div className="ruh-test-message-control"><input data-autofocus aria-label="Test message" value={testInput} onChange={(event) => setTestInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); sendTestMessage(); } }} placeholder="Type a test message…" /><button type="button" aria-label="Send test message" disabled={!testInput.trim()} onClick={sendTestMessage}><Icon name="arrow" width="16" height="16" /></button></div></div></section></div> : null}
  </div>;
}
