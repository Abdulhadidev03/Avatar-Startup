# Project Scan Report — What Is Actually Built (full-code audit)

*Every file in `src/` + `supabase/` + docs was read. This is the ground truth as of the `openai_model_integration` commit. Use this to update PROJECT-STATUS.md, which is stale.*

---

## 1. The verdict in one paragraph

The core product is REAL and impressive for the time spent: a working embed loader → widget iframe → Anam video call → OpenAI brain loop with per-agent config, knowledge, Firecrawl website scanning, custom photo→avatar creation, and a big polished dashboard. But the **demo's payoff moment is currently broken** (`/api/analyze` is never called by anything, so no outcomes/lead scores ever appear), the **lead toast never fires** (widget ignores `leadCaptured`), there's **one dangerous bug** (avatar upload deletes ALL other custom avatars), the **analytics/trigger feature is 100% unbuilt** (spec only), and about half the dashboard is decorative theater (integrations, billing, settings, websites-verification, parts of analytics).

---

## 2. What is REAL and working ✅

| Area | Status |
|---|---|
| Embed loader (`/api/embed/[agentId]`) | Real. Injects launcher + iframe on any site, hydrates agent name/photo, postMessage WIDGET_START/WIDGET_END bridge |
| Widget (`/widget/[agentId]`) | Real. Full voice loop: Anam session → SESSION_READY greeting → MESSAGE_HISTORY_UPDATED → `/api/brain` → `anam.talk()`. Dedup guard present |
| `/api/session` | Real. Agent-aware (loads avatar/voice from `agents`), Anam token (cara-4, custom-LLM mode), creates session row |
| `/api/brain` | Real. **OpenAI `gpt-5.6-terra`** (env-overridable, `reasoning_effort: low`), profile + knowledge stuffing (30k cap), history from `turns`, regex lead detection → `leads` |
| `/api/ingest` | Real. Firecrawl (up to 10 pages) → OpenAI profile → `profiles`. `FIRECRAWL_API_KEY` is now set |
| `/api/analyze` | Real code, **ZERO callers** — see Critical Gaps |
| Agents platform | Real CRUD (`/api/agents` + `[agentId]`), computed stats, builder wizard POSTs real agents, workspace test-call modal (with 10-min timer), knowledge CRUD, actions toggles persisted |
| Custom avatars | Real: photo → Supabase Storage → Anam one-shot avatar (`POST /v1/avatars`) |
| Check-install | Real: server-side fetch of client URL + string-search for the embed snippet |
| Voices | Real Anam catalog proxy with preview audio |
| Dashboard: Conversations | Real Supabase (sessions/turns/analyses/leads, limit 50) with transcript viewer |
| Dashboard: Analytics KPIs | Real via `GET /api/analytics?period=` (sessions/analyses/leads + % change + per-agent) |

**Vendor reality:** Anam `@anam-ai/js-sdk@4.26` + OpenAI `openai@7.10` (`gpt-5.6-terra`) + Firecrawl `4.37` + Supabase. Groq is GONE from code; `groq-sdk` and `@anthropic-ai/sdk` are dead deps still in package.json.

---

## 3. CRITICAL GAPS (these break the demo script) 🔴

1. **`/api/analyze` is orphaned.** Grep confirms nothing calls it. Widget `endCall()` only does `stopStreaming()` + WIDGET_END. Consequences: no `analyses` rows → conversations show no outcome/score/summary → analytics "outcomes" and conversion rate read 0 → sessions never get `status='ended'`/`ended_at` → duration/minutes metrics are wrong too. **Fix: call `POST /api/analyze` in `endCall()` AND on `CONNECTION_CLOSED`.** (Also send it on `pagehide` via sendBeacon so closed tabs still get analyzed.)
2. **Widget ignores `leadCaptured`** from `/api/brain` — the "✓ Contact saved" investor moment never shows. (test-avatar page consumes it; the real widget doesn't.)
3. **No fake client demo site.** `/` redirects to `/dashboard/agents`. The demo script starts on "open the fake client site" — it doesn't exist. Build a simple FlowDesk-style page (any static page with the embed snippet works).
4. **No session timer in the real widget** (only the dashboard test modal has the 10-min cap). Every forgotten open call burns Anam minutes.
5. **Analytics feature (tracking + triggers): 0% built.** `analytics_feature.md` spec only — no `/api/track`, no `visitors`/`visitor_events`/`agent_triggers` tables, no trigger engine in the loader, no journey UI (conversations page literally shows "Page-level journey tracking is not yet enabled"). The spec's recent edits (recentEvents ring buffer in WIDGET_START to avoid DB-read latency, journey greeting on manual opens too, §9 fixes) are good — build to the edited spec.

---

## 4. DANGEROUS BUGS 🐛

1. **`upload-avatar` nukes all custom avatars org-wide.** `freeAnamAvatarSlot()` lists Anam avatars and DELETEs every one with a `createdByOrganizationId` — so uploading a photo for Agent B silently destroys Agent A's custom avatar (its `anam_avatar_id` now points at nothing → session creation for A will fail). Acceptable hack for ONE agent on the starter plan; product-breaking for two+. At minimum: only delete when creation fails for lack of slots, and warn in the UI.
2. **Builder launch lies on failure.** `launchAgent()` catch block is empty and `setLaunchState("live")` runs unconditionally — a failed POST still shows the success screen, linking to hardcoded mock id `northstar-sales`.
3. **Websites page "Test installation" is fake** (700ms setTimeout → always "verified") while the REAL `/api/agents/[id]/check-install` endpoint exists and is used elsewhere. Wire it or remove the button.
4. **Analytics dashboard silently shows fabricated data** ($42,860 revenue, 1,284 conversations "Northstar" world) whenever the DB is empty or the fetch fails — with a fake "Updated 2 minutes ago" badge. In an investor demo, if anyone asks "is this real?", this is a credibility landmine. Add a visible "Demo data" badge in mock mode, or empty-state it.
5. **Zero auth / rate limiting / origin checks.** Anyone on the internet can `POST /api/session` + `/api/brain` and burn your Anam + OpenAI money; `GET /api/agents` is world-readable (including instructions); RLS policies are allow-all with the anon key shipped to browsers; service-role client used in a page with no tenancy check. Fine for this week's demo, must be fixed before ANY real client. Quick wins: origin allowlist on session/brain, per-IP rate limit, cap sessions per agent per hour.
6. Smaller: `/api/analyze` hardcodes speaker label "Sarah (Salesperson)" regardless of agent name · widget has a dead text-chat implementation (state + handlers, no UI) · no Anam cleanup on widget unmount · greeting race if `/api/agents` is slow (hardcoded default speaks instead) · conversations filters offer "Purchase"/"Resolved" outcomes that no DB value ever maps to · agent_actions toggles are persisted but `brain` never reads them (cosmetic) · knowledge PDF extraction is a homemade regex that garbles most modern PDFs · knowledge files upload into the `avatars` storage bucket · `playingVoiceId` bug in builder (known).

---

## 5. Decorative-only pages (no backend at all) 🎭

Integrations (fake Shopify/HubSpot "connected"), Billing (fake invoices, fake Visa 4242, no Stripe), Settings (fake team, no-op invites), Websites (mock list + fake verification), "Ask Ruhana" ⌘K assistant (3 canned strings, no LLM), Analytics Insights/Usage views (hardcoded numbers). Sign out is a no-op (no auth exists). These are fine as vision-demo theater — just know none of it persists.

---

## 6. Stale docs

- **PROJECT-STATUS.md** still says Groq/qwen brain, says widget + embed are "REMAINING" (they're built), doesn't list voices/knowledge/actions/check-install/upload-avatar routes, says FIRECRAWL_API_KEY unset (it's set). Needs a rewrite against this report.
- **README.md** is untouched create-next-app boilerplate.
- Product naming is split: "Ruhana" (dashboard/embed/design docs) vs unnamed MVP (status doc). Pick one.
- `supabase/migration.sql` has no DDL for the base tables (sessions/turns/leads/analyses/profiles) — check in the full schema so a fresh environment can be rebuilt.

---

## 7. Recommended priority order

**A. Make the demo script actually work (≈1 day)**
1. Wire hang-up + CONNECTION_CLOSED → `POST /api/analyze` (and mark session ended)
2. Show the lead-captured toast in the widget
3. Add the 10-min timer to the real widget
4. Build the fake FlowDesk client page with the embed snippet on it
5. "Demo data" badge (or empty state) on analytics mock fallback; fix builder fake-success

**B. Safety before anyone real touches it (≈0.5 day)**
6. Guard `freeAnamAvatarSlot` · origin check + rate limit on session/brain · seed data for the dashboard

**C. The analytics + triggers feature (≈3–4 days)** — build `analytics_feature.md` as edited (ring buffer + recentEvents in WIDGET_START, journey greeting on manual open, `/api/track`, trigger engine, journey timeline in conversations — the UI slot for it already exists).

**D. Cleanup** — remove groq-sdk + @anthropic-ai/sdk, delete dead widget chat code, wire or remove websites-page verification, update PROJECT-STATUS.md.
