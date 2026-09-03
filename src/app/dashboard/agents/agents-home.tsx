"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../dashboard-icons";
import { AvatarPortrait, StatusBadge } from "../dashboard-ui";
import { agents, avatars, type AvatarCategory, type AvatarProfile } from "../mock-data";
import { readStoredAgents, removeStoredAgent, upsertStoredAgent, type FrontendAgent } from "./agent-storage";

const filters: Array<"All" | AvatarCategory> = [
  "All", "Sales", "Support", "General",
];

function AgentVisual({ agent }: { agent: FrontendAgent }) {
  const src = agent.avatarImageUrl ?? agent.customAvatarDataUrl ?? null;
  return src
    ? <Image className="ruh-avatar-portrait ruh-custom-avatar-image" src={src} alt={`${agent.name} avatar`} width={320} height={400} unoptimized />
    : <AvatarPortrait avatarId={agent.avatarId} />;
}

function AgentCard({ agent, onDeleted }: { agent: FrontendAgent; onDeleted: (id: string) => void }) {
  const [status, setStatus] = useState(agent.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "deleting">("idle");
  const isDraft = status === "Draft";
  const isPaused = status === "Paused";
  const isRealAgent = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agent.id);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); setDeleteState("idle"); }
    };
    window.addEventListener("keydown", closeMenu);
    return () => window.removeEventListener("keydown", closeMenu);
  }, [menuOpen]);

  async function copyInstallCode() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const code = `<script src="${origin}/api/embed/${agent.id}" async></script>`;
    try { await navigator.clipboard.writeText(code); } catch { /* Local preview may block clipboard access. */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleDelete() {
    if (deleteState === "idle") { setDeleteState("confirm"); return; }
    if (deleteState !== "confirm") return;
    setDeleteState("deleting");
    try {
      if (isRealAgent) {
        const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
      }
      // Always remove from localStorage so it doesn't reappear on refresh
      removeStoredAgent(agent.id);
      onDeleted(agent.id);
    } catch {
      setDeleteState("idle");
    }
  }

  return (
    <article className="ruh-agent-card">
      <Link className="ruh-agent-card-visual" href={isDraft ? `/dashboard/agents/new?resume=${agent.id}` : `/dashboard/agents/${agent.id}`}>
        <AgentVisual agent={agent} />
        <StatusBadge status={status} />
      </Link>
      <div className="ruh-agent-card-body">
        <div className="ruh-agent-card-title-row">
          <div><h3>{agent.name}</h3><p>{agent.role}</p></div>
          <button type="button" className="ruh-more-button" aria-label={`More options for ${agent.name}`} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            <span aria-hidden="true">•••</span>
          </button>
          {menuOpen ? <div className="ruh-agent-card-menu" role="menu">
            <Link href={isDraft ? `/dashboard/agents/new?resume=${agent.id}` : `/dashboard/agents/${agent.id}`} role="menuitem" onClick={() => setMenuOpen(false)}>{isDraft ? "Continue setup" : "Open agent"}</Link>
            <Link href="/dashboard/conversations" role="menuitem" onClick={() => setMenuOpen(false)}>View conversations</Link>
            <button type="button" role="menuitem" onClick={copyInstallCode}>{copied ? "Install code copied" : "Copy install code"}</button>
            {!isDraft ? <button type="button" role="menuitem" onClick={async () => { const next = isPaused ? "Live" : "Paused"; setStatus(next); setMenuOpen(false); fetch(`/api/agents/${agent.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }).catch(() => {}); }}>{isPaused ? "Resume agent" : "Pause agent"}</button> : null}
            <button type="button" role="menuitem" style={{ color: deleteState === "confirm" ? "#c00" : undefined }} disabled={deleteState === "deleting"} onClick={handleDelete}>
              {deleteState === "deleting" ? "Deleting…" : deleteState === "confirm" ? "Confirm — this is permanent" : "Delete agent"}
            </button>
            {deleteState === "confirm" ? <button type="button" role="menuitem" onClick={() => setDeleteState("idle")}>Cancel</button> : null}
          </div> : null}
        </div>
        <p className="ruh-agent-domain">{agent.website}</p>
        {isDraft ? (
          <div className="ruh-agent-progress">
            <div><span>Setup progress</span><strong>{agent.setupProgress ?? 75}%</strong></div>
            <span className="ruh-agent-progress-track"><i style={{ width: `${agent.setupProgress ?? 75}%` }} /></span>
          </div>
        ) : (
          <div className="ruh-agent-card-stats">
            <span><strong>{agent.conversations}</strong> conversations</span>
            <span><strong>{agent.outcomes}</strong> results</span>
          </div>
        )}
        <div className="ruh-agent-card-footer">
          <span>{agent.lastActive}</span>
          <Link className={isDraft || isPaused ? "ruh-primary-button" : "ruh-secondary-button"} href={isDraft ? `/dashboard/agents/new?resume=${agent.id}` : `/dashboard/agents/${agent.id}`}>
            {isDraft ? "Continue setup" : isPaused ? "Resume agent" : "Open agent"}
            <Icon name="arrow" width="14" height="14" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function AvatarCard({ avatar, onPreview }: { avatar: AvatarProfile; onPreview: (avatar: AvatarProfile) => void }) {
  return (
    <article className="ruh-avatar-library-card">
      <button className="ruh-avatar-card-preview" type="button" onClick={() => onPreview(avatar)} aria-label={`Preview ${avatar.name}`}>
        <AvatarPortrait avatarId={avatar.id} />
        <span className="ruh-avatar-category">{avatar.category}</span>
        <span className="ruh-avatar-preview-label">Preview</span>
      </button>
      <div className="ruh-avatar-card-copy">
        <div><h3>{avatar.name}</h3><p>{avatar.title}</p></div>
        <span>{avatar.tone}</span>
      </div>
      <div className="ruh-avatar-card-actions">
        <span>{avatar.languages.join(" · ")}</span>
        <Link href={`/dashboard/agents/new?avatar=${avatar.id}`}>
          Use avatar <Icon name="arrow" width="13" height="13" />
        </Link>
      </div>
    </article>
  );
}

export function AgentsHome() {
  const [visibleAgents, setVisibleAgents] = useState<FrontendAgent[]>(agents);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<AvatarProfile | null>(null);
  const activeDialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await fetch("/api/agents");
        if (res.ok) {
          const dbAgents = await res.json();
          const realAgents: FrontendAgent[] = Array.isArray(dbAgents) ? dbAgents.map((a: Record<string, unknown>) => ({
            id: a.id as string,
            name: a.name as string,
            role: a.role as string,
            website: (a.website as string) || "No website set",
            status: (a.status as "Live" | "Draft" | "Paused") ?? "Draft",
            avatarId: (a.avatar_id as string) ?? "sarah",
            avatarImageUrl: (a.avatar_image_url as string) ?? undefined,
            conversations: (a.conversations as number) ?? 0,
            outcomes: (a.outcomes as number) ?? 0,
            conversionRate: (a.conversionRate as string) ?? "—",
            lastActive: (a.lastActive as string) ?? "No activity yet",
          })) : [];

          const stored = readStoredAgents();
          const dbIds = new Set(realAgents.map((a) => a.id));
          const unsavedDrafts = stored.filter((a) => !dbIds.has(a.id));
          setVisibleAgents([...unsavedDrafts, ...realAgents]);
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }

      // Fallback: localStorage drafts only
      const stored = readStoredAgents();
      setVisibleAgents(stored);
      setLoading(false);
    }

    loadAgents();
  }, []);

  useEffect(() => {
    const dialogOpen = chooserOpen || Boolean(previewAvatar);
    if (!dialogOpen) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => activeDialogRef.current?.querySelector<HTMLElement>("button, a, input")?.focus(), 0);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setChooserOpen(false); setPreviewAvatar(null); }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => { window.clearTimeout(focusTimer); window.removeEventListener("keydown", closeOnEscape); restoreFocusRef.current?.focus(); };
  }, [chooserOpen, previewAvatar]);

  const visibleAvatars = useMemo(() => {
    const query = search.trim().toLowerCase();
    return avatars.filter((avatar) => {
      const matchesFilter = filter === "All" || avatar.category === filter;
      const matchesSearch = !query || [avatar.name, avatar.title, avatar.category, avatar.tone, ...avatar.languages]
        .join(" ").toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <div className="ruh-page-stack ruh-agents-home">
      <div className="ruh-page-heading">
        <div><p className="ruh-kicker">Agents</p><h1>My agents</h1><p>Create, launch, and improve every website agent from one place.</p></div>
        <button className="ruh-primary-button" type="button" onClick={() => setChooserOpen(true)}>
          <Icon name="plus" width="17" height="17" /> Create agent
        </button>
      </div>

      {(loading || visibleAgents.length > 0) && (
        <section className="ruh-agent-section" aria-labelledby="your-agents-title">
          <div className="ruh-section-title-row">
            <div>
              <h2 id="your-agents-title">Your agents</h2>
              <p>{loading ? "Loading your agents…" : `${visibleAgents.length} agent${visibleAgents.length === 1 ? "" : "s"} across your websites`}</p>
            </div>
            <Link href="/dashboard/conversations">View conversations</Link>
          </div>
          {loading ? (
            <div className="ruh-owned-agent-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="ruh-agent-card ruh-skeleton-card" aria-hidden="true">
                  <div className="ruh-skeleton ruh-skeleton-visual" />
                  <div className="ruh-agent-card-body">
                    <div className="ruh-skeleton ruh-skeleton-title" />
                    <div className="ruh-skeleton ruh-skeleton-subtitle" />
                    <div className="ruh-skeleton ruh-skeleton-line" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ruh-owned-agent-grid">
              {visibleAgents.map((agent) => (
                <AgentCard agent={agent} key={agent.id} onDeleted={(id) => setVisibleAgents((prev) => prev.filter((a) => a.id !== id))} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="ruh-avatar-library" aria-labelledby="avatar-library-title">
        <div className="ruh-section-title-row ruh-library-heading">
          <div><p className="ruh-kicker">Start a new agent</p><h2 id="avatar-library-title">Choose a face for your agent</h2><p>Start with a ready-to-use avatar or create one from your own photo.</p></div>
          <label className="ruh-library-search"><span className="ruh-visually-hidden">Search avatars</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search avatars" /></label>
        </div>
        <div className="ruh-filter-row" aria-label="Filter avatars">
          {filters.map((item) => <button className={filter === item ? "is-active" : ""} type="button" onClick={() => setFilter(item)} key={item}>{item}</button>)}
        </div>
        <div className="ruh-avatar-library-grid">
          <Link className="ruh-custom-avatar-card" href="/dashboard/agents/new?source=custom">
            <span className="ruh-custom-avatar-art" aria-hidden="true"><Icon name="plus" width="24" height="24" /></span>
            <div><span className="ruh-avatar-category">Your image</span><h3>Create from your photo</h3><p>Turn a clear portrait into a custom Ruhana avatar.</p><strong>Upload a photo <Icon name="arrow" width="13" height="13" /></strong></div>
          </Link>
          {visibleAvatars.map((avatar) => <AvatarCard avatar={avatar} onPreview={setPreviewAvatar} key={avatar.id} />)}
        </div>
        {visibleAvatars.length === 0 ? <div className="ruh-compact-empty"><h3>No matching avatars</h3><p>Try another name, role, or category.</p><button type="button" className="ruh-secondary-button" onClick={() => { setFilter("All"); setSearch(""); }}>Clear filters</button></div> : null}
      </section>

      {chooserOpen ? (
        <div className="ruh-dialog-backdrop" role="presentation" onMouseDown={() => setChooserOpen(false)}>
          <section ref={activeDialogRef} className="ruh-choice-dialog" role="dialog" aria-modal="true" aria-labelledby="create-agent-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ruh-dialog-heading">
              <div><p className="ruh-kicker">New agent</p><h2 id="create-agent-title">How would you like to start?</h2><p>You can change the avatar at any point before launch.</p></div>
              <button className="ruh-icon-button" type="button" aria-label="Close" onClick={() => setChooserOpen(false)}><Icon name="close" width="18" height="18" /></button>
            </div>
            <div className="ruh-start-choice-grid">
              <Link href="/dashboard/agents/new?source=custom"><span><Icon name="plus" width="22" height="22" /></span><strong>Create from your photo</strong><small>Upload a portrait to create an avatar that looks like you or your representative.</small><em>Upload a photo <Icon name="arrow" width="14" height="14" /></em></Link>
              <button type="button" onClick={() => { setChooserOpen(false); document.getElementById("avatar-library-title")?.scrollIntoView({ behavior: "smooth" }); }}><span><Icon name="agents" width="22" height="22" /></span><strong>Choose an avatar</strong><small>Start immediately with a polished avatar from the Ruhana library.</small><em>Browse avatars <Icon name="arrow" width="14" height="14" /></em></button>
            </div>
          </section>
        </div>
      ) : null}

      {previewAvatar ? (
        <div className="ruh-dialog-backdrop" role="presentation" onMouseDown={() => setPreviewAvatar(null)}>
          <section ref={activeDialogRef} className="ruh-avatar-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-preview-title" onMouseDown={(event) => event.stopPropagation()}>
            <AvatarPortrait avatarId={previewAvatar.id} />
            <div className="ruh-avatar-preview-copy">
              <button className="ruh-icon-button" type="button" aria-label="Close preview" onClick={() => setPreviewAvatar(null)}><Icon name="close" width="18" height="18" /></button>
              <p className="ruh-kicker">{previewAvatar.category}</p><h2 id="avatar-preview-title">{previewAvatar.name}</h2><h3>{previewAvatar.title}</h3><p>{previewAvatar.description}</p>
              <dl><div><dt>Style</dt><dd>{previewAvatar.tone}</dd></div><div><dt>Languages</dt><dd>{previewAvatar.languages.join(", ")}</dd></div></dl>
              <Link className="ruh-primary-button" href={`/dashboard/agents/new?avatar=${previewAvatar.id}`}>Use {previewAvatar.name}<Icon name="arrow" width="14" height="14" /></Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
