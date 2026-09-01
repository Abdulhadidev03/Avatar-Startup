# Ruhana dashboard frontend handoff

The dashboard is a complete interactive frontend prototype for Ruhana's website avatar agents. All product routes render realistic populated states and use local typed data. Backend and AI teams can replace the mock collections with API responses without changing the navigation or page hierarchy.

## Product routes

| Route | Purpose |
| --- | --- |
| `/dashboard/agents` | Owned agents, ready avatar library, custom-photo entry, filtering, preview, and agent creation |
| `/dashboard/agents/new` | Four-step agent builder; accepts `avatar`, `source=custom`, or `resume` query parameters |
| `/dashboard/agents/[agentId]` | Agent overview, configuration, knowledge, actions, widget, and conversations |
| `/dashboard/conversations` | Searchable and filterable conversation list with transcript and visitor-event timeline |
| `/dashboard/websites` | Website assignments, installation methods, widget code, and verification status |
| `/dashboard/integrations` | Connection catalog, health, permissions, enabled events, and actions |
| `/dashboard/billing` | Plan, allowance, projected usage, payment handoff, and invoice downloads |
| `/dashboard/settings` | Workspace, team, notification, and privacy settings |
| `/dashboard/analytics` | Business-impact overview |
| `/dashboard/analytics/results` | Outcome mix and attributed result ledger |
| `/dashboard/analytics/insights` | Visitor intent, objections, page influence, and recommendations |
| `/dashboard/analytics/usage` | Minutes, conversations, plan allowance, and allocation by agent |

## Shared frontend data

- Agent, avatar, and conversation shapes are in `src/app/dashboard/mock-data.ts`.
- Analytics shapes and the coherent 7/30/90-day demo dataset are in `src/app/dashboard/analytics/analytics-data.ts`.
- Reusable avatar, status, and page-heading components are in `src/app/dashboard/dashboard-ui.tsx`.
- The original avatar atlas is `public/avatars/ruhana-avatar-atlas.png`.

Keep money in minor units, timestamps in UTC, and rates as values from 0–1 in backend responses. Format them for locale only in the frontend.

## Suggested API boundaries

```text
GET    /api/avatars
POST   /api/avatars/custom
GET    /api/agents
POST   /api/agents
GET    /api/agents/:id
PATCH  /api/agents/:id
POST   /api/agents/:id/test
POST   /api/agents/:id/publish
GET    /api/agents/:id/knowledge
POST   /api/agents/:id/knowledge
POST   /api/agents/:id/knowledge/sync
GET    /api/agents/:id/actions
PATCH  /api/agents/:id/actions/:actionId
GET    /api/conversations
GET    /api/conversations/:id
PATCH  /api/conversations/:id/outcome
GET    /api/websites
POST   /api/websites
POST   /api/websites/:id/verify
GET    /api/integrations
POST   /api/integrations/:provider/connect
POST   /api/integrations/:id/test
DELETE /api/integrations/:id
GET    /api/billing/summary
GET    /api/billing/invoices
GET    /api/settings
PATCH  /api/settings/:section
GET    /api/analytics/overview
GET    /api/analytics/results
GET    /api/analytics/website-insights
GET    /api/analytics/usage
```

## Wiring notes

1. Replace local arrays with server-fetched props or query results while preserving their current fields.
2. Persist builder drafts after each step and return `saveState`, processing status, and validation errors.
3. Custom-avatar upload should use a signed upload URL, then expose processing progress and a final preview URL.
4. Website scan, knowledge sync, avatar processing, and installation checks should be asynchronous jobs with polling or streamed status.
5. Widget installation must issue stable website and agent identifiers; never expose private keys in the snippet.
6. Conversation detail should merge transcript messages, website events, agent actions, and outcome evidence in timestamp order.
7. Outcome corrections need an audit reason and original-value history.
8. Payment details should be collected only through the billing provider; the Ruhana backend receives a provider token, not raw card data.
9. Analytics filters should be reflected in URL query parameters when connected to real endpoints so filtered views can be shared.

## Required backend states

Each collection and mutation should support populated, loading, empty, filtered-empty, recoverable error, and success states. The frontend already establishes the visible patterns for populated, empty/filter-empty, progress, success, and safe confirmation feedback.
