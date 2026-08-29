
# BE-1 Plan (Founder) — Anam Integration: Make the Avatar Talk

**Your mission:** the call itself. Visitor clicks → avatar appears → avatar hears them → your code fetches the reply from `/api/brain` → avatar speaks it with lipsync. You are the riskiest lane, so you start Day 1 hour 1, and if you're stuck by Day 2 evening, pull BE-2 in.

**Golden rule:** you treat `/api/brain` as a black box. Text in → text out. You never touch Claude. While BE-2 builds the real brain, you test against a dummy brain that replies `"echo: " + userText`.

## What you need on Day 1

- Anam account → **paid tier (~$49) to remove the watermark** — non-negotiable for an investor demo
- In the Anam dashboard: create the avatar (upload a photo → one-shot avatar), pick a voice → note the `avatarId` + `voiceId`
- `ANAM_API_KEY` → into `.env.local` + Vercel
- `npm install @anam-ai/js-sdk`
- Their docs open in a tab: **docs.anam.ai** → follow the "Custom LLM" example. Exact method/event names below are from their docs — if anything differs, THEIR current docs win.

## How the whole thing works (the mental model)

```
Browser (widget)                    Your Next.js API              Anam cloud
1. click → POST /api/session  ───────────────►  creates session row,
                                                asks Anam for a token
   ◄─────────  { sessionToken, sessionId }  ◄──┘
2. anamClient = createClient(sessionToken)
3. stream avatar video into the <video> tag   ◄──────────────────  WebRTC video/audio
4. visitor speaks → Anam transcribes  ◄──────────────────────────  (Anam's ears)
5. transcript event fires → you POST /api/brain { sessionId, userText }
6. brain returns { replyText }
7. anamClient.talk(replyText)  ──────────────────────────────────► avatar speaks it, lips synced
```

Steps 5–7 repeat for every conversation turn. That's the entire integration.

## Build it in easy steps

### Step 1 — `/api/session` route (half a day)

```ts
// app/api/session/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // server-only key
);

export async function POST(req: Request) {
  const { pageUrl } = await req.json();

  // 1. our own session row (the DB id everything else hangs off)
  const { data: session, error } = await supabase
    .from("sessions").insert({ page_url: pageUrl }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. ask Anam for a browser-safe session token
  //    (personaConfig shape: copy from docs.anam.ai custom-LLM example.
  //     llmId "CUSTOMER_CLIENT_V1" = "my own code supplies the replies")
  const r = await fetch("https://api.anam.ai/v1/auth/session-token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.ANAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personaConfig: {
        name: "Sarah",
        avatarId: "YOUR_AVATAR_ID",
        voiceId: "YOUR_VOICE_ID",
        llmId: "CUSTOMER_CLIENT_V1",
      },
    }),
  });
  const { sessionToken } = await r.json();

  return NextResponse.json({ sessionToken, sessionId: session.id });
}
```

Why this exists: the `ANAM_API_KEY` must NEVER reach the browser. The browser only ever gets the short-lived `sessionToken`.

### Step 2 — connect the browser (Day 1–2)

This code lives inside the FE dev's widget component — you write the logic, they own the styling. Agree on the callback names Day 1.

```ts
import { createClient, AnamEvent } from "@anam-ai/js-sdk";

async function startCall() {           // MUST be called from a click handler (browser mic rule)
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pageUrl: window.location.href }),
  });
  const { sessionToken, sessionId } = await res.json();

  const anam = createClient(sessionToken);
  await anam.streamToVideoElement("avatar-video");   // FE's <video id="avatar-video">

  // Every time the visitor finishes saying something:
  anam.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (messages) => {
    const last = messages[messages.length - 1];
    if (last?.role !== "user") return;               // only react to the VISITOR's turns

    const r = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userText: last.content }),
    });
    const { replyText, leadCaptured } = await r.json();

    anam.talk(replyText);                            // avatar speaks it, lipsynced
    if (leadCaptured) showLeadToast();               // FE's callback
    showCaption(replyText);                          // FE's callback
  });

  return { anam, sessionId };
}
```

Test it Day 2 with the echo brain: you say "hello", avatar says "echo: hello". If that works, your lane is basically done.

### Step 3 — greeting + hang-up (Day 3)

- **Greeting:** right after connecting, call `anam.talk("Hey! I'm Sarah from FlowDesk — what brings you here today?")` so the avatar speaks first. (Also save this as an assistant turn via a small insert or let BE-2's brain log it.)
- **Hang-up:** on the widget's end button (or tab close): stop the Anam client, then
  `POST /api/analyze { sessionId }` and update the session row to `status: 'ended', ended_at: now()`. Easiest: do both inside `/api/analyze` — tell BE-2, it's their route.

### Step 4 — latency + demo hardening (Day 4–5)

- Time the loop: user stops talking → avatar starts answering. Target under ~2s for the demo. If slow, the fix is almost always in the brain call (tell BE-2 to shorten the prompt/reply length).
- **Echo trap:** laptop speakers make the avatar hear itself. Demo with an external mic/headphones, and test in a quiet room. This is the #1 live-demo killer.
- Test on: Chrome (demo machine), Safari, and one phone. Mic permission must be requested from the click.
- Kill switch: max 10-min session — just end the call client-side on a timer (every minute costs money).

## Your day-by-day

| Day | You ship |
|---|---|
| 1 | Anam account + avatar created. Their vanilla SDK demo (their managed brain) talking in a test page. `/api/session` route done. |
| 2 | Custom-LLM mode working against the echo brain: avatar repeats whatever you say. |
| 3 | MERGE: your logic inside FE's widget + BE-2's real brain. First full sales conversation. Greeting works. |
| 4 | Hang-up flow triggers `/api/analyze`. Latency tuned. Session timer. |
| 5 | FREEZE. Test on Safari + phone + bad WiFi. Echo testing with the actual demo hardware. |
| 6 | Rehearsals. You drive the live call in the investor demo. |

## Done =

- [ ] Click → avatar connected and greeting within ~4s
- [ ] Visitor speech → avatar reply loop works every turn, under ~2s
- [ ] `leadCaptured: true` triggers the toast
- [ ] Hang-up ends session + fires analyze
- [ ] Tested with the exact mic/laptop/network you'll use in front of the investor