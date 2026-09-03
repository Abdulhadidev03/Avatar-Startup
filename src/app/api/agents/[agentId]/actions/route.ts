import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type RouteContext = { params: Promise<{ agentId: string }> };

// GET — list all action toggles for an agent
export async function GET(_req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;

  const { data, error } = await supabaseAdmin
    .from("agent_actions")
    .select("action_key, enabled")
    .eq("agent_id", agentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return as a map: { lead: true, product: false, ... }
  const map: Record<string, boolean> = {};
  for (const row of data ?? []) map[row.action_key] = row.enabled;
  return NextResponse.json(map);
}

// PUT — upsert action toggle states
export async function PUT(req: Request, ctx: RouteContext) {
  const { agentId } = await ctx.params;
  const body: Record<string, boolean> = await req.json();

  const rows = Object.entries(body).map(([actionKey, enabled]) => ({
    agent_id: agentId,
    action_key: actionKey,
    enabled,
  }));

  // Upsert each action
  const { error } = await supabaseAdmin
    .from("agent_actions")
    .upsert(rows, { onConflict: "agent_id,action_key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ saved: true });
}
