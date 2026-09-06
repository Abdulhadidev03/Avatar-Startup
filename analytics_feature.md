# Feature Spec: Live Visitor Analytics + Proactive Avatar Triggers

*How it's possible: our embed script (`/api/embed/[agentId]`) already runs first-party inside the client's page — the exact same position Google Analytics runs from. It can see every URL, click, and scroll, and it already owns the widget open/close logic. So tracking + proactive opening is an extension of the loader we already ship, not a new product.*

## What we're adding (3 capabilities)

1. **Journey tracking** — page views, clicks, scroll depth, time on page, per visitor, on any site that embeds our one script tag. Like GA, but ours.
2. **Proactive triggers** — rules like "visitor has been on /pricing for 15s → auto-open the widget and the avatar speaks a contextual line." Plus: during a call, the avatar always knows which page the visitor is on right now.
3. **Dashboard analytics** — live visitors, top pages, click ranking, funnel (visitors → widget opens → calls → leads), and the killer view: the full journey timeline attached to every conversation ("visited /features → clicked Pro plan → talked to avatar → lead captured").

**Also required (not optional):** when the visitor opens the avatar *manually* after browsing, the greeting must still use their recent journey — not only when a trigger auto-opens. See §5 session greeting + §9.

**Latency rule (preferred):** do **not** make the avatar wait on “write to DB → read from DB” for the first greeting. Pass `recentEvents` directly in `WIDGET_START` (in-memory). Still flush to `/api/track` in the background for the dashboard. Session + brain use the passed events first; DB is fallback / analytics. See §3 + §5 + §9.

---

## 1. Database migration (run in Supabase SQL Editor)

```sql
-- Visitors: one row per browser per agent (identified by a first-party localStorage id)
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,                 -- value stored in localStorage on the client site
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  referrer TEXT,
  user_agent TEXT,
  UNIQUE (agent_id, anon_id)
);

-- The event stream (this is the analytics gold mine)
CREATE TABLE IF NOT EXISTS visitor_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  visit_id TEXT,                          -- per-tab-session id (groups one browsing session)
  type TEXT NOT NULL,                     -- page_view | click | scroll | page_time |
                                          -- widget_open | widget_close | trigger_fired | trigger_dismissed
  url TEXT,
  path TEXT,
  meta JSONB DEFAULT '{}',                -- click: {tag,text,href} · scroll: {depth} · page_time: {seconds}
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ve_agent_time ON visitor_events (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ve_visitor ON visitor_events (visitor_id, created_at);

-- Connect calls to journeys (THE moat: journey → conversation → sale in one chain)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS visitor_id UUID REFERENCES visitors(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS trigger_context JSONB;

-- Proactive trigger rules, configurable per agent from the dashboard
CREATE TABLE IF NOT EXISTS agent_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  type TEXT NOT NULL,                     -- url_contains | time_on_page | scroll_depth | exit_intent
  value TEXT,                             -- '/pricing' | '15' (seconds) | '75' (percent)
  delay_seconds INT NOT NULL DEFAULT 0,
  greeting_hint TEXT,                     -- e.g. 'Visitor is reading the pricing page — offer to help compare plans'
  cooldown_hours INT NOT NULL DEFAULT 24, -- don't re-fire on the same visitor within this window
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE agent_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on agent_triggers" ON agent_triggers FOR ALL USING (true) WITH CHECK (true);
```

Seed one default trigger per agent so the demo works out of the box:

```sql
INSERT INTO agent_triggers (agent_id, type, value, delay_seconds, greeting_hint)
SELECT id, 'url_contains', '/pricing', 12,
  'The visitor has been reading the pricing page — greet them by offering to help pick the right plan.'
FROM agents;
```

---

## 2. The tracking module (add to the loader in `src/app/api/embed/[agentId]/route.ts`)

Add this INSIDE the existing IIFE, same ES5 style. It's ~120 lines and it's the whole "Google-style tracking" story.

```js
  // ═══ ANALYTICS ═══════════════════════════════════════════════════════════

  // -- identity: first-party ids (we run on the client's domain, like GA) --
  function uuid() { return (crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&0x3|0x8)).toString(16);}); }
  var VID; try { VID = localStorage.getItem('rhn_vid') || uuid(); localStorage.setItem('rhn_vid', VID); } catch(e) { VID = uuid(); }
  var VISIT; try { VISIT = sessionStorage.getItem('rhn_visit') || uuid(); sessionStorage.setItem('rhn_visit', VISIT); } catch(e) { VISIT = uuid(); }

  // -- event queue with batching --
  var queue = [];
  var recent = [];                         // ring of last N events — SURVIVES flush (for avatar)
  function track(type, meta) {
    var ev = { type: type, url: location.href, path: location.pathname,
               meta: meta || {}, ts: Date.now() };
    queue.push(ev);
    recent.push(ev);
    if (recent.length > 20) recent.shift(); // keep last 20 for direct pass to avatar
    if (queue.length >= 10) flush(false);
  }
  function flush(useBeacon) {
    if (!queue.length) return;
    var payload = JSON.stringify({
      agentId: AGENT_ID, visitorId: VID, visitId: VISIT,
      referrer: document.referrer || null, events: queue.splice(0, 50)
    });
    // text/plain avoids a CORS preflight; sendBeacon survives page unload
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ORIGIN + '/api/track', new Blob([payload], {type: 'text/plain'}));
    } else {
      fetch(ORIGIN + '/api/track', { method: 'POST', keepalive: true,
        headers: {'Content-Type': 'text/plain'}, body: payload }).catch(function(){});
    }
  }
  setInterval(function(){ flush(false); }, 5000);
  addEventListener('pagehide', function(){ track('page_time', {seconds: Math.round((Date.now()-pageStart)/1000)}); flush(true); });

  // -- page views (incl. SPA navigation: React/Vue sites don't reload) --
  var pageStart = Date.now();
  var lastPath = location.pathname;
  function onNav() {
    if (location.pathname === lastPath) return;
    track('page_time', { seconds: Math.round((Date.now() - pageStart) / 1000), path: lastPath });
    lastPath = location.pathname; pageStart = Date.now(); scrollMarks = {};
    track('page_view', {});
    onPageChanged();                       // feeds the trigger engine + live call context (below)
  }
  var _push = history.pushState;    history.pushState    = function(){ _push.apply(this, arguments); onNav(); };
  var _repl = history.replaceState; history.replaceState = function(){ _repl.apply(this, arguments); onNav(); };
  addEventListener('popstate', onNav);
  track('page_view', {});                  // the initial one

  // -- clicks: interactive elements only, NEVER form values/keystrokes --
  addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest
      ? ev.target.closest('a,button,[role=button],input[type=submit],[data-rhn-track]') : null;
    if (!el) return;
    track('click', {
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.value || '').trim().slice(0, 60),
      href: el.getAttribute && el.getAttribute('href') || null,
      id: el.id || null
    });
  }, true);

  // -- scroll depth milestones --
  var scrollMarks = {};
  addEventListener('scroll', function () {
    var h = document.documentElement;
    var depth = Math.round((h.scrollTop + innerHeight) / h.scrollHeight * 100);
    [25, 50, 75, 100].forEach(function (m) {
      if (depth >= m && !scrollMarks[m]) { scrollMarks[m] = 1; track('scroll', { depth: m }); }
    });
  }, { passive: true });

  if (navigator.webdriver) queue = { push: function(){}, length: 0, splice: function(){return [];} }; // ignore bots
```

And hook the widget events into the existing `toggle()`:

```js
  // inside toggle(): after `open = !open;`
  track(open ? 'widget_open' : 'widget_close', { auto: false });
```

---

## 3. The trigger engine (also in the loader — "bot opens by itself on the pricing page")

```js
  // ═══ PROACTIVE TRIGGERS ══════════════════════════════════════════════════
  var TRIGGERS = [];
  var triggerFiredThisVisit = false;      // max ONE auto-open per visit (never be annoying)
  var userDismissed = false;              // if they close an auto-open, never re-open

  fetch(ORIGIN + '/api/agents/' + AGENT_ID + '/triggers')
    .then(function(r){ return r.json(); })
    .then(function(d){ TRIGGERS = d.triggers || []; armTriggers(); })
    .catch(function(){});

  function canFire(t) {
    if (triggerFiredThisVisit || userDismissed || open) return false;
    try {                                  // cooldown per visitor per trigger
      var k = 'rhn_trg_' + t.id, last = +(localStorage.getItem(k) || 0);
      if (Date.now() - last < (t.cooldown_hours || 24) * 3600000) return false;
    } catch(e) {}
    return true;
  }

  function fire(t) {
    triggerFiredThisVisit = true;
    try { localStorage.setItem('rhn_trg_' + t.id, String(Date.now())); } catch(e) {}
    track('trigger_fired', { triggerId: t.id, type: t.type, path: location.pathname });
    pendingTrigger = {                     // picked up by WIDGET_START postMessage
      type: t.type, greetingHint: t.greeting_hint || null,
      path: location.pathname, timeOnPage: Math.round((Date.now() - pageStart) / 1000)
    };
    if (!open) toggle();                   // reuse the existing open logic
  }

  var timers = [];
  function armTriggers() {
    timers.forEach(clearTimeout); timers = [];
    TRIGGERS.forEach(function (t) {
      if (!t.enabled || !canFire(t)) return;
      if (t.type === 'url_contains' && location.pathname.indexOf(t.value) !== -1)
        timers.push(setTimeout(function(){ if (canFire(t) && location.pathname.indexOf(t.value) !== -1) fire(t); }, (t.delay_seconds || 10) * 1000));
      if (t.type === 'time_on_page')
        timers.push(setTimeout(function(){ if (canFire(t)) fire(t); }, (parseInt(t.value,10) || 30) * 1000));
    });
  }
  document.addEventListener('mouseout', function (ev) {   // exit_intent
    if (ev.clientY > 8 || ev.relatedTarget) return;
    var t = TRIGGERS.find(function(x){ return x.enabled && x.type === 'exit_intent'; });
    if (t && canFire(t)) fire(t);
  });
  function onPageChanged() { armTriggers(); /* re-evaluate rules on SPA nav */
    if (open && iframeLoaded) panel.contentWindow.postMessage(   // live context mid-call
      { type: 'PAGE_CONTEXT', path: location.pathname, url: location.href }, ORIGIN);
  }
```

Wire `pendingTrigger` + `visitorId` + **`recentEvents`** into the existing WIDGET_START postMessage (both places it's sent).

### Preferred: direct pass (low latency) + background flush (analytics)

Do **not** block the avatar on DB write/read for the greeting.

```
Click avatar
  → WIDGET_START { visitorId, trigger, recentEvents }   ← instant (memory)
  → flush() in background                                 ← DB for dashboard
  → /api/session uses recentEvents first                  ← greeting, no wait
  → /api/brain later also gets recentEvents from widget   ← still timely
```

`recent` is a separate ring from `queue`. `flush()` empties `queue` for `/api/track`, but `recent` keeps the last ~20 events so the avatar always has a journey snapshot even if the queue was just flushed.

```js
  // Background save for dashboard — do NOT await for greeting
  flush(false);

  panel.contentWindow.postMessage({
    type: 'WIDGET_START',
    pageUrl: window.location.href,
    visitorId: VID,
    trigger: pendingTrigger || null,
    // Direct pass — avatar/session/brain use THIS, not a DB round-trip
    recentEvents: recent.slice(-15)
  }, ORIGIN);
  pendingTrigger = null;
```

And in the close path: if the user closes an auto-opened widget → `userDismissed = true; track('trigger_dismissed', {})`.

New tiny route: `GET /api/agents/[agentId]/triggers` → `SELECT * FROM agent_triggers WHERE agent_id = ... AND enabled` → `{ triggers }`, CORS `*` like the embed route.

---

## 4. Ingestion route — `src/app/api/track/route.ts` (new)

```ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: Request) {
  try {
    // sendBeacon posts text/plain — parse manually
    const body = JSON.parse(await req.text());
    const { agentId, visitorId, visitId, referrer, events } = body;
    if (!agentId || !visitorId || !Array.isArray(events) || events.length === 0)
      return NextResponse.json({ ok: false }, { status: 400, headers: CORS });

    // upsert the visitor (keyed on agent + anon id)
    const { data: visitor } = await supabaseAdmin
      .from("visitors")
      .upsert(
        { agent_id: agentId, anon_id: visitorId, last_seen_at: new Date().toISOString(),
          referrer: referrer ?? null, user_agent: req.headers.get("user-agent") ?? null },
        { onConflict: "agent_id,anon_id" },
      )
      .select("id").single();
    if (!visitor) return NextResponse.json({ ok: false }, { status: 400, headers: CORS });

    const ALLOWED = new Set(["page_view","click","scroll","page_time","widget_open","widget_close","trigger_fired","trigger_dismissed"]);
    const rows = events.slice(0, 50)
      .filter((e: any) => ALLOWED.has(e.type))
      .map((e: any) => ({
        agent_id: agentId, visitor_id: visitor.id, visit_id: visitId ?? null,
        type: e.type, url: (e.url ?? "").slice(0, 500), path: (e.path ?? "").slice(0, 300),
        meta: e.meta ?? {},
      }));
    if (rows.length) await supabaseAdmin.from("visitor_events").insert(rows);

    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: CORS });
  }
}
```

---

## 5. The avatar gets context (widget + session + brain changes)

### Dual path (do both)

| Path | Purpose | Latency |
|---|---|---|
| **`recentEvents` in `WIDGET_START`** | Greeting + brain context for *this* call | Instant (same browser → iframe → API body) |
| **`/api/track` → Supabase** | Dashboard, funnels, journey timeline, cross-visit | Background (batched / on open flush) |

**Greeting and brain prefer `recentEvents`. DB is fallback only** (e.g. if postMessage lost the array, or you need older history than the ring holds).

### `src/app/widget/[agentId]/page.tsx`

- In the `WIDGET_START` handler: read `ev.data.visitorId`, `ev.data.trigger`, and **`ev.data.recentEvents`**. Keep all three in refs.
- Add a `PAGE_CONTEXT` message handler → `currentPathRef.current = ev.data.path` (works mid-call on SPA sites).
- In `startCall`: include `visitorId`, `trigger`, and **`recentEvents`** in the `/api/session` body.
- In both `/api/brain` fetches: add `pageContext: currentPathRef.current` **and `recentEvents: recentEventsRef.current`** so brain never depends on a fresh DB read for this call.
- On `SESSION_READY`: speak `greeting` **returned by `/api/session`** instead of the static `greetingRef`.

```ts
// sketch
const recentEventsRef = useRef<any[]>([]);

// in WIDGET_START handler:
recentEventsRef.current = Array.isArray(ev.data.recentEvents) ? ev.data.recentEvents : [];

// startCall body:
JSON.stringify({
  agentId, pageUrl, orientation: "portrait",
  visitorId, trigger,
  recentEvents: recentEventsRef.current,
})

// brain body:
JSON.stringify({
  sessionId: sid, userText: text,
  pageContext: currentPathRef.current,
  recentEvents: recentEventsRef.current,
})
```

### `src/app/api/session/route.ts`

- Accept `visitorId` + `trigger` + **`recentEvents`**. Resolve `visitors.id` from `(agent_id, anon_id=visitorId)` and store `visitor_id` + `trigger_context` on the session row. Optionally also persist a short `journey_snapshot` (from `recentEvents`) on `trigger_context` so brain can fall back without the client re-sending.
- Contextual greeting for **both** proactive opens **and** manual clicks.

#### Journey-aware greeting (prefer direct pass)

**Target behavior:** visitor spends 10s on `/features`, clicks “Pro plan”, goes to `/pricing` for 5s, then clicks the launcher → avatar greets using that journey immediately — without waiting for track→DB→read.

```ts
let greeting = agentDefaultGreeting;

function formatJourney(events: Array<{ type: string; path: string | null; meta: any }>) {
  return events
    .slice()
    .reverse()
    .map((e) => {
      if (e.type === "click") return `clicked "${e.meta?.text || e.meta?.href || "a button"}" on ${e.path}`;
      if (e.type === "page_view") return `viewed ${e.path}`;
      if (e.type === "page_time") return `${e.path} (${e.meta?.seconds ?? "?"}s)`;
      return null;
    })
    .filter(Boolean)
    .slice(0, 8)
    .join(" → ");
}

// 1) PREFERRED: events passed from the loader (no DB round-trip)
let journeyLine = "";
if (Array.isArray(recentEvents) && recentEvents.length) {
  journeyLine = formatJourney(recentEvents);
}

// 2) FALLBACK: DB only if client didn't send recentEvents
if (!journeyLine && visitorRowId) {
  const { data: recent } = await supabaseAdmin
    .from("visitor_events")
    .select("type, path, meta, created_at")
    .eq("visitor_id", visitorRowId)
    .order("created_at", { ascending: false })
    .limit(12);
  journeyLine = formatJourney(recent ?? []);
}

if (trigger?.greetingHint) {
  const g = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 60,
    messages: [{ role: "user", content:
      `Write ONE short, warm spoken opening line (max 25 words) for a website sales avatar that just proactively opened. Context: ${trigger.greetingHint}. Visitor is on ${trigger.path} and has been there ${trigger.timeOnPage}s.${journeyLine ? ` Recent journey: ${journeyLine}.` : ""} No markdown, no quotes.` }],
  });
  greeting = g.choices[0]?.message?.content?.trim() || greeting;
} else if (journeyLine) {
  // Manual open — greet from browsing history (direct pass or DB fallback)
  const g = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 60,
    messages: [{ role: "user", content:
      `Write ONE short, warm spoken opening line (max 25 words) for a website sales avatar. The visitor just opened the chat themselves. Use their recent browsing to sound helpful, not creepy. Recent journey: ${journeyLine}. Current page: ${pageUrl || "unknown"}. No markdown, no quotes.` }],
  });
  greeting = g.choices[0]?.message?.content?.trim() || greeting;
}
// save first assistant turn + return { sessionToken, sessionId, greeting }
```

Notes:
- OpenAI still runs during Anam connect, so latency is mostly hidden.
- No `visitorId` / no events → fall back to `agentDefaultGreeting`.
- Tone: “helpful, not creepy.”

### `src/app/api/brain/route.ts`

- Accept optional `pageContext` and optional **`recentEvents`**.
- Prefer `recentEvents` from the request body (same format as session). Format with the same `formatJourney` helper and append to the system prompt.
- If `recentEvents` is missing/empty, fall back to fetching last ~10 `visitor_events` via the session’s `visitor_id` (or the snapshot stored on `trigger_context`).
- Also append live page:
  `\n\nLIVE CONTEXT: The visitor is currently viewing ${pageContext} on the website. If relevant, reference what they're looking at.`
- Example journey line: `Their recent journey: /features (42s) → clicked "Pro plan" → /pricing.` → avatar can say *"I saw you were comparing plans — the Pro one you clicked covers that."*

```ts
// Prefer direct pass from widget; DB only as fallback
let journeyLine = Array.isArray(recentEvents) && recentEvents.length
  ? formatJourney(recentEvents)
  : ""; // else load from session.visitor_id / trigger_context as before

if (journeyLine) {
  system += `\n\nTheir recent journey: ${journeyLine}`;
}
if (pageContext) {
  system += `\n\nLIVE CONTEXT: The visitor is currently viewing ${pageContext} on the website. If relevant, reference what they're looking at.`;
}
```

So: **brain still “reads” the journey** — but usually from the payload the widget already has, not from a slow DB hop on every turn.

---

## 6. Dashboard (per-client analytics views)

New endpoints (same aggregation style as the existing `GET /api/analytics`):

| Endpoint | Returns | Powers |
|---|---|---|
| `GET /api/analytics/live?agentId` | distinct visitors with events in last 5 min: current path, seconds on site, in-call flag | "Live now" panel (poll every 10s — no websockets needed) |
| `GET /api/analytics/pages?agentId&period` | per path: views, avg time, widget-open rate, calls started, leads | "Top pages" table — shows WHICH pages sell |
| `GET /api/analytics/clicks?agentId&period` | top clicked `{text, href}` by count | GA-style click ranking |
| `GET /api/analytics/funnel?agentId&period` | visitors → page_views → widget_opens (split auto/manual) → calls → leads | The funnel chart + "trigger effectiveness" (auto-opens that became calls) |
| `GET /api/visitors/[id]/journey` | ordered `visitor_events` + sessions for that visitor | Journey timeline |

The **killer dashboard moment**: on the conversation detail page, query `sessions.visitor_id` → render the journey timeline ABOVE the transcript: `Landed on / (Google) → /features 42s → clicked "Pro plan" → /pricing 15s → ⚡ auto-opened → call 3:12 → ✅ Lead captured`. No competitor shows this chain.

Also add a **Triggers tab** on the agent workspace page: list/add/edit `agent_triggers` rows (type dropdown, value, delay, greeting hint, enabled toggle) — plain CRUD against a new `/api/agents/[agentId]/triggers` GET/POST/PUT.

---

## 7. Rules so this stays classy (and legal)

- **Never** record keystrokes, form field values, or passwords — only clicks on links/buttons with truncated label text. It's in the code above; keep it that way.
- Max **one** auto-open per visit; a dismissed auto-open never re-fires; 24h cooldown per trigger per visitor. An avatar that pops up twice is a conversion killer.
- The `rhn_vid` localStorage id is a tracking identifier → EU visitors need the client site's cookie-consent to cover it. MVP: note it in client docs; later: a `data-rhn-consent` attribute that delays tracking until the host signals consent.
- Full page reloads on classic multi-page sites will kill a live call (iframe unmounts). SPA sites are fine. Known limitation for now — the resume-token fix is post-funding work.
- Bot traffic: `navigator.webdriver` check is in; add IP rate limiting on `/api/track` before real clients.

## 8. Build order (≈ 3–4 days)

| Day | Ship |
|---|---|
| 1 | Migration SQL + `/api/track` + tracking module (`queue` + **`recent` ring**) in the loader. Verify events land in Supabase from the fake client site. |
| 2 | Trigger engine + `/triggers` + `WIDGET_START` with **`recentEvents`** + session/brain prefer direct pass (DB fallback) + manual + trigger greetings. Demo A: /pricing 12s → auto-open. Demo B: browse → **manual** open → greeting uses passed journey with no DB wait. |
| 3 | `visitor_id` on sessions + journey timeline on conversation detail page. |
| 4 | Analytics endpoints + Live/Pages/Funnel dashboard views + Triggers CRUD tab. |

---

## 9. Spec fixes (do not skip)

These gaps were identified after reviewing the manual-open + latency case. Build them into Day 1–2 — they are not optional polish.

| Fix | Problem without it | Solution |
|---|---|---|
| **`recent` ring + `recentEvents` in `WIDGET_START`** | Avatar waits on track→DB→read; flush empties `queue` so in-memory journey is lost | Keep last ~20 events in `recent`; pass `recentEvents: recent.slice(-15)` on open; session/brain use that first |
| **Background flush on open** | Dashboard missing the last clicks of the visit | Call `flush(false)` on open **without awaiting** it for the greeting |
| **Journey greeting on manual open** | Only proactive triggers got a smart hello | Session greets from `recentEvents` (or DB fallback) even when `trigger` is null |
| **Brain gets `recentEvents` too** | Brain would re-query DB every turn and could lag | Widget sends `recentEvents` on every `/api/brain` call; DB only if missing |
| **Same visitor id on every open** | Journey and call stay disconnected | Always send `visitorId: VID` in `WIDGET_START` (manual and auto) |
