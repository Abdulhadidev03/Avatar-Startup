import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { avatarById } from "./mock-data";

export function AvatarPortrait({
  avatarId,
  className = "",
}: {
  avatarId: string;
  className?: string;
}) {
  const avatar = avatarById(avatarId);
  const column = avatar.atlasIndex % 4;
  const row = Math.floor(avatar.atlasIndex / 4);
  const style = {
    "--atlas-x": `${(column / 3) * 100}%`,
    "--atlas-y": `${row * 100}%`,
  } as CSSProperties;

  return (
    <div
      className={`ruh-avatar-portrait ${className}`.trim()}
      style={style}
      role="img"
      aria-label={`${avatar.name}, ${avatar.title}`}
    >
      <span className="ruh-avatar-atlas-frame" aria-hidden="true" />
    </div>
  );
}

export function StatusBadge({ status }: { status: "Live" | "Draft" | "Paused" | "Connected" }) {
  return <span className={`ruh-status-badge is-${status.toLowerCase()}`}>{status}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ruh-page-heading">
      <div>
        <p className="ruh-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}

export function AgentMiniLink({ agentId, children }: { agentId: string; children: ReactNode }) {
  return (
    <Link className="ruh-inline-link" href={`/dashboard/agents/${agentId}`}>
      {children}
    </Link>
  );
}
