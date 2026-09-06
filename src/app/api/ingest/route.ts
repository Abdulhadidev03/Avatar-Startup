import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/lib/supabase";
import { openai, OPENAI_MODEL } from "@/lib/openai";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

const PROFILE_PROMPT = `You are a business analyst. Given the raw content scraped from a company's website, produce a concise Business Profile that a sales AI avatar can use to answer visitor questions.

The profile MUST include (if findable):
- Company name
- What they do (1-2 sentences)
- Products / services with pricing (if listed)
- Key features and benefits
- Target audience
- Common objections and how to handle them
- Any FAQs
- Contact info, social links

If some info isn't available, say "Not found on site."
Keep it factual. No fluff. Plain text only — no markdown.`;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    // 1. Crawl the website with Firecrawl
    const crawlResult = await firecrawl.crawlUrl(url, {
      limit: 10,
      scrapeOptions: { formats: ["markdown"] },
    });

    if (
      !crawlResult ||
      crawlResult.status === "failed" ||
      !crawlResult.data?.length
    ) {
      return NextResponse.json(
        { error: "Failed to crawl the website — no content returned" },
        { status: 422 }
      );
    }

    // Combine page content (cap at ~12k chars to stay within context limits)
    const rawContent = crawlResult.data
      .map((page: { markdown?: string }) => page.markdown ?? "")
      .join("\n\n---\n\n")
      .slice(0, 12000);

    // 2. Generate the Business Profile with OpenAI
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: 1500,
      messages: [
        { role: "system", content: PROFILE_PROMPT },
        {
          role: "user",
          content: `Here is the scraped website content:\n\n${rawContent}`,
        },
      ],
    });

    const profileText =
      response.choices[0]?.message?.content ?? "Could not generate profile.";

    // Extract company name from the first line of the profile (best effort)
    const firstLine = profileText.split("\n")[0] ?? "";
    const companyName = firstLine.replace(/^(Company( Name)?:\s*)/i, "").trim() || new URL(url).hostname;

    // 3. Save to the profiles table
    const { data: profile, error: dbError } = await supabaseAdmin
      .from("profiles")
      .insert({
        company_name: companyName,
        source_url: url,
        profile_text: profileText,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profileId: profile.id,
      companyName,
      profileText,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Ingest error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
