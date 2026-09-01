import { notFound } from "next/navigation";
import { agents, conversations } from "../../mock-data";
import { AgentWorkspace } from "./agent-workspace";

type AgentPageProps = { params: Promise<{ agentId: string }> };

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentId } = await params;
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) notFound();
  const relatedConversations = conversations.filter((conversation) => conversation.agent === agent.name);
  return <AgentWorkspace agent={agent} conversations={relatedConversations} />;
}
