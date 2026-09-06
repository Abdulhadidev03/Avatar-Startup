# Ruhana — Product Feature Brief for Pitch.com

**Purpose:** Give this document to [Pitch.com](https://pitch.com/) (or a designer) to generate investor / sales presentation slides.  
**Audience:** Investors, partners, early customers.  
**Product:** Ruhana — AI avatar sales agents that live on a company’s website, talk to visitors in real time, and prove what converted them.

---

## How to use this with Pitch

Paste sections into Pitch’s AI / prompt as:

> “Create a 12–15 slide pitch deck from this product brief. Prefer bold headlines, short bullets, one idea per slide. Emphasize the highlight features and the journey→call→lead moat.”

Suggested slide count: **14 slides** (outline at the end).

---

## 1. One-line pitch

**Ruhana turns any website into a live AI sales floor** — a talking, lipsynced avatar that greets visitors, answers product questions, captures leads, and shows the full path from page view to purchase intent.

---

## 2. Problem (why this exists)

Website visitors still bounce without talking to anyone.

| Pain | Reality today |
|---|---|
| Chat widgets feel robotic | Text bots, delayed replies, no presence |
| Sales teams can’t be on every page | Pricing, comparison, and checkout pages go unassisted |
| Analytics and sales are disconnected | GA shows clicks; CRM shows leads; nobody sees the chain |
| “What made them convert?” is a guess | No link between browsing journey and the conversation |

**The gap:** tools either *talk* (chat) or *track* (analytics). Almost none do both as one product — and almost none do it with a **real-time video avatar**.

---

## 3. Solution (what Ruhana is)

Ruhana is a **website-native AI sales agent** that:

1. Embeds on the client’s site with **one script tag**  
2. Appears as a **live voice + video avatar** (not a chat bubble)  
3. Knows the **business** (website crawl + knowledge uploads)  
4. Knows the **visitor journey** (pages, clicks, time on page)  
5. Opens **proactively** at high-intent moments (e.g. pricing for 15 seconds)  
6. Captures **leads** and scores outcomes after every call  
7. Shows operators a **dashboard** with conversations, funnels, and journey timelines  

**Category:** AI sales avatar + first-party journey analytics + conversion dashboard.

---

## 4. Highlight features (lead with these on slides)

These are the **must-show** differentiators. Put them early in the deck.

### H1 — Live talking avatar (not a chatbot)
- Real-time WebRTC video face with lipsync  
- Two-way voice: visitor speaks → agent hears → agent replies aloud  
- Feels like a human sales concierge on the site  

### H2 — One-line install
- Single `<script>` embed (same class of injection as analytics tags)  
- Works on any site; iframe-isolated so it doesn’t break client CSS  

### H3 — Journey-aware conversations (the moat)
- Tracks page views, clicks, scroll, time on page  
- On open (manual *or* auto), avatar greets using recent browsing  
- Example: visitor browsed Features → clicked “Pro” → Pricing → avatar: *“I can help you compare plans…”*  
- Mid-call, avatar still knows the **current page** if they navigate  

### H4 — Proactive triggers
- Rules such as: URL contains `/pricing` + 12s → auto-open  
- Exit-intent and time-on-page supported in the product design  
- Guardrails: max one auto-open per visit, cooldown, never spam  

### H5 — Journey → Call → Lead in one chain
- Every conversation can show:  
  `Landed → /features 42s → clicked “Pro” → /pricing → auto-open → call → Lead captured`  
- Competitors usually show only the transcript **or** only analytics — not the joined story  

### H6 — Operator dashboard that proves ROI
- Live visitors, top pages, click ranking, conversion funnel  
- Conversations with transcript, outcome, lead score, captured email  
- Business impact: conversations, outcomes, result rate, connected minutes  

### H7 — Business-trained brain
- Crawl the client website → business profile  
- Upload knowledge (docs, FAQs, product sheets)  
- Agent answers with company context, tone, and instructions set by the operator  

---

## 5. Complete product feature map (in depth)

### A. Agent creation & management
| Feature | What it does |
|---|---|
| Agent builder (4 steps) | Website & goal → Look & voice → Knowledge & behavior → Widget & launch |
| Website scan | Firecrawl crawl → AI business profile for the agent to sell from |
| Avatar library | Ready-made faces (stock Anam avatars) |
| Custom photo avatar | Upload a portrait → create a talking avatar via Anam |
| Voice picker | Real Anam voices with preview samples |
| Configure tab | Name, role, greeting, tone, response length, language, instructions |
| Knowledge tab | Upload files; extracted text feeds the brain |
| Actions tab | Lead capture, product recommend, checkout guide, handoff, tickets (toggles) |
| Pause / resume / delete | Full agent lifecycle from the dashboard |
| Drafts | Local drafts while building; publish to live DB agents |

### B. Website widget (customer-facing USP)
| Feature | What it does |
|---|---|
| Floating launcher | “Talk to {Agent}” with avatar thumbnail |
| Voice-only panel | Live video avatar; no chat clutter in the widget |
| Session starts on open | Credits only used when the visitor engages |
| Greeting on connect | Speaks welcome (static, trigger-based, or journey-based) |
| Lead capture in conversation | Email (and name when spoken) saved to leads |
| Soft close / end call | Ends stream; runs post-call analysis |
| Install check | Dashboard can verify the script is on the client site |

### C. Live visitor analytics (built into the same embed)
| Feature | What it does |
|---|---|
| First-party tracking | Runs on client domain like GA |
| Events | `page_view`, `click`, `scroll`, `page_time`, `widget_open/close`, `trigger_*` |
| SPA support | Tracks React/Vue route changes without full reload |
| Privacy-safe clicks | Only button/link labels — never passwords or form fields |
| Batched ingest | Queue + flush (~5s) + sendBeacon on leave |
| Direct pass for latency | Recent events sent to avatar on open (no wait on DB) |
| Visitor identity | Anonymous `localStorage` id per browser per agent |

### D. Proactive engagement
| Feature | What it does |
|---|---|
| Trigger types | URL contains, time on page, scroll depth, exit intent |
| Configurable rules | Per agent: delay, greeting hint, cooldown |
| Contextual greeting | LLM writes a short spoken open line from trigger + journey |
| Live page context | During a call, brain knows current URL/path |

### E. Conversations & outcomes
| Feature | What it does |
|---|---|
| Full transcript | Every user/agent turn stored |
| Post-call analysis | Outcome (lead / booked / open), lead score 0–100, summary |
| Conversations hub | Search, filter by agent/outcome/date, detail pane |
| Lead record | Email (+ name when available) linked to session |
| Export | CSV of conversation list |

### F. Analytics dashboard
| Feature | What it does |
|---|---|
| Overview KPIs | Revenue proxy / outcomes / conversations / connected time |
| Trends | Period charts (7d / 30d / 90d) |
| Funnel | Visitors → engagement → widget opens → calls → leads |
| Top pages | Which URLs drive opens and outcomes |
| Click ranking | What visitors click most before talking |
| Live now | Who’s on the site (near-real-time poll) |
| Usage | Minutes, concurrency, plan allowance views |
| Agent comparison | Performance by agent |

### G. Platform & ops
| Feature | What it does |
|---|---|
| Multi-agent workspace | One dashboard for all site agents |
| Websites / integrations / billing / settings | Product shell for go-to-market |
| Test agent (dashboard) | Private live voice call to QA before launch |
| Stack | Next.js, Supabase, Anam (avatar), OpenAI (brain), Firecrawl (ingest) |

---

## 6. Demo narrative (use for a product video slide)

**30-second story to show on a slide or live demo:**

1. Visitor lands on a client site with Ruhana installed  
2. Browses `/features`, clicks “Pro plan”, lands on `/pricing`  
3. After ~12 seconds, avatar **auto-opens** and greets about pricing  
4. Visitor asks about price → avatar answers from crawled knowledge  
5. Visitor shares email → lead captured  
6. Operator opens dashboard → sees journey timeline + transcript + “Lead” + score  

**Punchline:** *From anonymous browser to qualified lead — with proof of every step.*

---

## 7. Competitive framing (for a “Why us” slide)

| | Chat widgets | Classic analytics | Ruhana |
|---|---|---|---|
| Presence | Text / chat | None | Live video avatar |
| Voice | Rare | No | Yes |
| Knows business | FAQ bots | No | Crawl + knowledge |
| Knows journey | Weak / none | Yes (no sales) | Yes + sells with it |
| Proactive open | Popups | N/A | Intent-based avatar open |
| Proof of conversion | Partial | Partial | Journey → call → lead chain |

**Positioning line:**  
*Chatbots answer. Analytics observe. Ruhana does both — and closes.*

---

## 8. Who it’s for

- Ecommerce & SaaS sites with high pricing / comparison traffic  
- Teams that want 24/7 sales presence without hiring overnight staff  
- Founders who need a **wow demo** (investor, launch, sales call)  
- Growth teams that need attribution from page behavior to lead  

---

## 9. Business value (ROI bullets for slides)

- Convert high-intent pages (pricing, compare, checkout) that usually bounce  
- Capture leads without forms (spoken email in a natural conversation)  
- Reduce “what happened?” support/sales handoff with full transcripts  
- Prove which pages and clicks create revenue-adjacent outcomes  
- One install = sales agent + analytics + CRM-ready lead trail  

---

## 10. Trust & product principles (optional slide)

- No keystroke or password capture — only interactive click labels  
- One proactive open per visit; dismissed = don’t reopen  
- Session starts when the visitor opens (or trigger fires) — not on every page load  
- Avatar greets from in-memory journey for low latency; DB stores history for analytics  

---

## 11. Suggested Pitch.com slide outline (14 slides)

| # | Slide title | Content to pull from this doc |
|---|---|---|
| 1 | Title | Ruhana + one-line pitch |
| 2 | The problem | Section 2 table |
| 3 | The insight | Chat *or* analytics → we do both with a face |
| 4 | The product | Section 3 solution bullets |
| 5 | Highlight: Live avatar | H1 |
| 6 | Highlight: Journey-aware sales | H3 + demo beat |
| 7 | Highlight: Proactive triggers | H4 |
| 8 | Highlight: Proof chain | H5 journey → call → lead |
| 9 | How it works | Install → track → talk → analyze → dashboard |
| 10 | Operator dashboard | H6 + analytics feature map |
| 11 | Build & deploy agents | Agent builder features |
| 12 | Competitive contrast | Section 7 |
| 13 | Who it’s for + ROI | Sections 8–9 |
| 14 | Ask / next step | Demo, pilot, or funding ask (fill in) |

---

## 12. Short copy blocks (paste-ready headlines)

- **Hero:** Your website’s AI salesperson — live, voice-first, journey-aware.  
- **Subhead:** One script. A talking avatar. Full proof from page view to lead.  
- **Moat:** Journey → Call → Lead — the chain no chatbot shows you.  
- **Install:** Paste one tag. Ship a sales floor.  
- **Proactive:** Open on pricing. Speak to intent. Don’t wait for a click.  
- **Dashboard:** See who’s live, what they clicked, and what closed.  

---

## 13. Visual / media notes for the deck

Recommend Pitch include:

1. Screenshot of the floating “Talk to …” launcher on a client site  
2. Live avatar video frame (or short loop) in the widget panel  
3. Dashboard conversations detail with transcript + outcome  
4. Funnel graphic: Visitors → Opens → Calls → Leads  
5. Journey timeline graphic tied to one conversation  
6. Simple architecture: Embed → Avatar/Brain → Supabase → Dashboard  

Avoid overcrowding slides with API names; keep tech stack to one optional appendix slide: **Anam · OpenAI · Firecrawl · Supabase · Next.js**.

---

## 14. Appendix — tech one-liner (optional last slide)

Ruhana is a Next.js product: Anam powers the real-time avatar, OpenAI powers conversational intelligence, Firecrawl builds business context from the client site, and Supabase stores sessions, journeys, leads, and analytics — all activated by a first-party embed script on the customer’s website.

---

*Document generated for Pitch.com deck creation from the live Ruhana product (agents, widget, conversations, analytics plan / journey tracking, proactive triggers).*
