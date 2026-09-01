"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Icon, type IconName, RuhanaLogo } from "./dashboard-icons";

type NavigationItem = { label: string; href: string; icon: IconName };

const agentNavigation: NavigationItem[] = [
  { label: "My agents", href: "/dashboard/agents", icon: "agents" },
  { label: "Conversations", href: "/dashboard/conversations", icon: "conversations" },
  { label: "Websites", href: "/dashboard/websites", icon: "globe" },
  { label: "Integrations", href: "/dashboard/integrations", icon: "integrations" },
  { label: "Billing", href: "/dashboard/billing", icon: "billing" },
];

const analyticsNavigation: NavigationItem[] = [
  { label: "Overview", href: "/dashboard/analytics", icon: "overview" },
  { label: "Results", href: "/dashboard/analytics/results", icon: "results" },
  { label: "Website insights", href: "/dashboard/analytics/insights", icon: "insights" },
  { label: "Usage", href: "/dashboard/analytics/usage", icon: "usage" },
];

const settingsNavigation: NavigationItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: "settings" },
];

const assistantPrompts = [
  "Which agent needs attention?",
  "Summarize today’s results",
  "How do I install the widget?",
];

function NavigationLink({ item, pathname, closeSidebar }: { item: NavigationItem; pathname: string; closeSidebar: () => void }) {
  const isActive = item.href === "/dashboard/analytics"
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link className={`ruh-nav-link${isActive ? " is-active" : ""}`} href={item.href} aria-current={isActive ? "page" : undefined} onClick={closeSidebar}>
      <Icon name={item.icon} width="18" height="18" />
      <span>{item.label}</span>
    </Link>
  );
}

function getAssistantReply(query: string) {
  const normalized = query.toLowerCase();
  if (normalized.includes("install") || normalized.includes("widget")) {
    return "Open Websites, choose your domain, then copy the one-line JavaScript snippet. After it is published, use Check installation to confirm the widget is live.";
  }
  if (normalized.includes("attention") || normalized.includes("agent")) {
    return "Theo Onboarding is still a draft at step 3 of 4. Nova and Nia Support are live and healthy; Nova has generated 196 outcomes this period.";
  }
  return "Today Ruhana handled 46 conversations, completed 27 outcomes, and influenced $2,940 in revenue. Sales performance is strongest on pricing and product comparison pages.";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const assistantInputRef = useRef<HTMLInputElement>(null);
  const assistantDialogRef = useRef<HTMLElement>(null);
  const assistantReturnFocusRef = useRef<HTMLElement | null>(null);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const workspaceWrapRef = useRef<HTMLDivElement>(null);
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);
  const analyticsMode = pathname.startsWith("/dashboard/analytics");
  const navigation = analyticsMode ? analyticsNavigation : agentNavigation;

  const openAssistant = useCallback(() => {
    assistantReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAssistantOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setAssistantOpen(false);
    window.setTimeout(() => assistantReturnFocusRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen || assistantOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [assistantOpen, sidebarOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openAssistant();
      }
      if (event.key === "Escape") {
        setAssistantOpen((open) => {
          if (open) window.setTimeout(() => assistantReturnFocusRef.current?.focus(), 0);
          return false;
        });
        setProfileOpen((open) => {
          if (open) window.setTimeout(() => profileButtonRef.current?.focus(), 0);
          return false;
        });
        setWorkspaceOpen((open) => {
          if (open) window.setTimeout(() => workspaceButtonRef.current?.focus(), 0);
          return false;
        });
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAssistant]);

  useEffect(() => {
    if (assistantOpen) window.setTimeout(() => assistantInputRef.current?.focus(), 0);
  }, [assistantOpen]);

  useEffect(() => {
    if (!assistantOpen) return;
    function trapAssistantFocus(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const controls = assistantDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", trapAssistantFocus);
    return () => window.removeEventListener("keydown", trapAssistantFocus);
  }, [assistantOpen]);

  useEffect(() => {
    if (!profileOpen && !workspaceOpen) return;
    function closePopovers(event: MouseEvent) {
      const target = event.target as Node;
      if (profileOpen && !profileWrapRef.current?.contains(target)) setProfileOpen(false);
      if (workspaceOpen && !workspaceWrapRef.current?.contains(target)) setWorkspaceOpen(false);
    }
    window.addEventListener("mousedown", closePopovers);
    return () => window.removeEventListener("mousedown", closePopovers);
  }, [profileOpen, workspaceOpen]);

  function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = assistantQuery.trim();
    if (query) setAssistantReply(getAssistantReply(query));
  }

  return (
    <div className="ruh-app-shell">
      <a className="ruh-skip-link" href="#dashboard-content">Skip to content</a>

      <header className="ruh-topbar">
        <div className="ruh-topbar-leading">
          <button className="ruh-icon-button ruh-mobile-menu" aria-label="Open navigation" aria-controls="ruh-dashboard-navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" width="20" height="20" />
          </button>
          <Link className="ruh-header-logo" href="/dashboard/agents" aria-label="Ruhana dashboard" onClick={() => setSidebarOpen(false)}><RuhanaLogo /></Link>
        </div>

        <div className="ruh-topbar-actions">
          <button className="ruh-assistant-button" type="button" aria-label="Ask Ruhana" aria-haspopup="dialog" onClick={openAssistant}>
            <Icon name="sparkle" width="16" height="16" /><span>Ask Ruhana</span><kbd>⌘ K</kbd>
          </button>
          <Link className="ruh-upgrade-button" href="/dashboard/billing">Upgrade</Link>
          <div className="ruh-profile-wrap" ref={profileWrapRef}>
            <button ref={profileButtonRef} className="ruh-profile-button" type="button" aria-label="Open account menu" aria-controls="ruh-account-popover" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}>AH</button>
            {profileOpen ? (
              <div className="ruh-popover ruh-profile-menu" id="ruh-account-popover" role="group" aria-label="Account actions">
                <div className="ruh-popover-person"><strong>Abdul Hadi</strong><span>Owner · Ruhana workspace</span></div>
                <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}>Workspace settings</Link>
                <Link href="/dashboard/billing" onClick={() => setProfileOpen(false)}>Plan and billing</Link>
                <button type="button" onClick={() => setProfileOpen(false)}>Sign out</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <button className={`ruh-sidebar-backdrop${sidebarOpen ? " is-visible" : ""}`} aria-label="Close navigation" onClick={() => setSidebarOpen(false)} tabIndex={sidebarOpen ? 0 : -1} />

      <div className="ruh-workspace-frame">
        <aside className={`ruh-sidebar${sidebarOpen ? " is-open" : ""}`} id="ruh-dashboard-navigation" aria-label="Main navigation">
          <div className="ruh-sidebar-head">
            <span>Navigation</span>
            <button className="ruh-icon-button ruh-sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><Icon name="close" width="19" height="19" /></button>
          </div>

          <div className="ruh-mode-switch" aria-label="Dashboard mode">
            <Link className={!analyticsMode ? "is-active" : ""} href="/dashboard/agents" aria-current={!analyticsMode ? "page" : undefined} onClick={() => setSidebarOpen(false)}>Agents</Link>
            <Link className={analyticsMode ? "is-active" : ""} href="/dashboard/analytics" aria-current={analyticsMode ? "page" : undefined} onClick={() => setSidebarOpen(false)}>Analytics</Link>
          </div>

          <nav className="ruh-sidebar-nav" aria-label={analyticsMode ? "Analytics" : "Agents"}>
            <p className="ruh-nav-eyebrow">{analyticsMode ? "Performance" : "Build & operate"}</p>
            <div className="ruh-nav-group">
              {navigation.map((item) => <NavigationLink item={item} pathname={pathname} closeSidebar={() => setSidebarOpen(false)} key={item.href} />)}
            </div>
          </nav>

          <div className="ruh-sidebar-bottom">
            <nav className="ruh-nav-group" aria-label="Workspace settings">
              {settingsNavigation.map((item) => <NavigationLink item={item} pathname={pathname} closeSidebar={() => setSidebarOpen(false)} key={item.href} />)}
            </nav>
            <div className="ruh-workspace-switcher" ref={workspaceWrapRef}>
              {workspaceOpen ? (
                <div className="ruh-popover ruh-workspace-menu" id="ruh-workspace-popover" role="group" aria-label="Workspace actions">
                  <p>Workspaces</p>
                  <button className="is-current" type="button" onClick={() => setWorkspaceOpen(false)}>
                    <span className="ruh-workspace-avatar">RA</span><span><strong>Ruhana workspace</strong><small>Current workspace</small></span><Icon name="check" width="15" height="15" />
                  </button>
                  <button type="button" onClick={() => setWorkspaceOpen(false)}>
                    <span className="ruh-workspace-avatar">+</span><span><strong>Create workspace</strong><small>Set up another business</small></span>
                  </button>
                </div>
              ) : null}
              <button ref={workspaceButtonRef} className="ruh-workspace-card" type="button" aria-controls="ruh-workspace-popover" aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen((value) => !value)}>
                <span className="ruh-workspace-avatar">RA</span>
                <span className="ruh-workspace-copy"><strong>Ruhana workspace</strong><small>Growth plan</small></span>
                <Icon name="chevron-down" width="16" height="16" />
              </button>
            </div>
          </div>
        </aside>

        <div className="ruh-content-stage"><div className="ruh-content-panel"><main className="ruh-main" id="dashboard-content">{children}</main></div></div>
      </div>

      {assistantOpen ? (
        <div className="ruh-dialog-backdrop" onMouseDown={closeAssistant}>
          <section ref={assistantDialogRef} className="ruh-assistant-dialog" role="dialog" aria-modal="true" aria-labelledby="ruh-assistant-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="ruh-assistant-dialog-head">
              <span className="ruh-empty-icon"><Icon name="sparkle" width="20" height="20" /></span>
              <div><h2 id="ruh-assistant-title">Ask Ruhana</h2><p>Get a quick answer from your workspace activity.</p></div>
              <button className="ruh-icon-button" type="button" aria-label="Close assistant" onClick={closeAssistant}><Icon name="close" width="18" height="18" /></button>
            </div>
            <div className="ruh-assistant-prompts" aria-label="Suggested questions">
              {assistantPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => setAssistantQuery(prompt)}>{prompt}</button>)}
            </div>
            {assistantReply ? <div className="ruh-assistant-reply" role="status" aria-live="polite"><Icon name="sparkle" width="16" height="16" /><p>{assistantReply}</p></div> : null}
            <form className="ruh-assistant-form" onSubmit={askAssistant}>
              <input ref={assistantInputRef} value={assistantQuery} onChange={(event) => setAssistantQuery(event.target.value)} placeholder="Ask about agents, results, or setup…" aria-label="Question for Ruhana" />
              <button type="submit" aria-label="Send question"><Icon name="send" width="18" height="18" /></button>
            </form>
            <small>Answers use the demo workspace data shown in this frontend.</small>
          </section>
        </div>
      ) : null}
    </div>
  );
}
