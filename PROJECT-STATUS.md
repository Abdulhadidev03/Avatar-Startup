# Avatar Sales Widget MVP — Project Status

Last updated: 2026-09-02

## Dashboard frontend update — 2026-09-01

The expanded Ruhana product dashboard is now implemented as a complete interactive frontend prototype. It includes the Agents and Analytics modes, owned-agent management, an original avatar library, custom-photo onboarding, the four-step builder, per-agent configuration and deployment, conversations, websites, integrations, billing, settings, business-impact analytics, responsive layouts, and realistic populated states.

- `/` and `/dashboard` now open `/dashboard/agents`.
- The product route map and backend wiring boundaries are documented in `DASHBOARD-HANDOFF.md`.
- The visual language and reusable token contract are documented in `DESIGN-SYSTEM.md`.
- Dashboard data and service actions are still intentionally mocked; backend and AI teams should replace those seams with real APIs, persistence, generation, and deployment services.
- The original MVP notes below remain as the implementation history and backend contract. Where the old frontend checklist conflicts with this update, this section is current.

## What we're building

A demo for investors: a fake "client website" with a floating widget. A visitor clicks it → live video call with a lipsynced AI avatar that acts as a salesperson → it answers questions about the business, handles objections, and captures the visitor's name/email as a lead → seconds after the call ends, our dashboard shows the transcript, the outcome ("Lead Captured"), and a lead score.

## Stack

| Piece | What it does | Status |
|---|---|---|
| Anam (anam.ai) | Avatar face, voice, lipsync, speech-to-text via WebRTC | Integrated |
| Groq (qwen/qwen3.8-27b) | Salesperson brain + profile generation (replacing Claude temporarily — no Anthropic credits yet) | Integrated |
| Firecrawl (firecrawl.dev) | Crawl client websites to generate business profiles | Integrated (needs API key) |
| Supabase | Postgres DB: sessions, turns, leads, analyses, profiles | Tables created |
| Next.js 16 | App Router, TypeScript, Tailwind CSS, src/ directory | Scaffolded |

## Repo structure

```
src/
  app/
    api/
      session/route.ts        ← POST /api/session (done — now agent-aware)
      brain/route.ts           ← POST /api/brain (done — now agent-aware)
      ingest/route.ts          ← POST /api/ingest (done)
      analyze/route.ts         ← POST /api/analyze (done)
      agents/route.ts          ← GET+POST /api/agents (done)
      agents/[agentId]/route.ts← GET+PUT+DELETE /api/agents/:id (done)
      analytics/route.ts       ← GET /api/analytics?period=30d (done)
    test-avatar/page.tsx       ← throwaway test page (done)
    dashboard/                 ← full dashboard (wired to real data)
    page.tsx                   ← default Next.js page (needs replacing)
    layout.tsx                 ← root layout
    globals.css
  lib/
    supabase.ts                ← server-side Supabase admin client
    supabase-browser.ts        ← browser-side client (anon key)
supabase/
  migration.sql                ← SQL to create agents table (run in Supabase SQL Editor)
```

## THE CONTRACT (do not change without all 3 people agreeing)

### API routes

```
POST /api/session
  body:     { "pageUrl": "https://...", "profileId": "uuid" (optional) }
  returns:  { "sessionToken": "anam-token", "sessionId": "uuid" }

POST /api/brain
  body:     { "sessionId": "uuid", "userText": "how much does the pro plan cost?" }
  returns:  { "replyText": "The pro plan is forty-nine dollars a month...", "leadCaptured": false }

POST /api/analyze
  body:     { "sessionId": "uuid" }
  returns:  { "outcome": "lead_captured", "leadScore": 85, "summary": "..." }

POST /api/ingest
  body:     { "url": "https://client-website.com" }
  returns:  { "profileId": "uuid", "companyName": "...", "profileText": "..." }
```

### Database tables (all created in Supabase)

- agents (id, name, role, website, status, avatar_id, anam_avatar_id, anam_voice_id, greeting, tone, response_length, instructions, language, purpose, profile_id, created_at, updated_at) — **NEW**
- sessions (id, started_at, ended_at, page_url, status, profile_id, agent_id) — **agent_id added**
- turns (id, session_id, role, content, created_at)
- leads (id, session_id, name, email, interest, created_at)
- analyses (session_id, outcome, lead_score, summary, created_at)
- profiles (id, company_name, source_url, profile_text, created_at)

### Environment variables

```
ANAM_API_KEY=              ✅ set
ANAM_AVATAR_ID=            ✅ set (Olivia — cf437b5e...)
ANAM_VOICE_ID=             ✅ set (Tara — c674059e...)
GROQ_API_KEY=              ✅ set (temporary, replacing Anthropic)
FIRECRAWL_API_KEY=         ❌ not set yet
NEXT_PUBLIC_SUPABASE_URL=  ✅ set
NEXT_PUBLIC_SUPABASE_ANON_KEY= ✅ set
SUPABASE_SERVICE_ROLE_KEY= ✅ set
```

Note: ANTHROPIC_API_KEY will replace GROQ_API_KEY once credits are purchased. The @anthropic-ai/sdk is already installed.

---

## DONE

### API Routes (7 of 7)

| Route | File | What it does |
|---|---|---|
| POST /api/session | src/app/api/session/route.ts | Creates session row (now accepts optional agentId — loads avatar/voice config from agents table), fetches Anam session token, returns { sessionToken, sessionId } |
| POST /api/brain | src/app/api/brain/route.ts | Saves user turn, loads agent config (name, instructions, profile) from session → agent chain, asks Groq for a sales reply, saves assistant turn, returns { replyText, leadCaptured } |
| POST /api/ingest | src/app/api/ingest/route.ts | Crawls up to 10 pages with Firecrawl, asks Groq to generate a Business Profile, saves to profiles table |
| POST /api/analyze | src/app/api/analyze/route.ts | Reads transcript, asks Groq to grade the call, saves to analyses table, marks session ended |
| GET/POST /api/agents | src/app/api/agents/route.ts | GET lists all agents with computed stats (conversations, outcomes, conversion rate). POST creates a new agent. |
| GET/PUT/DELETE /api/agents/:id | src/app/api/agents/[agentId]/route.ts | Full CRUD for individual agents with computed stats |
| GET /api/analytics | src/app/api/analytics/route.ts | Aggregates sessions/analyses/leads for a period (7d/30d/90d), returns KPIs with % change vs previous period, per-agent breakdown |

### Frontend Wiring (all dashboard pages)

| Page | What was wired |
|---|---|
| /dashboard/conversations | Reads real sessions, turns, analyses, leads from Supabase. Resolves agent names from agents table. Merges with mock data as fallback. |
| /dashboard/agents | Fetches real agents from GET /api/agents. Shows computed conversation counts and outcome stats. Falls back to mock data if no agents in DB. |
| /dashboard/agents/[id] | Loads real agent from GET /api/agents/:id. Fetches real conversations for that agent from Supabase. |
| /dashboard/agents/new (builder) | On "Launch agent" → saves to DB via POST /api/agents. Links to real agent ID after creation. |
| /dashboard/analytics | Fetches real KPIs from GET /api/analytics. Shows real conversation/outcome/minute counts. Falls back to mock charts/trends. |

### Pages (1 standalone)

| Page | File | What it does |
|---|---|---|
| /test-avatar | src/app/test-avatar/page.tsx | Throwaway test page — connects to Anam, streams avatar, runs speech loop through /api/brain |

### Infrastructure

- Next.js 16 project scaffolded (TypeScript, Tailwind, App Router, src/ dir)
- Pushed to GitHub: github.com/Huzaifa134/agaentic_bot
- Supabase tables created (6 tables: sessions, turns, leads, analyses, profiles, agents)
- Anam Custom LLM mode working (avatar speaks, hears, responds)
- Full speech loop working: user speaks → Anam transcribes → /api/brain → Groq replies → avatar speaks with lipsync
- Browser-safe Supabase client for dashboard reads (supabase-browser.ts)

---

## REMAINING

### One-time setup: Run migration SQL

Run `supabase/migration.sql` in Supabase SQL Editor to create the `agents` table and add `agent_id` to sessions.

### Frontend Pages (2 remaining for demo)

| Page | Priority | What to build |
|---|---|---|
| Fake client site (/) | HIGH | Replace default Next.js page with a demo business website. This is where the floating widget lives. |
| Floating widget | HIGH | Chat bubble → avatar video panel. Calls /api/session (with agentId) on open, runs speech loop, triggers /api/analyze on close. |

### Call Flow (3 remaining pieces)

| Feature | Priority | What to build |
|---|---|---|
| Hang-up flow | HIGH | End Call → anamClient.stopStreaming() → POST /api/analyze → mark session ended |
| Greeting as a turn | MEDIUM | Save initial greeting as an assistant turn so it appears in transcript |
| Session timer | MEDIUM | 10-minute auto-end to limit Anam costs |

### DevOps (2 remaining)

| Item | Priority | What to do |
|---|---|---|
| Vercel deployment | HIGH | Deploy to Vercel, set env vars |
| Seed data | MEDIUM | Insert fake sessions/turns/agents into Supabase for demo |

### Cleanup

| Item | Priority |
|---|---|
| Fix pre-existing playingVoiceId bug in agent-builder.tsx | LOW |
| Remove @anthropic-ai/sdk or keep for later | LOW |

---

## Demo Script (this is the spec — if it's not here, don't build it)

1. Open the fake client site (FlowDesk)
2. Click the widget → avatar appears, says greeting
3. Ask "what does FlowDesk do?" → avatar answers from the Business Profile
4. Ask "how much does the pro plan cost?" → avatar answers with pricing
5. Raise an objection → avatar handles it
6. Give name and email → avatar confirms, leadCaptured toast appears
7. Hang up
8. Open the dashboard → see the call transcript, "Lead Captured ✅", lead score 85, summary

---

## Build Order (recommended)

1. /api/analyze + hang-up flow (completes the call lifecycle)
2. Fake client site + floating widget (the demo's first impression)
3. Dashboard (the demo's payoff — "look, it captured the lead!")
4. Onboarding page (paste URL demo)
5. Vercel deploy + seed data (final demo prep)
6. Polish, latency tuning, cross-browser testing
