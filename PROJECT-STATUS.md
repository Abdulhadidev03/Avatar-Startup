# Avatar Sales Widget MVP — Project Status

Last updated: 2026-09-02

## Dashboard frontend update — 2026-09-02

The expanded Ruhana product dashboard is now implemented as a complete interactive frontend prototype. It includes the Agents and Analytics modes, owned-agent management, an original avatar library, custom-photo onboarding, the four-step builder, per-agent configuration and deployment, conversations, websites, integrations, billing, settings, business-impact analytics, responsive layouts, and realistic populated states.

- `/` and `/dashboard` now open `/dashboard/agents`.
- The product route map and backend wiring boundaries are documented in `DASHBOARD-HANDOFF.md`.
- The visual language and reusable token contract are documented in `DESIGN-SYSTEM.md`.
- Builder drafts, launches, generated agent IDs, pause/resume state, and custom-photo previews persist locally for the frontend prototype and flow into My Agents, agent workspaces, website assignment, and analytics filters.
- Conversations, analytics, usage, and billing now share one reconciled demo baseline; draft agents no longer display invented deployment health or business impact.
- Lint, TypeScript, the optimized production build, structural accessibility checks, and all dashboard route renders pass.
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
      session/route.ts    ← POST /api/session (done)
      brain/route.ts       ← POST /api/brain (done)
      ingest/route.ts      ← POST /api/ingest (done)
    test-avatar/page.tsx   ← throwaway test page (done)
    page.tsx               ← default Next.js page (needs replacing)
    layout.tsx             ← root layout
    globals.css
  lib/
    supabase.ts            ← server-side Supabase admin client
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

- sessions (id, started_at, ended_at, page_url, status, profile_id)
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

### API Routes (4 of 4)

| Route | File | What it does |
|---|---|---|
| POST /api/session | src/app/api/session/route.ts | Creates a Supabase session row (optionally linked to a profile), fetches an Anam session token using CUSTOMER_CLIENT_V1 mode, returns { sessionToken, sessionId } |
| POST /api/brain | src/app/api/brain/route.ts | Saves user turn to DB, loads business profile (if linked), fetches conversation history, asks Groq for a sales reply, detects email for lead capture, saves assistant turn, returns { replyText, leadCaptured } |
| POST /api/ingest | src/app/api/ingest/route.ts | Crawls up to 10 pages with Firecrawl, combines content (capped at 12k chars), asks Groq to generate a structured Business Profile, saves to profiles table, returns { profileId, companyName, profileText } |
| POST /api/analyze | src/app/api/analyze/route.ts | Reads full transcript from turns table, asks Groq to grade the call (outcome: lead_captured / demo_booked / no_conversion / abandoned, lead_score: 0-100, summary), saves to analyses table, updates session status to 'ended' |

### Pages (1 of 5)

| Page | File | What it does |
|---|---|---|
| /test-avatar | src/app/test-avatar/page.tsx | Throwaway test page with video element, Start/End Call buttons, event log. Connects to Anam, streams avatar video, sends greeting on connect, routes user speech through /api/brain, feeds replies to avatar via anam.talk() |

### Infrastructure

- Next.js 16 project scaffolded (TypeScript, Tailwind, App Router, src/ dir)
- Pushed to GitHub: github.com/Huzaifa134/agaentic_bot
- Supabase tables created (all 5 tables + profile_id column on sessions)
- Anam Custom LLM mode working (avatar speaks, hears, responds)
- Full speech loop working: user speaks → Anam transcribes → /api/brain → Groq replies → avatar speaks with lipsync

---

## REMAINING

### API Routes (0 remaining - all done)

### Frontend Pages (4 remaining)

| Page | Priority | What to build |
|---|---|---|
| Fake client site (/) | HIGH | Replace default Next.js page with a realistic-looking demo business website (e.g. "FlowDesk" — a SaaS product). This is where the floating widget lives. Must look real for the investor demo. |
| Floating widget | HIGH | Chat bubble in bottom-right corner of the client site. Click → avatar video pops up in a panel/modal. Contains: video element, captions, "End Call" button. Calls /api/session on open, runs the speech loop, triggers /api/analyze on close. |
| Dashboard (/dashboard) | HIGH | Shows all past calls in a table/card layout. For each call: transcript (from turns), outcome badge ("Lead Captured ✅"), lead score, summary, lead info (name/email). Reads from sessions, turns, analyses, leads tables via Supabase anon key (client-side reads). |
| Onboarding page (/onboard) | MEDIUM | Simple form: paste a URL → calls /api/ingest → shows the generated Business Profile. Used to demo "paste your website and the bot learns your business." |

### Call Flow (3 remaining pieces)

| Feature | Priority | What to build |
|---|---|---|
| Hang-up flow | HIGH | End Call button (or beforeunload) → anamClient.stopStreaming() → POST /api/analyze { sessionId } → update session to status: 'ended', ended_at: now() |
| Greeting as a turn | MEDIUM | Save the initial greeting ("Hey! I'm Sarah from FlowDesk...") as an assistant turn in the turns table so it appears in the transcript |
| Session timer | MEDIUM | 10-minute client-side timer that auto-ends the call. Every minute on Anam costs money. |

### DevOps (2 remaining)

| Item | Priority | What to do |
|---|---|---|
| Vercel deployment | HIGH | Deploy to Vercel, set env vars in Vercel dashboard, confirm preview deploys work on push |
| Seed data | MEDIUM | Insert fake sessions/turns/leads/analyses into Supabase so the dashboard has data to show even before real calls |

### Cleanup

| Item | Priority |
|---|---|
| Remove @anthropic-ai/sdk or keep for later Anthropic switch | LOW |

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
