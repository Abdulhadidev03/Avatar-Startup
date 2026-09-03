import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ agentId: string }> };

export async function POST(req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { websiteUrl } = await req.json();

  if (!websiteUrl) {
    return NextResponse.json({ error: "websiteUrl required" }, { status: 400 });
  }

  try {
    // Normalize URL
    let url = websiteUrl.trim();
    if (!url.startsWith("http")) url = `https://${url}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "RuhanaInstallChecker/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        installed: false,
        reason: `Website returned ${res.status}`,
      });
    }

    const html = await res.text();

    // Check for our widget script
    const pattern = `/api/embed/${agentId}`;
    const found = html.includes(pattern) || html.includes(`data-agent="${agentId}"`);

    return NextResponse.json({
      installed: found,
      reason: found
        ? "Widget script detected on the page"
        : "Widget script not found — make sure the install code is before the closing </body> tag",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach website";
    return NextResponse.json({
      installed: false,
      reason: message.includes("abort")
        ? "Website took too long to respond (8s timeout)"
        : `Could not reach website: ${message}`,
    });
  }
}
