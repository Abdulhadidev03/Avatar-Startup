import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const BASE_PROMPT = `You are Sarah, a friendly and professional AI sales representative.

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

function buildSystemPrompt(profileText?: string): string {
  if (!profileText) return BASE_PROMPT;
  return `${BASE_PROMPT}\n\nBUSINESS CONTEXT (use this to answer questions about the company):\n${profileText}`;
}

export async function POST(req: Request) {
  try {
    const { sessionId, userText } = await req.json();

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

    // Load the business profile for this session (if linked)
    const { data: session } = await supabaseAdmin
      .from("sessions")
      .select("profile_id")
      .eq("id", sessionId)
      .single();

    let profileText: string | undefined;
    if (session?.profile_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("profile_text")
        .eq("id", session.profile_id)
        .single();
      profileText = profile?.profile_text ?? undefined;
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
        { role: "system", content: buildSystemPrompt(profileText) },
        ...messages,
      ],
    });

    const replyText =
      response.choices[0]?.message?.content ??
      "Sorry, I didn't catch that. Could you say that again?";

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
