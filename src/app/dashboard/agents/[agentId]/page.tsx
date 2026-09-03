import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { AgentWorkspace } from "./agent-workspace";
import type { FrontendAgent } from "../agent-storage";

type AgentPageProps = { params: Promise<{ agentId: string }> };

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchAgent(agentId: string): Promise<FrontendAgent | null> {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (error || !data) return null;

  // Compute basic stats
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("id, started_at")
    .eq("agent_id", agentId)
    .order("started_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { count: outcomeCount } = await supabaseAdmin
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .in("session_id", sessionIds.length ? sessionIds : ["__none__"]);

  const conversations = sessions?.length ?? 0;
  const outcomes = outcomeCount ?? 0;
  const conversionRate = conversations > 0 ? `${((outcomes / conversations) * 100).toFixed(1)}%` : "—";

  let lastActive = "No activity yet";
  if (sessions?.length) {
    const diff = Date.now() - new Date(sessions[0].started_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) lastActive = `${mins} min ago`;
    else if (mins < 1440) lastActive = `${Math.floor(mins / 60)}h ago`;
    else lastActive = `${Math.floor(mins / 1440)}d ago`;
  }

  return {
    id: data.id,
    name: data.name,
    role: data.role,
    website: data.website || "No website set",
    status: data.status ?? "Draft",
    avatarId: data.avatar_id ?? "sarah",
    avatarImageUrl: data.avatar_image_url ?? undefined,
    greeting: data.greeting ?? undefined,
    tone: data.tone ?? undefined,
    responseLength: data.response_length ?? undefined,
    language: data.language ?? undefined,
    instructions: data.instructions ?? undefined,
    conversations,
    outcomes,
    conversionRate,
    lastActive,
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentId } = await params;

  const agent = await fetchAgent(agentId);
  if (!agent) notFound();

  return <AgentWorkspace agent={agent} conversations={[]} />;
}
