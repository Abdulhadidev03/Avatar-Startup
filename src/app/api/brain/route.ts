import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const BASE_PROMPT_TEMPLATE = (agentName: string) =>
  `You are ${agentName}, a friendly and professional AI sales representative.

RULES:
- Keep responses SHORT — 1-3 sentences max. This is a live voice call, not a blog post.
- Be warm, conversational, and confident. Occasionally add natural pauses with "..." or filler like "So," or "Well,".
- Your goal: answer the visitor's questions, handle objections, and capture their name and email.
- When the visitor shares their name or email, acknowledge it naturally.
- Never use markdown, bullet points, or formatting — your text is spoken aloud by a voice avatar.
- If you don't know something specific about the business, pivot to asking what they're looking for.

LEAD CAPTURE:
- Gently steer the conversation toward getting the visitor's name and email.
- Don't be pushy — weave it in naturally, like "By the way, I'd love to send you more details — what's a good email for you?"
- If they give their email, confirm it back to them.`;

interface LiveContext {
  url?: string;
  path?: string;
  scrollDepth?: number;
  visibleSection?: string;
  lastClick?: string;
}

interface JourneyEvent {
  type: string;
  path?: string;
  title?: string;
  tag?: string;
  text?: string;
  href?: string;
  seconds?: number;
  depth?: number;
  ts?: number;
}

function formatJourney(events: JourneyEvent[]): string {
  if (!Array.isArray(events) || events.length === 0) return "";
  const steps: string[] = [];
  for (const e of events.slice(-8)) {
    if (e.type === "page_view") {
      steps.push(`Viewed ${e.path || "page"}${e.title && e.title !== e.path ? ` ("${e.title}")` : ""}`);
    } else if (e.type === "page_time") {
      steps.push(`Spent ${e.seconds ?? "?"}s on ${e.path || "page"}`);
    } else if (e.type === "click") {
      const label = e.text ? `"${e.text}"` : (e.tag || "button");
      steps.push(`Clicked ${label} on ${e.path || "page"}`);
    } else if (e.type === "scroll") {
      steps.push(`Scrolled to ${e.depth ?? 0}% on ${e.path || "page"}`);
    }
  }
  return steps.join(" → ");
}

function buildSystemPrompt(
  agentName: string,
  profileText?: string,
  customInstructions?: string,
  knowledgeTexts?: string[],
  liveContext?: LiveContext,
  recentEvents?: JourneyEvent[],
): string {
  let prompt = BASE_PROMPT_TEMPLATE(agentName);
  if (customInstructions) prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`;
  if (profileText) prompt += `\n\nBUSINESS CONTEXT (use this to answer questions about the company):\n${profileText}`;
  if (knowledgeTexts?.length) {
    prompt += `\n\nKNOWLEDGE BASE (use this information to answer visitor questions accurately):\n`;
    prompt += knowledgeTexts.join("\n\n---\n\n");
  }

  if (liveContext) {
    const details: string[] = [];
    if (liveContext.path) details.push(`- Current page URL / path: ${liveContext.path}`);
    if (typeof liveContext.scrollDepth === "number") details.push(`- Current page scroll position: ${liveContext.scrollDepth}% down the page`);
    if (liveContext.visibleSection) details.push(`- Section currently in visitor's viewport: "${liveContext.visibleSection}"`);
    if (liveContext.lastClick) details.push(`- Most recent click interaction: ${liveContext.lastClick}`);

    if (details.length > 0) {
      prompt += `\n\nLIVE VISITOR SCREEN CONTEXT (what the visitor is seeing right now on their screen):\n` +
        details.join("\n") +
        `\nGUIDANCE: You know what they are looking at right now. If the visitor refers to "this plan", "this price", or asks what they should do next, use this live context naturally. Speak like an observant, helpful human salesperson, never robotic.`;
    }
  }

  const journeyText = formatJourney(recentEvents || []);
  if (journeyText) {
    prompt += `\n\nVISITOR BROWSING HISTORY (what they have done on the site so far during this visit):\n` +
      journeyText +
      `\nGUIDANCE: You can seamlessly connect their past browsing (e.g. features or plans they checked) to your answers.`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    const { sessionId, userText, liveContext, recentEvents } = await req.json();

    if (!sessionId || !userText) {
      return NextResponse.json(
        { error: "sessionId and userText are required" },
        { status: 400 }
      );
    }

    // Save the user's turn
    await supabaseAdmin.from("turns").insert({
      session_id: sessionId,
      role: "user",
      content: userText,
    });

    // Load session → agent → profile chain
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("profile_id, agent_id")
      .eq("id", sessionId)
      .single();

    let agentName = "Sarah";
    let customInstructions: string | undefined;
    let profileId = session?.profile_id;

    if (session?.agent_id) {
      const { data: agent } = await supabaseAdmin
        .from("agents")
        .select("name, instructions, profile_id")
        .eq("id", session.agent_id)
        .single();
      if (agent) {
        agentName = agent.name;
        customInstructions = agent.instructions ?? undefined;
        if (!profileId && agent.profile_id) profileId = agent.profile_id;
      }
    }

    let profileText: string | undefined;
    if (profileId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("profile_text")
        .eq("id", profileId)
        .single();
      profileText = profile?.profile_text ?? undefined;
    }

    // Fetch enabled knowledge sources for this agent
    let knowledgeTexts: string[] = [];
    if (session?.agent_id) {
      const { data: sources } = await supabaseAdmin
        .from("knowledge_sources")
        .select("name, content_text")
        .eq("agent_id", session.agent_id)
        .eq("enabled", true)
        .not("content_text", "is", null);

      if (sources?.length) {
        // Cap total knowledge to ~30k chars so we don't blow the context window
        let totalChars = 0;
        const MAX_KNOWLEDGE_CHARS = 30_000;
        for (const src of sources) {
          if (totalChars >= MAX_KNOWLEDGE_CHARS) break;
          const text = src.content_text as string;
          const slice = text.slice(0, MAX_KNOWLEDGE_CHARS - totalChars);
          knowledgeTexts.push(`[${src.name}]\n${slice}`);
          totalChars += slice.length;
        }
      }
    }

    // Fetch conversation history for context
    const { data: turns } = await supabaseAdmin
      .from("turns")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const messages: { role: "user" | "assistant"; content: string }[] = (
      turns ?? []
    ).map((t) => ({
      role: t.role as "user" | "assistant",
      content: t.content,
    }));

    // Ask Groq for the sales reply (with business context if available)
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(
            agentName,
            profileText,
            customInstructions,
            knowledgeTexts,
            liveContext,
            recentEvents
          ),
        },
        ...messages,
      ],
    });

    let rawReply =
      response.choices[0]?.message?.content ??
      "Sorry, I didn't catch that. Could you say that again?";

    // Strip <think>…</think> blocks that reasoning models like Qwen emit
    const replyText = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
      || "Sorry, I didn't catch that. Could you say that again?";

    // Detect if a lead was captured (email mentioned)
    const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/;
    const leadCaptured = emailRegex.test(userText);

    if (leadCaptured) {
      const emailMatch = userText.match(emailRegex);
      await supabaseAdmin.from("leads").insert({
        session_id: sessionId,
        email: emailMatch?.[0] ?? null,
        interest: "Inbound via avatar widget",
      });
    }

    // Save the assistant's turn
    await supabaseAdmin.from("turns").insert({
      session_id: sessionId,
      role: "assistant",
      content: replyText,
    });

    return NextResponse.json({ replyText, leadCaptured });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Brain error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
