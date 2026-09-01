import { agents, conversations } from "../../mock-data";
import { AgentWorkspace } from "./agent-workspace";

type AgentPageProps = { params: Promise<{ agentId: string }> };

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentId } = await params;
  const agent = agents.find((item) => item.id === agentId);
  const relatedConversations = agent
    ? conversations.filter((conversation) => conversation.agent === agent.name)
    : [];
  return <AgentWorkspace agentId={agentId} initialAgent={agent ?? null} conversations={relatedConversations} />;
}
