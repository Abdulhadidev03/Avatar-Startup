import { AgentBuilder } from "./agent-builder";

type NewAgentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewAgentPage({ searchParams }: NewAgentPageProps) {
  const query = await searchParams;
  const avatar = typeof query.avatar === "string" ? query.avatar : undefined;
  const source = query.source === "custom" ? "custom" : "library";
  const resume = typeof query.resume === "string" ? query.resume : undefined;

  return <AgentBuilder initialAvatarId={avatar} initialSource={source} resumeAgentId={resume} />;
}
