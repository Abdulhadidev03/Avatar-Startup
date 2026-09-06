"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient, AnamEvent } from "@anam-ai/js-sdk";
import type { AnamClient } from "@anam-ai/js-sdk";
import { useRouter } from "next/navigation";
import { Icon } from "../../dashboard-icons";
import { AvatarPortrait, StatusBadge } from "../../dashboard-ui";
import { avatars, type AgentProfile, type Conversation } from "../../mock-data";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { FrontendAgent } from "../agent-storage";

type WorkspaceTab = "Overview" | "Configure" | "Knowledge" | "Actions" | "Widget" | "Conversations";

function AgentAvatar({ agent }: { agent: AgentProfile & { avatarImageUrl?: string } }) {
  if (agent.avatarImageUrl) {
    return <Image className="ruh-avatar-portrait ruh-custom-avatar-image" src={agent.avatarImageUrl} alt={agent.name} width={320} height={400} unoptimized />;
  }
  return <AvatarPortrait avatarId={agent.avatarId} />;
}

const tabs: WorkspaceTab[] = ["Overview", "Configure", "Knowledge", "Actions", "Widget", "Conversations"];

type KnowledgeSource = { id: string; name: string; source: string; item_count: string; status: string; enabled: boolean; updated_at: string; file_url?: string };

const agentActions = [
  { id: "lead", title: "Capture qualified leads", description: "Collect contact details after the visitor shows interest.", state: "Enabled" },
  { id: "product", title: "Recommend products", description: "Use page context and visitor needs to suggest the right option.", state: "Enabled" },
  { id: "cart", title: "Guide checkout", description: "Open the relevant product or checkout step for the visitor.", state: "Enabled" },
  { id: "meeting", title: "Book a meeting", description: "Connect a calendar to offer available meeting times.", state: "Needs setup" },
  { id: "handoff", title: "Human handoff", description: "Route high-intent or unresolved conversations to your team.", state: "Enabled" },
  { id: "ticket", title: "Create support ticket", description: "Connect your help desk to create support requests.", state: "Needs setup" },
];

function OverviewTab({ agent, conversations }: { agent: FrontendAgent; conversations: Conversation[] }) {
  const [checking, setChecking] = useState(false);
  const [installResult, setInstallResult] = useState<{ installed: boolean; reason: string } | null>(null);

  // Compute real usage from conversation durations
  const usageMinutes = conversations.reduce((sum, c) => {
    const match = c.duration.match(/(\d+)m/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
  const usageHours = Math.floor(usageMinutes / 60);
  const usageMins = usageMinutes % 60;
  const usageLabel = usageMinutes > 0 ? `${usageHours}h ${String(usageMins).padStart(2, "0")}m` : "0m";

  // Compute real outcome counts
  const leadCount = conversations.filter((c) => c.outcome === "Lead" || c.outcome === "Booked").length;
  const resolvedCount = conversations.filter((c) => c.outcome === "Resolved").length;
  const purchaseCount = conversations.filter((c) => c.outcome === "Purchase").length;

  return <div className="ruh-agent-tab-content">
    <div className="ruh-agent-kpi-grid">
      <article><span>Conversations</span><strong>{agent.conversations}</strong><small>From all sessions</small></article>
      <article><span>Results generated</span><strong>{agent.outcomes}</strong><small>Purchases, leads, and resolutions</small></article>
      <article><span>Result rate</span><strong>{agent.conversionRate}</strong><small>From completed conversations</small></article>
      <article><span>Usage</span><strong>{usageLabel}</strong><small>Across all visitor sessions</small></article>
    </div>
    <div className="ruh-agent-overview-grid">
      <section className="ruh-overview-panel ruh-impact-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Last 30 days</p><h2>Business impact</h2></div><Link href="/dashboard/analytics">Open analytics</Link></div><div className="ruh-impact-list"><div><span>Purchases assisted</span><strong>{purchaseCount}</strong><small>Attributed to this agent</small></div><div><span>Qualified leads</span><strong>{leadCount}</strong><small>Leads and bookings captured</small></div><div><span>Questions resolved</span><strong>{resolvedCount}</strong><small>Resolved without handoff</small></div></div></section>
      <section className="ruh-overview-panel ruh-deployment-panel"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Deployment</p><h2>Website status</h2></div><span className="ruh-health-label"><i /> {checking ? "Checking" : installResult ? (installResult.installed ? "Healthy" : "Not found") : "Unknown"}</span></div><dl><div><dt>Website</dt><dd>{agent.website}</dd></div><div><dt>Widget</dt><dd>{installResult ? (installResult.installed ? "Installed ✓" : "Not detected") : "—"}</dd></div><div><dt>Last activity</dt><dd>{agent.lastActive}</dd></div></dl>{installResult && !installResult.installed && <p style={{ fontSize: 12, color: "var(--warning)", margin: "0 0 8px" }}>{installResult.reason}</p>}<button className="ruh-secondary-button" type="button" disabled={checking} onClick={async () => { setChecking(true); try { const res = await fetch(`/api/agents/${agent.id}/check-install`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ websiteUrl: agent.website }) }); if (res.ok) { const data = await res.json(); setInstallResult(data); } } catch {} setChecking(false); }}>{checking ? "Checking…" : "Check installation"}</button></section>
    </div>
    <section className="ruh-overview-panel ruh-recent-conversations"><div className="ruh-panel-heading"><div><p className="ruh-kicker">Activity</p><h2>Recent conversations</h2></div><Link href="/dashboard/conversations">View all</Link></div>{conversations.length ? <div className="ruh-conversation-rows">{conversations.slice(0, 3).map((conversation) => <Link href={`/dashboard/conversations?id=${conversation.id}`} className="ruh-conversation-row-link" key={conversation.id}><span className="ruh-visitor-avatar">{conversation.visitor.charAt(0)}</span><span><strong>{conversation.visitor}</strong><small>{conversation.intent} · {conversation.page}</small></span><span className={`ruh-outcome-pill is-${conversation.outcome.toLowerCase()}`}>{conversation.outcome}</span><span>{conversation.startedAt}</span><Icon name="arrow" width="14" height="14" /></Link>)}</div> : <div className="ruh-inline-empty"><h3>No conversations yet</h3><p>Test the agent or install it on your website to begin.</p></div>}</section>
  </div>;
}

function ConfigureTab({ agent, onUpdated }: { agent: FrontendAgent; onUpdated: (updates: Partial<FrontendAgent>) => void }) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState(agent.role);
  const [avatarId, setAvatarId] = useState(agent.avatarId);
  const [tone, setTone] = useState(agent.tone ?? "Warm and professional");
  const [responseLength, setResponseLength] = useState(agent.responseLength ?? "Balanced");
  const [language, setLanguage] = useState(agent.language ?? "English");
  const [greeting, setGreeting] = useState(agent.greeting ?? `Hi! I'm ${agent.name}. How can I help you today?`);
  const [instructions, setInstructions] = useState(agent.instructions ?? "Be honest that you do not know, offer a helpful next step, and ask whether the visitor wants a human.");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [customPreview, setCustomPreview] = useState<string | null>(agent.avatarImageUrl ?? null);
  const fileRef = useRef<File | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  function handlePhoto(file?: File) {
    if (!file) return;
    if (customPreview?.startsWith("blob:")) URL.revokeObjectURL(customPreview);
    fileRef.current = file;
    setCustomPreview(URL.createObjectURL(file));
    setSaveState("idle");
  }

  async function publishChanges() {
    setSaveState("saving");
    try {
      let avatarImageUrl: string | null = agent.avatarImageUrl ?? null;
      let anamAvatarId: string | null = null;

      if (fileRef.current) {
        const form = new FormData();
        form.append("file", fileRef.current);
        form.append("displayName", name || "Custom Avatar");
        const uploadRes = await fetch("/api/agents/upload-avatar", { method: "POST", body: form });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          avatarImageUrl = data.url ?? avatarImageUrl;
          anamAvatarId = data.anamAvatarId ?? null;
        }
      }

      const updates: Record<string, unknown> = { name, role, greeting, tone, responseLength, language, instructions, avatarId, avatarImageUrl };
      if (anamAvatarId) updates.anamAvatarId = anamAvatarId;

      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Save failed");

      onUpdated({ name, role, avatarId, avatarImageUrl: avatarImageUrl ?? undefined });
      setSaveState("saved");
      fileRef.current = null;
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
    }
  }

  const changed = saveState !== "saved";

  return <div className="ruh-agent-tab-content ruh-configure-layout">
    <section className="ruh-settings-panel">
      <div className="ruh-panel-heading"><div><p className="ruh-kicker">Identity</p><h2>Agent details</h2><p>These details are visible to visitors.</p></div></div>
      <div className="ruh-builder-form-grid">
        <label className="ruh-form-field"><span>Agent name</span><input value={name} onChange={(e) => { setName(e.target.value); setSaveState("idle"); }} /></label>
        <label className="ruh-form-field"><span>Role</span><input value={role} onChange={(e) => { setRole(e.target.value); setSaveState("idle"); }} /></label>
        <label className="ruh-form-field ruh-full-field"><span>Welcome message</span><textarea rows={3} value={greeting} onChange={(e) => { setGreeting(e.target.value); setSaveState("idle"); }} /></label>
      </div>
    </section>

    <section className="ruh-settings-panel">
      <div className="ruh-panel-heading"><div><p className="ruh-kicker">Avatar</p><h2>Look and image</h2><p>Pick a stock avatar or upload a new custom photo.</p></div></div>
      <div className="ruh-config-avatar-grid">
        {avatars.map((avatar) => (
          <button
            className={avatar.id === avatarId && !fileRef.current ? "is-selected" : ""}
            type="button"
            onClick={() => { setAvatarId(avatar.id); fileRef.current = null; setCustomPreview(null); setSaveState("idle"); }}
            key={avatar.id}
          >
            <AvatarPortrait avatarId={avatar.id} />
            <span>{avatar.name}</span>
            {avatar.id === avatarId && !fileRef.current ? <Icon name="check" width="13" height="13" /> : null}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "12px" }}>
        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => handlePhoto(e.target.files?.[0])} hidden />
        {customPreview ? (
          <div className="ruh-uploaded-photo">
            <Image src={customPreview} alt="Custom avatar preview" width={80} height={100} unoptimized style={{ borderRadius: 8, objectFit: "cover" }} />
            <div>
              <strong>{fileRef.current?.name ?? "Current custom photo"}</strong>
              <small>This photo will replace the avatar image.</small>
              <button type="button" onClick={() => uploadRef.current?.click()}>Replace photo</button>
            </div>
          </div>
        ) : (
          <button className="ruh-secondary-button" type="button" onClick={() => uploadRef.current?.click()}>Upload custom photo</button>
        )}
      </div>
    </section>

    <section className="ruh-settings-panel">
      <div className="ruh-panel-heading"><div><p className="ruh-kicker">Conversation style</p><h2>Response behavior</h2></div></div>
      <div className="ruh-control-pair">
        <label className="ruh-form-field"><span>Tone</span><select value={tone} onChange={(e) => { setTone(e.target.value); setSaveState("idle"); }}><option>Warm and professional</option><option>Confident and concise</option><option>Calm and reassuring</option><option>Friendly and energetic</option></select></label>
        <label className="ruh-form-field"><span>Response length</span><select value={responseLength} onChange={(e) => { setResponseLength(e.target.value); setSaveState("idle"); }}><option>Concise</option><option>Balanced</option><option>Detailed</option></select></label>
        <label className="ruh-form-field"><span>Main language</span><select value={language} onChange={(e) => { setLanguage(e.target.value); setSaveState("idle"); }}><option>English</option><option>Spanish</option><option>Arabic</option><option>Urdu</option><option>French</option><option>German</option></select></label>
      </div>
      <label className="ruh-form-field"><span>When the agent is unsure</span><textarea rows={3} value={instructions} onChange={(e) => { setInstructions(e.target.value); setSaveState("idle"); }} /></label>
    </section>

    <div className="ruh-sticky-save-bar">
      <span>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes published" : saveState === "error" ? "Save failed — try again" : "You have unpublished changes"}</span>
      <button className="ruh-primary-button" type="button" disabled={saveState === "saving" || !changed} onClick={publishChanges}>
        {saveState === "saving" ? "Publishing…" : "Publish changes"}
      </button>
    </div>
  </div>;
}

function KnowledgeTab({ agentId }: { agentId: string }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${agentId}/knowledge`).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setSources(data);
    }).finally(() => setLoading(false));
  }, [agentId]);

  function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} hours ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  }

  async function syncAll() {
    setSyncing(true);
    setSources((items) => items.map((s) => ({ ...s, status: "Syncing", updated_at: new Date().toISOString() })));
    // Touch each source's updated_at via PATCH
    await Promise.all(sources.map((s) =>
      fetch(`/api/agents/${agentId}/knowledge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: s.id, status: "Ready" }),
      })
    ));
    setSources((items) => items.map((s) => ({ ...s, status: "Ready", updated_at: new Date().toISOString() })));
    setSyncing(false);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/agents/${agentId}/knowledge`, { method: "POST", body: form });
      if (res.ok) {
        const newSource = await res.json();
        setSources((items) => [...items, newSource]);
      }
    } finally { setUploading(false); }
  }

  async function toggleEnabled(source: KnowledgeSource) {
    const next = !source.enabled;
    setSources((items) => items.map((s) => s.id === source.id ? { ...s, enabled: next } : s));
    await fetch(`/api/agents/${agentId}/knowledge`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: source.id, enabled: next }),
    });
  }

  async function deleteSource(source: KnowledgeSource) {
    setSources((items) => items.filter((s) => s.id !== source.id));
    await fetch(`/api/agents/${agentId}/knowledge`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: source.id }),
    });
  }

  if (loading) return <div className="ruh-agent-tab-content"><p style={{ padding: 24, color: "var(--muted)" }}>Loading knowledge sources…</p></div>;

  return <div className="ruh-agent-tab-content"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Knowledge</p><h2>What this agent can use</h2><p>Keep website pages, documents, and product information current.</p></div><div><button className="ruh-secondary-button" type="button" disabled={syncing || !sources.length} onClick={syncAll}>{syncing ? "Syncing…" : "Sync all"}</button><label className={`ruh-primary-button${uploading ? " is-disabled" : ""}`}>{uploading ? "Uploading…" : "Add knowledge"}<input type="file" accept=".pdf,.csv,.txt,.docx,.json,.md" hidden disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadFile(file); event.target.value = ""; }} /></label></div></div>{sources.length ? <div className="ruh-knowledge-table"><div className="ruh-table-head"><span>Source</span><span>Content</span><span>Status</span><span>Updated</span><span /></div>{sources.map((source) => <div className="ruh-table-row" key={source.id}><span><i>{source.source === "Uploaded file" ? "DOC" : "WWW"}</i><span><strong>{source.name}</strong><small>{source.source}</small></span></span><span>{source.item_count}</span><span className="ruh-ready-label"><i /> {source.status}</span><span>{timeAgo(source.updated_at)}</span><span><label className="ruh-switch"><input type="checkbox" checked={source.enabled} onChange={() => toggleEnabled(source)} /><i /></label><button type="button" aria-label={`Delete ${source.name}`} onClick={() => deleteSource(source)}>✕</button></span></div>)}</div> : <div className="ruh-inline-empty"><h3>No knowledge sources yet</h3><p>Upload documents, CSVs, or connect your website to give this agent context about your business.</p></div>}</div>;
}

function ActionsTab({ agentId }: { agentId: string }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ lead: true, product: true, cart: true, handoff: true });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${agentId}/actions`).then((r) => r.json()).then((map) => {
      if (map && typeof map === "object" && !map.error) {
        setEnabled((prev) => ({ ...prev, ...map }));
      }
    }).finally(() => setLoaded(true));
  }, [agentId]);

  async function toggle(actionId: string) {
    const next = !enabled[actionId];
    setEnabled((current) => ({ ...current, [actionId]: next }));
    await fetch(`/api/agents/${agentId}/actions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [actionId]: next }),
    });
  }

  return <div className="ruh-agent-tab-content"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Capabilities</p><h2>Actions your agent can take</h2><p>Give visitors a useful next step instead of ending at an answer.</p></div><Link className="ruh-secondary-button" href="/dashboard/integrations">Manage integrations</Link></div><div className="ruh-workspace-action-grid">{agentActions.map((action) => <article className={enabled[action.id] ? "is-enabled" : ""} key={action.id}><div className="ruh-action-card-head"><span><Icon name={enabled[action.id] ? "check" : "plus"} width="16" height="16" /></span>{action.state === "Needs setup" ? <em>Needs integration</em> : <label className="ruh-switch"><input type="checkbox" checked={Boolean(enabled[action.id])} disabled={!loaded} onChange={() => toggle(action.id)} /><i /></label>}</div><h3>{action.title}</h3><p>{action.description}</p>{action.state === "Needs setup" ? <Link href="/dashboard/integrations">Connect to enable <Icon name="arrow" width="13" height="13" /></Link> : <button type="button">Configure</button>}</article>)}</div></div>;
}

function WidgetTab({ agent }: { agent: FrontendAgent }) {
  const [position, setPosition] = useState<"left" | "right">("right");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoGreet, setAutoGreet] = useState(true);
  const [showAllPages, setShowAllPages] = useState(true);
  const [copied, setCopied] = useState(false);
  const [installNotice, setInstallNotice] = useState<string | null>(null);
  const [checkingInstall, setCheckingInstall] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const code = `<script src="${origin}/api/embed/${agent.id}" async></script>`;
  async function copy() { try { await navigator.clipboard.writeText(code); } catch { /* Optional in local preview. */ } setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
  return <div className="ruh-agent-tab-content ruh-widget-workspace"><div className="ruh-widget-settings"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Widget</p><h2>Website experience</h2><p>Control where and how your agent appears.</p></div><span className="ruh-health-label"><i /> Installed</span></div><div className="ruh-settings-panel"><div className="ruh-control-pair"><label className="ruh-form-field"><span>Position</span><select value={position} onChange={(event) => setPosition(event.target.value as "left" | "right")}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></label><label className="ruh-form-field"><span>Appearance</span><select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></label></div><label className="ruh-setting-row"><span><strong>Open with a greeting</strong><small>Show a quiet invitation after eight seconds.</small></span><span className="ruh-switch"><input type="checkbox" checked={autoGreet} onChange={() => setAutoGreet((v) => !v)} /><i /></span></label><label className="ruh-setting-row"><span><strong>Show on all pages</strong><small>Use page rules to limit where the agent appears.</small></span><span className="ruh-switch"><input type="checkbox" checked={showAllPages} onChange={() => setShowAllPages((v) => !v)} /><i /></span></label></div><div className="ruh-settings-panel"><div className="ruh-subsection-heading"><div><h3>Installation code</h3><p>Add this once before the closing body tag.</p></div></div><div className="ruh-code-snippet"><code>{code}</code><button type="button" onClick={copy}>{copied ? "Copied" : "Copy code"}</button></div><div className="ruh-install-actions"><button className="ruh-secondary-button" type="button" onClick={() => setInstallNotice("Email instructions feature coming soon")}>{installNotice?.includes("Email") ? installNotice : "Email instructions"}</button><button className="ruh-secondary-button" type="button" disabled={checkingInstall} onClick={async () => { setCheckingInstall(true); try { const res = await fetch(`/api/agents/${agent.id}/check-install`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ websiteUrl: agent.website }) }); if (res.ok) { const data = await res.json(); setInstallNotice(data.installed ? "✓ Widget detected on your website" : `✗ ${data.reason}`); } } catch { setInstallNotice("Could not reach the website"); } setCheckingInstall(false); }}>{checkingInstall ? "Checking…" : installNotice?.startsWith("✓") ? "Installation healthy" : installNotice?.startsWith("✗") ? "Not detected — retry" : "Check installation"}</button></div>{installNotice && <p style={{ fontSize: 12, marginTop: 8, color: installNotice.startsWith("✓") ? "var(--success)" : "var(--warning)" }}>{installNotice}</p>}</div></div><div className={`ruh-site-preview is-${theme}`}><div className="ruh-browser-bar"><i /><i /><i /><span>{agent.website}</span></div><div className="ruh-preview-site-content"><span /><strong /><span /><div /><div /></div><div className={`ruh-widget-preview is-${position}`}>{autoGreet && <div className="ruh-widget-message"><AgentAvatar agent={agent} /><span><strong>{agent.name}</strong><small>Hi! Would you like help finding the right option?</small></span><button type="button" aria-label="Close preview" onClick={() => setAutoGreet(false)}>×</button></div>}<button className="ruh-widget-launcher" type="button"><AgentAvatar agent={agent} /><span>Talk to {agent.name}</span></button></div></div></div>;
}

function ConversationsTab({ conversations, onTestAgent }: { conversations: Conversation[]; onTestAgent: () => void }) {
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const filtered = outcomeFilter === "All" ? conversations : conversations.filter((c) => c.outcome === outcomeFilter);
  return <div className="ruh-agent-tab-content"><div className="ruh-panel-toolbar"><div><p className="ruh-kicker">Conversations</p><h2>Visitor history</h2><p>Review what visitors needed, what the agent did, and the result.</p></div><div><select aria-label="Filter outcome" value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)}><option value="All">All outcomes</option><option value="Purchase">Purchase</option><option value="Lead">Lead</option><option value="Resolved">Resolved</option><option value="Booked">Booked</option><option value="Open">Open</option></select><Link className="ruh-secondary-button" href="/dashboard/conversations">Open conversation center</Link></div></div>{filtered.length ? <div className="ruh-knowledge-table ruh-conversations-table"><div className="ruh-table-head"><span>Visitor</span><span>Intent</span><span>Outcome</span><span>Duration</span><span>Date</span></div>{filtered.map((conversation) => <Link className="ruh-table-row" href={`/dashboard/conversations?id=${conversation.id}`} key={conversation.id}><span><i>{conversation.visitor.charAt(0)}</i><span><strong>{conversation.visitor}</strong><small>{conversation.page}</small></span></span><span>{conversation.intent}</span><span><i className={`ruh-outcome-pill is-${conversation.outcome.toLowerCase()}`}>{conversation.outcome}</i></span><span>{conversation.duration}</span><span>{conversation.startedAt}</span></Link>)}</div> : <div className="ruh-inline-empty"><h3>{conversations.length ? "No conversations match this filter" : "No conversations yet"}</h3><p>{conversations.length ? "Try a different outcome filter." : "Once visitors talk with this agent, transcripts, page activity, and outcomes will appear here."}</p>{!conversations.length && <button className="ruh-primary-button" type="button" onClick={onTestAgent}>Test agent</button>}</div>}</div>;
}

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function AgentWorkspace({ agent: initialAgent, conversations: initialConversations }: { agent: FrontendAgent; conversations: Conversation[] }) {
  const router = useRouter();
  const [agent, setAgent] = useState(initialAgent);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("Overview");
  const [status, setStatus] = useState<FrontendAgent["status"]>(initialAgent?.status ?? "Draft");
  const [testOpen, setTestOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const anamRef = useRef<AnamClient | null>(null);
  const testSessionIdRef = useRef<string | null>(null);
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleUpdated(updates: Partial<FrontendAgent>) {
    setAgent((prev) => ({ ...prev, ...updates }));
  }

  async function deleteAgent() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/agents");
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  const stopTest = useCallback(() => {
    if (killTimerRef.current) clearTimeout(killTimerRef.current);
    const sid = testSessionIdRef.current;
    anamRef.current?.stopStreaming();
    anamRef.current = null;
    testSessionIdRef.current = null;
    setTestStatus("idle");
    setTestOpen(false);
    if (sid) {
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      }).catch(() => {});
    }
  }, []);

  const openTest = useCallback(async () => {
    setTestStatus("connecting");
    setTestError(null);
    setTestOpen(true);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, pageUrl: "[Dashboard preview]" }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? `Session error ${res.status}`);
      }
      const { sessionToken, sessionId } = await res.json();
      testSessionIdRef.current = sessionId;

      const anam = createClient(sessionToken);
      anamRef.current = anam;

      anam.addListener(AnamEvent.SESSION_READY, () => {
        setTestStatus("connected");
        const greetingText = agent.greeting || `Hi! I'm ${agent.name}. How can I help you today?`;
        anam.talk(greetingText);
      });

      anam.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        setTestStatus("idle");
        anamRef.current = null;
      });

      let lastProcessedIdx = -1;
      anam.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (msgs) => {
        const idx = msgs.length - 1;
        if (idx <= lastProcessedIdx) return;
        const last = msgs[idx];
        if (!last || last.role !== "user") return;
        const text = (last.content ?? "").trim();
        if (!text) return;
        lastProcessedIdx = idx;
        const sid = testSessionIdRef.current;
        if (!sid) return;
        try {
          const brainRes = await fetch("/api/brain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, userText: text }),
          });
          if (brainRes.ok) {
            const { replyText } = await brainRes.json();
            if (replyText?.trim()) anam.talk(replyText);
          }
        } catch { /* non-fatal */ }
      });

      await anam.streamToVideoElement("test-avatar-video");

      // 10-minute kill switch (plan requirement)
      killTimerRef.current = setTimeout(stopTest, 10 * 60 * 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not connect";
      setTestError(msg);
      setTestStatus("error");
    }
  }, [agent.id, agent.name, stopTest]);

  useEffect(() => {
    if (!isUUID(agent.id)) return;

    async function loadConversations() {
      const { data: sessions } = await supabaseBrowser
        .from("sessions")
        .select("id, started_at, ended_at, page_url")
        .eq("agent_id", agent.id)
        .order("started_at", { ascending: false })
        .limit(20);

      if (!sessions?.length) return;

      const sessionIds = sessions.map((s) => s.id);
      const [turnsRes, analysesRes, leadsRes] = await Promise.all([
        supabaseBrowser.from("turns").select("session_id, role, content, created_at").in("session_id", sessionIds).order("created_at", { ascending: true }),
        supabaseBrowser.from("analyses").select("session_id, outcome, lead_score, summary").in("session_id", sessionIds),
        supabaseBrowser.from("leads").select("session_id, name, email").in("session_id", sessionIds),
      ]);

      const turnsBySession = new Map<string, typeof turnsRes.data>();
      for (const t of turnsRes.data ?? []) {
        const arr = turnsBySession.get(t.session_id) ?? [];
        arr.push(t);
        turnsBySession.set(t.session_id, arr);
      }
      const analysisMap = new Map((analysesRes.data ?? []).map((a) => [a.session_id, a]));
      const leadMap = new Map((leadsRes.data ?? []).map((l) => [l.session_id, l]));

      const real: Conversation[] = sessions.map((s) => {
        const turns = turnsBySession.get(s.id) ?? [];
        const analysis = analysisMap.get(s.id);
        const lead = leadMap.get(s.id);
        const outcomeMap: Record<string, string> = { lead_captured: "Lead", demo_booked: "Booked", no_conversion: "Open", abandoned: "Open" };
        const ms = s.ended_at ? new Date(s.ended_at).getTime() - new Date(s.started_at).getTime() : 0;
        const totalSec = Math.round(ms / 1000);
        let visitor = lead?.name || "Anonymous visitor";
        if (!lead?.name && lead?.email) {
          const local = lead.email.split("@")[0] ?? lead.email;
          visitor = local.charAt(0).toUpperCase() + local.slice(1);
        }

        return {
          id: s.id,
          visitor,
          agent: agent.name,
          avatarId: agent.avatarId,
          startedAt: new Date(s.started_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
          duration: s.ended_at ? `${Math.floor(totalSec / 60)}m ${String(totalSec % 60).padStart(2, "0")}s` : "In progress",
          intent: analysis?.summary?.split(".")[0] ?? (turns.length ? "Sales inquiry" : "No conversation yet"),
          page: s.page_url ?? "/",
          outcome: (outcomeMap[analysis?.outcome ?? ""] ?? (lead ? "Lead" : "Open")) as Conversation["outcome"],
          value: analysis?.lead_score ? `Score: ${analysis.lead_score}` : lead ? "Lead captured" : undefined,
          summary: analysis?.summary ?? (turns.length ? "Conversation recorded. Analysis pending." : "No messages in this session."),
          messages: turns.map((t) => ({
            speaker: (t.role === "user" ? "Visitor" : "Agent") as "Visitor" | "Agent",
            time: new Date(t.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            text: t.content,
          })),
          events: [],
        };
      });

      setConversations(real);
    }

    loadConversations();
  }, [agent.id, agent.name, agent.avatarId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { stopTest(); setDeleteConfirm(false); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [stopTest]);

  // Cleanup Anam on unmount
  useEffect(() => {
    return () => {
      if (killTimerRef.current) clearTimeout(killTimerRef.current);
      anamRef.current?.stopStreaming();
    };
  }, []);

  return <div className="ruh-page-stack ruh-agent-workspace">
    <Link className="ruh-back-link" href="/dashboard/agents">← All agents</Link>
    <header className="ruh-agent-workspace-header">
      <div className="ruh-agent-identity">
        <AgentAvatar agent={agent} />
        <div><span><StatusBadge status={status} /> {agent.website}</span><h1>{agent.name}</h1><p>{agent.role}</p></div>
      </div>
      <div className="ruh-agent-header-actions">
        <button className="ruh-secondary-button" type="button" onClick={async () => { const next = status === "Paused" ? "Live" : "Paused"; setStatus(next); fetch(`/api/agents/${agent.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }).catch(() => {}); }}>{status === "Paused" ? "Resume agent" : "Pause agent"}</button>
        <button className="ruh-primary-button" type="button" onClick={openTest}>Test agent</button>
        <div style={{ position: "relative" }}>
          <button className="ruh-more-button" type="button" aria-label="More agent options" onClick={() => setDeleteConfirm((v) => !v)}>
            <span aria-hidden="true">•••</span>
          </button>
          {deleteConfirm ? (
            <div className="ruh-agent-card-menu" role="menu" style={{ right: 0, left: "auto", minWidth: 180 }}>
              <button
                type="button"
                role="menuitem"
                disabled={deleting}
                onClick={deleteAgent}
                style={{ color: "#c00" }}
              >
                {deleting ? "Deleting…" : "Delete agent"}
              </button>
              <button type="button" role="menuitem" onClick={() => setDeleteConfirm(false)}>Cancel</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
    <nav className="ruh-agent-tabs" aria-label="Agent settings">{tabs.map((tab) => <button className={activeTab === tab ? "is-active" : ""} type="button" aria-current={activeTab === tab ? "page" : undefined} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</nav>
    {activeTab === "Overview" ? <OverviewTab agent={agent} conversations={conversations} /> : null}
    {activeTab === "Configure" ? <ConfigureTab agent={agent} onUpdated={handleUpdated} /> : null}
    {activeTab === "Knowledge" ? <KnowledgeTab agentId={agent.id} /> : null}
    {activeTab === "Actions" ? <ActionsTab agentId={agent.id} /> : null}
    {activeTab === "Widget" ? <WidgetTab agent={agent} /> : null}
    {activeTab === "Conversations" ? <ConversationsTab conversations={conversations} onTestAgent={openTest} /> : null}
    {testOpen ? (
      <div className="ruh-dialog-backdrop" role="presentation" onMouseDown={stopTest}>
        <section className="ruh-test-agent-dialog" role="dialog" aria-modal="true" aria-labelledby="test-agent-title" onMouseDown={(e) => e.stopPropagation()}>
          {/* Live avatar video — fills the left panel */}
          <div className="ruh-test-agent-stage">
            <video id="test-avatar-video" className="ruh-test-avatar-video" autoPlay playsInline />
            {testStatus === "connecting" && (
              <div className="ruh-test-avatar-overlay">
                <span className="ruh-progress-spinner" />
                <p>Connecting to {agent.name}…</p>
              </div>
            )}
            {testStatus === "error" && (
              <div className="ruh-test-avatar-overlay ruh-test-avatar-overlay--error">
                <p>{testError}</p>
                <button type="button" onClick={openTest}>Retry</button>
              </div>
            )}
            {testStatus === "connected" && (
              <span className="ruh-live-indicator"><i /> Live</span>
            )}
          </div>
          {/* Info panel */}
          <div className="ruh-test-agent-copy">
            <button className="ruh-icon-button" type="button" aria-label="End call" onClick={stopTest}><Icon name="close" width="18" height="18" /></button>
            <p className="ruh-kicker">Private preview</p>
            <h2 id="test-agent-title">Talk with {agent.name}</h2>
            <p>Speak naturally — {agent.name} can hear you. This is a live voice call using the real avatar and brain.</p>
            <div className="ruh-test-mic-hint">
              {testStatus === "connecting" && <span className="ruh-test-status-row"><span className="ruh-progress-spinner" style={{ width: 14, height: 14 }} /> Connecting…</span>}
              {testStatus === "connected" && <span className="ruh-test-status-row ruh-test-status-row--live"><i /> Mic open — just speak</span>}
              {testStatus === "error" && <span className="ruh-test-status-row ruh-test-status-row--error">⚠ {testError}</span>}
            </div>
            <button className="ruh-end-call-button" type="button" onClick={stopTest}>End call</button>
          </div>
        </section>
      </div>
    ) : null}
  </div>;
}
