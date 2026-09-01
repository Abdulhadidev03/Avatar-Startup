"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PageHeader, StatusBadge } from "../dashboard-ui";
import { agents } from "../mock-data";

type Platform = "HTML" | "Shopify" | "WordPress" | "Google Tag Manager";

type Website = {
  id: string;
  name: string;
  domain: string;
  agentId: string | null;
  status: "Live" | "Draft" | "Paused";
  verified: boolean;
  lastEvent: string;
};

const initialWebsites: Website[] = [
  {
    id: "northstar-main",
    name: "Northstar",
    domain: "northstar.com",
    agentId: "northstar-sales",
    status: "Live",
    verified: true,
    lastEvent: "2 minutes ago",
  },
  {
    id: "northstar-help",
    name: "Northstar Help Center",
    domain: "help.northstar.com",
    agentId: "ruh-support",
    status: "Live",
    verified: true,
    lastEvent: "8 minutes ago",
  },
  {
    id: "northstar-app",
    name: "Northstar App",
    domain: "app.northstar.com",
    agentId: "onboarding-guide",
    status: "Draft",
    verified: false,
    lastEvent: "Waiting for installation",
  },
];

const platformInstructions: Record<Platform, string[]> = {
  HTML: [
    "Copy the Ruhana snippet below.",
    "Paste it before the closing </body> tag on every page where the agent should appear.",
    "Publish the website, then return here and test the installation.",
  ],
  Shopify: [
    "In Shopify, open Online Store → Themes → Edit code.",
    "Open theme.liquid and paste the snippet before the closing </body> tag.",
    "Save the theme, then test the installation here.",
  ],
  WordPress: [
    "Install a header and footer code plugin, or open your theme footer.",
    "Add the snippet to the footer before the closing </body> tag.",
    "Clear site cache, then test the installation here.",
  ],
  "Google Tag Manager": [
    "Create a new Custom HTML tag in Google Tag Manager.",
    "Paste the snippet and set the trigger to All Pages.",
    "Publish the container, then test the installation here.",
  ],
};

const platforms = Object.keys(platformInstructions) as Platform[];

function platformSlug(platform: Platform) {
  return platform.toLowerCase().replaceAll(" ", "-");
}

function useDialogFocus(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      const preferred = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]',
      );
      (preferred ?? first ?? dialogRef.current)?.focus();
    });

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href]',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, open]);

  return dialogRef;
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState(initialWebsites);
  const [selectedId, setSelectedId] = useState(initialWebsites[0].id);
  const [platform, setPlatform] = useState<Platform>("HTML");
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const closeAddWebsite = useCallback(() => setShowAddWebsite(false), []);
  const addWebsiteDialogRef = useDialogFocus(showAddWebsite, closeAddWebsite);

  const selectedWebsite =
    websites.find((website) => website.id === selectedId) ?? websites[0];
  const assignedAgent = agents.find((agent) => agent.id === selectedWebsite.agentId) ?? null;
  const eligibleAgent = assignedAgent?.status === "Live";
  const snippet = useMemo(
    () =>
      `<script async src="https://cdn.ruhana.ai/widget.js" data-site="${selectedWebsite.id}" data-agent="${assignedAgent?.id ?? "assign-an-agent"}"></script>`,
    [assignedAgent?.id, selectedWebsite.id],
  );

  async function copySnippet() {
    if (!eligibleAgent) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function testInstallation() {
    if (!eligibleAgent) return;
    setTesting(true);
    window.setTimeout(() => {
      setWebsites((current) =>
        current.map((website) =>
          website.id === selectedWebsite.id
            ? { ...website, verified: true, status: "Live", lastEvent: "Verified just now" }
            : website,
        ),
      );
      setTesting(false);
    }, 700);
  }

  function assignAgent(agentId: string) {
    setWebsites((current) =>
      current.map((website) =>
        website.id === selectedWebsite.id
          ? {
              ...website,
              agentId: agentId || null,
              verified: false,
              status: "Draft",
              lastEvent: "Waiting for verification",
            }
          : website,
      ),
    );
  }

  function handlePlatformKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % platforms.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + platforms.length) % platforms.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = platforms.length - 1;
    else return;
    event.preventDefault();
    setPlatform(platforms[nextIndex]);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  }

  function addWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanDomain = newDomain.replace(/^https?:\/\//, "").replace(/\/$/, "").trim();
    if (!newName.trim() || !cleanDomain) return;
    const id = `site-${Date.now()}`;
    setWebsites((current) => [
      ...current,
      {
        id,
        name: newName.trim(),
        domain: cleanDomain,
        agentId: null,
        status: "Draft",
        verified: false,
        lastEvent: "Waiting for installation",
      },
    ]);
    setSelectedId(id);
    setNewName("");
    setNewDomain("");
    closeAddWebsite();
  }

  return (
    <div className="ruh-page-stack ruh-websites-page">
      <PageHeader
        eyebrow="Agents"
        title="Websites"
        description="Install Ruhana, assign an agent, and verify that website context and outcome tracking are working."
        actions={
          <button className="ruh-primary-button" type="button" onClick={() => setShowAddWebsite(true)}>
            Add website
          </button>
        }
      />

      <div className="ruh-websites-layout">
        <section className="ruh-data-surface ruh-site-list" aria-label="Connected websites">
          <div className="ruh-surface-heading">
            <div>
              <p className="ruh-kicker">Deployments</p>
              <h2>{websites.length} websites</h2>
            </div>
            <span>{websites.filter((website) => website.verified).length} verified</span>
          </div>
          <div className="ruh-site-list-items">
            {websites.map((website) => (
              <button
                key={website.id}
                type="button"
                className={`ruh-site-row${website.id === selectedWebsite.id ? " is-selected" : ""}`}
                onClick={() => setSelectedId(website.id)}
              >
                <span className="ruh-site-monogram" aria-hidden="true">
                  {website.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="ruh-site-row-copy">
                  <strong>{website.name}</strong>
                  <small>{website.domain}</small>
                </span>
                <span className={`ruh-verification-dot${website.verified ? " is-verified" : ""}`}>
                  {website.verified ? "Verified" : "Setup needed"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="ruh-data-surface ruh-deployment-panel" aria-live="polite">
          <div className="ruh-deployment-header">
            <div>
              <p className="ruh-kicker">{selectedWebsite.domain}</p>
              <h2>{selectedWebsite.name}</h2>
              <p>Agent: {assignedAgent?.name ?? "Not assigned"}</p>
            </div>
            <StatusBadge status={selectedWebsite.status} />
          </div>

          <label className="ruh-plain-field ruh-agent-assignment">
            <span>Assigned agent</span>
            <select value={selectedWebsite.agentId ?? ""} onChange={(event) => assignAgent(event.target.value)}>
              <option value="">Choose an agent</option>
              {agents.map((agent) => (
                <option value={agent.id} key={agent.id}>
                  {agent.name} · {agent.status === "Live" ? "Ready" : `${agent.status} — finish setup`}
                </option>
              ))}
            </select>
            <small>
              {eligibleAgent
                ? `${assignedAgent?.name} is ready for this website.`
                : assignedAgent
                  ? `${assignedAgent.name} is ${assignedAgent.status.toLowerCase()}. Finish its setup or choose a live agent before verification.`
                  : "Assign a live agent before installing and verifying the widget."}
            </small>
          </label>

          <div className={`ruh-install-status${selectedWebsite.verified ? " is-verified" : eligibleAgent ? " is-pending" : " is-blocked"}`}>
            <span aria-hidden="true">{selectedWebsite.verified ? "✓" : eligibleAgent ? "1" : "!"}</span>
            <div>
              <strong>
                {selectedWebsite.verified
                  ? "Installation verified"
                  : eligibleAgent
                    ? "Install the widget"
                    : "A ready agent is required"}
              </strong>
              <p>
                {selectedWebsite.verified
                  ? `Ruhana received a website event ${selectedWebsite.lastEvent}. Context and outcome tracking are active.`
                  : eligibleAgent
                    ? "Add the snippet to your website. Ruhana will verify the domain before the agent can go live."
                    : "Choose an agent marked Ready. Verification and activation remain disabled until then."}
              </p>
            </div>
          </div>

          <div className="ruh-platform-tabs" role="tablist" aria-label="Website platform">
            {platforms.map((option, index) => (
              <button
                key={option}
                id={`platform-tab-${platformSlug(option)}`}
                type="button"
                role="tab"
                aria-selected={platform === option}
                aria-controls={`platform-panel-${platformSlug(option)}`}
                tabIndex={platform === option ? 0 : -1}
                className={platform === option ? "is-active" : ""}
                onClick={() => setPlatform(option)}
                onKeyDown={(event) => handlePlatformKeyDown(event, index)}
              >
                {option}
              </button>
            ))}
          </div>

          <div
            className="ruh-platform-panel"
            role="tabpanel"
            id={`platform-panel-${platformSlug(platform)}`}
            aria-labelledby={`platform-tab-${platformSlug(platform)}`}
          >
            <div className="ruh-install-guide">
              <div>
                <p className="ruh-kicker">{platform} guide</p>
                <h3>Install in a few minutes</h3>
              </div>
              <ol>
                {platformInstructions[platform].map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
            </div>

            <div className="ruh-code-block">
              <div>
                <span>Widget code</span>
                <button type="button" onClick={copySnippet} disabled={!eligibleAgent}>
                  {copied ? "Copied" : eligibleAgent ? "Copy code" : "Assign an agent first"}
                </button>
              </div>
              <code>{snippet}</code>
            </div>
          </div>

          <div className="ruh-deployment-actions">
            <p>{eligibleAgent ? "Your website must be publicly accessible while testing." : "Verification unlocks after a ready agent is assigned."}</p>
            <button className="ruh-primary-button" type="button" onClick={testInstallation} disabled={testing || !eligibleAgent}>
              {testing ? "Checking website…" : !eligibleAgent ? "Assign a ready agent" : selectedWebsite.verified ? "Test again" : "Test installation"}
            </button>
          </div>
        </section>
      </div>

      {showAddWebsite ? (
        <div className="ruh-modal-backdrop" role="presentation" onMouseDown={closeAddWebsite}>
          <section
            ref={addWebsiteDialogRef}
            className="ruh-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-website-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ruh-modal-header">
              <div>
                <p className="ruh-kicker">New deployment</p>
                <h2 id="add-website-title">Add a website</h2>
              </div>
              <button type="button" onClick={closeAddWebsite} aria-label="Close dialog">
                ×
              </button>
            </div>
            <form onSubmit={addWebsite} className="ruh-settings-form">
              <label className="ruh-plain-field">
                <span>Website name</span>
                <input data-autofocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Northstar Store" required />
              </label>
              <label className="ruh-plain-field">
                <span>Domain</span>
                <input value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="store.northstar.com" required />
              </label>
              <div className="ruh-modal-actions">
                <button className="ruh-secondary-button" type="button" onClick={closeAddWebsite}>
                  Cancel
                </button>
                <button className="ruh-primary-button" type="submit">
                  Add website
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
