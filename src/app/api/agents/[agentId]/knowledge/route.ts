import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ agentId: string }> };

const TEXT_EXTENSIONS = new Set(["txt", "csv", "md", "json", "tsv", "xml", "html", "htm", "log"]);
const MAX_CONTENT_CHARS = 50_000; // Cap stored text at ~50k chars to keep prompts manageable

async function extractText(file: File): Promise<{ text: string; itemCount: string }> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();

  // Text-based files — read directly
  if (TEXT_EXTENSIONS.has(ext)) {
    let raw = await file.text();
    if (raw.length > MAX_CONTENT_CHARS) raw = raw.slice(0, MAX_CONTENT_CHARS) + "\n\n[...truncated]";

    // Estimate "items" based on format
    if (ext === "csv" || ext === "tsv") {
      const lines = raw.split("\n").filter((l) => l.trim()).length;
      return { text: raw, itemCount: `${lines} rows` };
    }
    if (ext === "json") {
      try {
        const parsed = JSON.parse(raw);
        const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
        return { text: raw, itemCount: `${count} entries` };
      } catch { /* fall through */ }
    }
    if (ext === "md" || ext === "txt") {
      const sections = raw.split(/\n#{1,3}\s/).length;
      return { text: raw, itemCount: `${sections} sections` };
    }
    return { text: raw, itemCount: `${Math.round(raw.length / 1024)} KB` };
  }

  // PDF — extract text from the raw bytes (basic heuristic: pull ASCII strings)
  if (ext === "pdf") {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const rawStr = decoder.decode(bytes);

    // Extract text between BT...ET blocks (PDF text objects), or fall back to readable ASCII runs
    const textBlocks: string[] = [];
    const btRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btRegex.exec(rawStr)) !== null) {
      // Extract parenthesized strings inside text objects
      const innerMatches = match[1].match(/\(([^)]*)\)/g);
      if (innerMatches) {
        for (const m of innerMatches) textBlocks.push(m.slice(1, -1));
      }
    }

    let text = textBlocks.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim();

    // Fallback: if PDF text extraction got nothing, pull long ASCII runs
    if (text.length < 50) {
      const asciiRuns: string[] = [];
      let current = "";
      for (let i = 0; i < bytes.length; i++) {
        const c = bytes[i];
        if (c >= 32 && c < 127) { current += String.fromCharCode(c); }
        else { if (current.length > 20) asciiRuns.push(current); current = ""; }
      }
      if (current.length > 20) asciiRuns.push(current);
      text = asciiRuns.join(" ").slice(0, MAX_CONTENT_CHARS);
    }

    if (text.length > MAX_CONTENT_CHARS) text = text.slice(0, MAX_CONTENT_CHARS) + "\n\n[...truncated]";
    const pages = (rawStr.match(/\/Type\s*\/Page[^s]/g) || []).length;
    return { text, itemCount: pages > 0 ? `${pages} pages` : `${Math.round(file.size / 1024)} KB` };
  }

  // Unsupported — store what we can
  const sizeKb = Math.round(file.size / 1024);
  return { text: "", itemCount: `${sizeKb} KB` };
}

// GET — list all knowledge sources for an agent
export async function GET(_req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from("knowledge_sources")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — upload a new knowledge source (file or website)
export async function POST(req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;

  const contentType = req.headers.get("content-type") ?? "";

  // File upload via FormData
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `knowledge/${agentId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(storagePath, file, { contentType: file.type, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(storagePath);

    // Extract text content from the file
    const { text: contentText, itemCount } = await extractText(file);

    const { data: source, error: dbError } = await supabaseAdmin
      .from("knowledge_sources")
      .insert({
        agent_id: agentId,
        name: file.name.replace(/\.[^.]+$/, ""),
        source: "Uploaded file",
        file_url: urlData.publicUrl,
        content_text: contentText || null,
        item_count: itemCount,
        status: contentText ? "Ready" : "Uploaded (text extraction limited)",
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json(source, { status: 201 });
  }

  // JSON body — manual source (e.g. website)
  const body = await req.json();
  const { data: source, error: dbError } = await supabaseAdmin
    .from("knowledge_sources")
    .insert({
      agent_id: agentId,
      name: body.name ?? "Untitled source",
      source: body.source ?? "",
      file_url: body.fileUrl ?? null,
      content_text: body.contentText ?? null,
      item_count: body.itemCount ?? "Processing",
      status: body.status ?? "Ready",
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(source, { status: 201 });
}

// PATCH — update a source (toggle enabled, update status)
export async function PATCH(req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const body = await req.json();
  const { sourceId, ...updates } = body;

  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.enabled !== undefined) updateFields.enabled = updates.enabled;
  if (updates.status) updateFields.status = updates.status;
  if (updates.item_count) updateFields.item_count = updates.item_count;

  const { data, error } = await supabaseAdmin
    .from("knowledge_sources")
    .update(updateFields)
    .eq("id", sourceId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove a knowledge source
export async function DELETE(req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const { sourceId } = await req.json();

  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("knowledge_sources")
    .delete()
    .eq("id", sourceId)
    .eq("agent_id", agentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
