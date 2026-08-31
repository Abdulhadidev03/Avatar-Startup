import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseAdmin } from "@/lib/supabase";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const ANALYZE_PROMPT = `You are an expert sales manager evaluating a recorded sales conversation between an AI avatar salesperson (Sarah) and a website visitor.

Analyze the transcript and provide a structured evaluation in JSON format with exactly these fields:
- "outcome": Must be one of ["lead_captured", "demo_booked", "no_conversion", "abandoned"]
  - "lead_captured": Visitor provided their email, name, or contact details for follow-up.
  - "demo_booked": Visitor agreed to or scheduled a product demo.
  - "no_conversion": Meaningful conversation took place, but no contact details or demo were captured.
  - "abandoned": Conversation was cut off immediately, visitor left with minimal or no interaction.
- "leadScore": An integer from 0 to 100 representing buyer intent, qualification, and engagement.
  - 80-100: High intent (provided email/name, high interest in buying or pro tiers).
  - 50-79: Medium intent (engaged, asked relevant questions, but did not leave contact info).
  - 20-49: Low intent (vague questions, unresolved objections, or casual browser).
  - 0-19: Very low / abandoned (left immediately, spam, or hostile).
- "summary": A concise 2-3 sentence summary of the conversation, noting key questions asked, objections raised, and the final outcome.

Respond ONLY with a valid JSON object matching this schema:
{
  "outcome": "lead_captured" | "demo_booked" | "no_conversion" | "abandoned",
  "leadScore": number,
  "summary": "string"
}`;

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch all turns for this session
    const { data: turns, error: turnsError } = await supabaseAdmin
      .from("turns")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (turnsError) {
      return NextResponse.json(
        { error: `Failed to fetch conversation turns: ${turnsError.message}` },
        { status: 500 }
      );
    }

    // Check if a lead was already captured in the database
    const { data: leads } = await supabaseAdmin
      .from("leads")
      .select("email, name")
      .eq("session_id", sessionId);

    const hasCapturedLead = Boolean(leads && leads.length > 0);

    // 2. Handle empty or very short calls (edge cases)
    if (!turns || turns.length < 2) {
      const fallbackAnalysis = {
        outcome: hasCapturedLead ? "lead_captured" : "abandoned",
        leadScore: hasCapturedLead ? 80 : 0,
        summary: hasCapturedLead
          ? "Visitor left contact info during a brief interaction."
          : "Call was ended before a meaningful conversation took place.",
      };

      // Save to analyses table
      await supabaseAdmin.from("analyses").upsert({
        session_id: sessionId,
        outcome: fallbackAnalysis.outcome,
        lead_score: fallbackAnalysis.leadScore,
        summary: fallbackAnalysis.summary,
      });

      // Update session status
      await supabaseAdmin
        .from("sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", sessionId);

      return NextResponse.json(fallbackAnalysis);
    }

    // 3. Format transcript for Groq
    const transcriptText = turns
      .map((t) => `${t.role === "user" ? "Visitor" : "Sarah (Salesperson)"}: ${t.content}`)
      .join("\n");

    // 4. Request evaluation from Groq
    const response = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      max_tokens: 300,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ANALYZE_PROMPT },
        {
          role: "user",
          content: `Here is the conversation transcript:\n\n${transcriptText}\n\n${
            hasCapturedLead ? "Note: Contact information was captured during this session." : ""
          }`,
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "{}";
    let parsedAnalysis: {
      outcome?: string;
      leadScore?: number;
      summary?: string;
    } = {};

    try {
      parsedAnalysis = JSON.parse(rawContent);
    } catch {
      // Fallback in case of unexpected JSON formatting
      const cleaned = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedAnalysis = JSON.parse(cleaned);
    }

    const outcome =
      parsedAnalysis.outcome || (hasCapturedLead ? "lead_captured" : "no_conversion");
    const leadScore =
      typeof parsedAnalysis.leadScore === "number"
        ? Math.min(100, Math.max(0, Math.round(parsedAnalysis.leadScore)))
        : hasCapturedLead
        ? 85
        : 50;
    const summary =
      parsedAnalysis.summary || "Call completed. Conversation recorded and evaluated.";

    // 5. Save analysis to Supabase
    const { error: analysisError } = await supabaseAdmin.from("analyses").upsert({
      session_id: sessionId,
      outcome,
      lead_score: leadScore,
      summary,
    });

    if (analysisError) {
      console.error("Failed to save analysis:", analysisError.message);
    }

    // 6. Update session status and ended_at timestamp
    const { error: sessionUpdateError } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (sessionUpdateError) {
      console.error("Failed to update session status:", sessionUpdateError.message);
    }

    return NextResponse.json({
      outcome,
      leadScore,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Analyze error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
