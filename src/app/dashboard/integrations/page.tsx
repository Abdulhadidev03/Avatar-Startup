"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "../dashboard-ui";
import { useDialogFocus } from "../use-dialog-focus";

type IntegrationCategory =
  | "Website"
  | "Commerce"
  | "CRM"
  | "Scheduling"
  | "Support"
  | "Notifications"
  | "Developer";

type Integration = {
  id: string;
  name: string;
  mark: string;
  category: IntegrationCategory;
  description: string;
  status: "connected" | "available" | "attention";
  account?: string;
  lastSync?: string;
  events: string[];
  actions: string[];
};

const initialIntegrations: Integration[] = [
  {
    id: "web-sdk",
    name: "Ruhana Web SDK",
    mark: "R",
    category: "Website",
    description: "Understand pages, clicks, products, carts, and conversion events.",
    status: "connected",
    account: "northstar.com",
    lastSync: "Event received 2 minutes ago",
    events: ["Page views", "Product views", "Cart updates", "Purchases"],
    actions: ["Open links", "Update cart", "Start checkout"],
  },
  {
    id: "shopify",
    name: "Shopify",
    mark: "S",
    category: "Commerce",
    description: "Use live catalog, inventory, carts, customers, and orders.",
    status: "connected",
    account: "northstar-home.myshopify.com",
    lastSync: "Synced 6 minutes ago",
    events: ["Products", "Inventory", "Carts", "Orders"],
    actions: ["Recommend products", "Add to cart", "Create checkout"],
  },
  {
    id: "hubspot",
    name: "HubSpot",
    mark: "H",
    category: "CRM",
    description: "Create qualified contacts and attach conversation context to deals.",
    status: "connected",
    account: "Northstar Sales",
    lastSync: "Synced 11 minutes ago",
    events: ["Contacts", "Deals", "Lifecycle stages"],
    actions: ["Create contact", "Update deal", "Assign owner"],
  },
  {
    id: "calendly",
    name: "Calendly",
    mark: "C",
    category: "Scheduling",
    description: "Let qualified visitors book the right meeting during a conversation.",
    status: "available",
    events: ["Availability", "Bookings", "Cancellations"],
    actions: ["Show times", "Book meeting", "Reschedule"],
  },
  {
    id: "zendesk",
    name: "Zendesk",
    mark: "Z",
    category: "Support",
    description: "Create tickets with the transcript, visitor context, and urgency attached.",
    status: "available",
    events: ["Tickets", "Customer records", "Help center"],
    actions: ["Create ticket", "Add note", "Set priority"],
  },
  {
    id: "slack",
    name: "Slack",
    mark: "S",
    category: "Notifications",
    description: "Alert your team when Ruhana finds a hot lead or needs a human.",
    status: "available",
    events: ["Hot leads", "Escalations", "Integration errors"],
    actions: ["Send channel message", "Notify owner"],
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    mark: "G",
    category: "Website",
    description: "Deploy the Ruhana widget through your existing tag container.",
    status: "available",
    events: ["Container status", "Widget loaded"],
    actions: ["Install widget"],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    mark: "{ }",
    category: "Developer",
    description: "Send conversation and outcome events to your own systems.",
    status: "available",
    events: ["Conversation events", "Agent actions", "Outcomes"],
    actions: ["POST signed payload"],
  },
];

const categories: Array<"All" | "Connected" | IntegrationCategory> = [
  "All",
  "Connected",
  "Website",
  "Commerce",
  "CRM",
  "Scheduling",
  "Support",
  "Notifications",
  "Developer",
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [testing, setTesting] = useState(false);
  const closeIntegration = useCallback(() => setSelectedId(null), []);
  const integrationDialogRef = useDialogFocus(Boolean(selectedId), closeIntegration);

  const visibleIntegrations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return integrations.filter((integration) => {
      const matchesQuery =
        !normalizedQuery ||
        `${integration.name} ${integration.category} ${integration.description}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory =
        category === "All" ||
        (category === "Connected"
          ? integration.status === "connected"
          : integration.category === category);
      return matchesQuery && matchesCategory;
    });
  }, [category, integrations, query]);

  const selectedIntegration =
    integrations.find((integration) => integration.id === selectedId) ?? null;

  function toggleConnection(id: string) {
    setIntegrations((current) =>
      current.map((integration) => {
        if (integration.id !== id) return integration;
        const connecting = integration.status !== "connected";
        setNotice(
          connecting
            ? `${integration.name} connected. Review its permissions before going live.`
            : `${integration.name} disconnected. Its events and actions are now paused.`,
        );
        return {
          ...integration,
          status: connecting ? "connected" : "available",
          account: connecting ? integration.account ?? "Northstar workspace" : undefined,
          lastSync: connecting ? "Connected just now" : undefined,
        };
      }),
    );
  }

  function testConnection() {
    if (!selectedIntegration) return;
    setTesting(true);
    window.setTimeout(() => {
      setTesting(false);
      setNotice(`${selectedIntegration.name} is healthy. A test event was received.`);
    }, 650);
  }

  return (
    <div className="ruh-page-stack ruh-integrations-page">
      <PageHeader
        eyebrow="Agents"
        title="Integrations"
        description="Connect the systems Ruhana needs to understand behavior, take action, and measure results."
      />

      {notice ? (
        <div className="ruh-inline-notice is-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>Dismiss</button>
        </div>
      ) : null}

      <section className="ruh-integration-health" aria-label="Integration health">
        <div>
          <span className="ruh-health-indicator is-healthy" aria-hidden="true" />
          <div>
            <strong>{integrations.filter((item) => item.status === "connected").length} systems connected</strong>
            <p>Website context, commerce events, and CRM actions are flowing normally.</p>
          </div>
        </div>
        <span>Last checked just now</span>
      </section>

      <section className="ruh-data-surface">
        <div className="ruh-data-toolbar">
          <label className="ruh-search-control">
            <span className="ruh-sr-only">Search integrations</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search integrations"
            />
          </label>
          <div className="ruh-filter-tabs" role="group" aria-label="Filter integrations by category">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={category === option}
                className={category === option ? "is-active" : ""}
                onClick={() => setCategory(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {visibleIntegrations.length ? (
          <div className="ruh-integration-grid">
            {visibleIntegrations.map((integration) => {
              const connected = integration.status === "connected";
              return (
                <article className="ruh-integration-card" key={integration.id}>
                  <div className="ruh-integration-card-head">
                    <span className="ruh-integration-mark" aria-hidden="true">{integration.mark}</span>
                    <button
                      className={`ruh-switch${connected ? " is-on" : ""}`}
                      type="button"
                      role="switch"
                      aria-checked={connected}
                      aria-label={`${connected ? "Disconnect" : "Connect"} ${integration.name}`}
                      onClick={() => toggleConnection(integration.id)}
                    >
                      <span />
                    </button>
                  </div>
                  <div className="ruh-integration-card-copy">
                    <span>{integration.category}</span>
                    <h2>{integration.name}</h2>
                    <p>{integration.description}</p>
                  </div>
                  <div className="ruh-integration-card-status">
                    <span className={`ruh-connection-status is-${integration.status}`}>
                      {connected ? "Connected" : integration.status === "attention" ? "Needs attention" : "Available"}
                    </span>
                    <small>{integration.account ?? "Not connected"}</small>
                  </div>
                  <button className="ruh-card-action" type="button" onClick={() => setSelectedId(integration.id)}>
                    {connected ? "Configure" : "View setup"}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ruh-filter-empty">
            <h2>No integrations found</h2>
            <p>Try another search or category.</p>
            <button className="ruh-secondary-button" type="button" onClick={() => { setQuery(""); setCategory("All"); }}>
              Clear filters
            </button>
          </div>
        )}
      </section>

      {selectedIntegration ? (
        <div className="ruh-modal-backdrop" role="presentation" onMouseDown={closeIntegration}>
          <section
            ref={integrationDialogRef}
            className="ruh-modal-card ruh-integration-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="integration-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ruh-modal-header">
              <div className="ruh-integration-title">
                <span className="ruh-integration-mark" aria-hidden="true">{selectedIntegration.mark}</span>
                <div>
                  <p>{selectedIntegration.category}</p>
                  <h2 id="integration-title">{selectedIntegration.name}</h2>
                </div>
              </div>
              <button type="button" onClick={closeIntegration} aria-label="Close dialog">×</button>
            </div>

            <div className="ruh-connection-overview">
              <span className={`ruh-health-indicator is-${selectedIntegration.status === "connected" ? "healthy" : "idle"}`} />
              <div>
                <strong>{selectedIntegration.status === "connected" ? "Connection healthy" : "Ready to connect"}</strong>
                <p>{selectedIntegration.lastSync ?? "Connect an account to begin receiving events."}</p>
              </div>
            </div>

            <div className="ruh-permission-grid">
              <section>
                <h3>Ruhana can read</h3>
                <ul>{selectedIntegration.events.map((event) => <li key={event}>✓ {event}</li>)}</ul>
              </section>
              <section>
                <h3>Ruhana can do</h3>
                <ul>{selectedIntegration.actions.map((action) => <li key={action}>✓ {action}</li>)}</ul>
              </section>
            </div>

            <div className="ruh-modal-actions">
              {selectedIntegration.status === "connected" ? (
                <>
                  <button className="ruh-secondary-button" type="button" onClick={testConnection} disabled={testing}>
                    {testing ? "Testing…" : "Test connection"}
                  </button>
                  <button className="ruh-danger-button" type="button" onClick={() => { toggleConnection(selectedIntegration.id); closeIntegration(); }}>
                    Disconnect
                  </button>
                </>
              ) : (
                <button className="ruh-primary-button" type="button" onClick={() => { toggleConnection(selectedIntegration.id); closeIntegration(); }}>
                  Connect {selectedIntegration.name}
                </button>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
