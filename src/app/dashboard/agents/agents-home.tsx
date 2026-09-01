"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../dashboard-icons";
import { AvatarPortrait, StatusBadge } from "../dashboard-ui";
import { agents, avatars, type AvatarCategory, type AvatarProfile } from "../mock-data";
import { useDialogFocus } from "../use-dialog-focus";
import { readStoredAgents, upsertStoredAgent, type FrontendAgent } from "./agent-storage";

const filters: Array<"All" | AvatarCategory> = [
  "All", "Sales", "Support", "Commerce", "Onboarding", "Hospitality", "Education",
];

function AgentVisual({ agent }: { agent: FrontendAgent }) {
  return agent.customAvatarDataUrl ? <Image className="ruh-avatar-portrait ruh-custom-avatar-image" src={agent.customAvatarDataUrl} alt={`${agent.name} avatar`} width={320} height={400} unoptimized /> : <AvatarPortrait avatarId={agent.avatarId} />;
}

function AgentCard({ agent }: { agent: FrontendAgent }) {
  const [status, setStatus] = useState(agent.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const isDraft = status === "Draft";
  const isPaused = status === "Paused";

  useEffect(() => {
    if (!menuOpen) return;
    const focusTimer = window.setTimeout(() => menuRef.current?.querySelector<HTMLElement>("a, button")?.focus(), 0);
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        window.setTimeout(() => menuTriggerRef.current?.focus(), 0);
      }
    };
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !menuTriggerRef.current?.contains(target)) setMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenu);
    window.addEventListener("mousedown", closeOutside);
    return () => { window.clearTimeout(focusTimer); window.removeEventListener("keydown", closeMenu); window.removeEventListener("mousedown", closeOutside); };
  }, [menuOpen]);

  function updateStatus(nextStatus: FrontendAgent["status"]) {
    setStatus(nextStatus);
    upsertStoredAgent({ ...agent, status: nextStatus, lastActive: "Updated just now" });
  }

  async function copyInstallCode() {
    const code = `<script src="https://widget.ruhana.ai/v1.js" data-agent="${agent.id}"></script>`;
    try { await navigator.clipboard.writeText(code); } catch { /* Local preview may block clipboard access. */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="ruh-agent-card">
      <Link className="ruh-agent-card-visual" href={`/dashboard/agents/${agent.id}`}>
        <AgentVisual agent={agent} />
        <StatusBadge status={status} />
      </Link>
      <div className="ruh-agent-card-body">
        <div className="ruh-agent-card-title-row">
          <div><h3>{agent.name}</h3><p>{agent.role}</p></div>
          <button ref={menuTriggerRef} type="button" className="ruh-more-button" aria-label={`More options for ${agent.name}`} aria-controls={`agent-actions-${agent.id}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            <span aria-hidden="true">•••</span>
          </button>
          {menuOpen ? <div ref={menuRef} className="ruh-agent-card-menu" id={`agent-actions-${agent.id}`} role="group" aria-label={`${agent.name} actions`}>
            <Link href={`/dashboard/agents/${agent.id}`} onClick={() => setMenuOpen(false)}>Open agent</Link>
            <Link href="/dashboard/conversations" onClick={() => setMenuOpen(false)}>View conversations</Link>
            <button type="button" onClick={copyInstallCode}>{copied ? "Install code copied" : "Copy install code"}</button>
            {!isDraft ? <button type="button" onClick={() => { updateStatus(isPaused ? "Live" : "Paused"); setMenuOpen(false); }}>{isPaused ? "Resume agent" : "Pause agent"}</button> : null}
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
          <Link className={isDraft || isPaused ? "ruh-primary-button" : "ruh-secondary-button"} href={isDraft ? `/dashboard/agents/new?resume=${agent.id}` : `/dashboard/agents/${agent.id}`} onClick={() => { if (isPaused) updateStatus("Live"); }}>
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
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<AvatarProfile | null>(null);
  const closeActiveDialog = useCallback(() => {
    setChooserOpen(false);
    setPreviewAvatar(null);
  }, []);
  const activeDialogRef = useDialogFocus(chooserOpen || Boolean(previewAvatar), closeActiveDialog);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredAgents();
      const storedById = new Map(stored.map((agent) => [agent.id, agent]));
      const mergedStatic = agents.map((agent) => storedById.get(agent.id) ?? agent);
      const newAgents = stored.filter((agent) => !agents.some((item) => item.id === agent.id));
      setVisibleAgents([...newAgents, ...mergedStatic]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

      <section className="ruh-agent-section" aria-labelledby="your-agents-title">
        <div className="ruh-section-title-row">
          <div><h2 id="your-agents-title">Your agents</h2><p>{visibleAgents.length} agents across your websites</p></div>
          <Link href="/dashboard/conversations">View conversations</Link>
        </div>
        <div className="ruh-owned-agent-grid">{visibleAgents.map((agent) => <AgentCard agent={agent} key={agent.id} />)}</div>
      </section>

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
