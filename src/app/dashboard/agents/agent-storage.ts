import type { AgentProfile } from "../mock-data";

export type StoredKnowledgeSource = {
  id: string;
  name: string;
  detail: string;
  enabled: boolean;
};

export type StoredBuilderState = {
  step: 1 | 2 | 3 | 4;
  maxVisited: 1 | 2 | 3 | 4;
  agentName: string;
  website: string;
  purpose: "sales" | "support" | "both";
  outcome: string;
  language: string;
  scanState: "idle" | "scanning" | "ready";
  avatarSource: "library" | "custom";
  avatarId: string;
  customAvatarDataUrl: string | null;
  customFileName: string;
  consent: boolean;
  voiceId: string;
  greeting: string;
  tone: string;
  responseLength: string;
  instructions: string;
  sources: StoredKnowledgeSource[];
  enabledActions: Record<string, boolean>;
  widgetPosition: "left" | "right";
  widgetTheme: "light" | "dark";
  autoOpen: boolean;
  installMethod: string;
};

export type FrontendAgent = AgentProfile & {
  setupProgress?: number;
  customAvatarDataUrl?: string;
  avatarImageUrl?: string;       // persisted URL from Supabase Storage
  greeting?: string;
  tone?: string;
  responseLength?: string;
  language?: string;
  instructions?: string;
  widgetInstalled?: boolean;
  createdAt?: string;
  builderState?: StoredBuilderState;
};

const STORAGE_KEY = "ruhana.frontend-agents.v1";

export function readStoredAgents(): FrontendAgent[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as FrontendAgent[] : [];
  } catch {
    return [];
  }
}

export function findStoredAgent(id: string) {
  return readStoredAgents().find((agent) => agent.id === id);
}

export function upsertStoredAgent(agent: FrontendAgent) {
  if (typeof window === "undefined") return;
  const agents = readStoredAgents();
  const next = agents.some((item) => item.id === agent.id)
    ? agents.map((item) => item.id === agent.id ? agent : item)
    : [agent, ...agents];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    const withoutPhoto = next.map((item) => ({ ...item, customAvatarDataUrl: undefined, builderState: item.builderState ? { ...item.builderState, customAvatarDataUrl: null } : undefined }));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhoto));
    } catch {
      // Storage is optional prototype persistence; the visible builder remains usable.
    }
  }
}

export function removeStoredAgent(id: string) {
  if (typeof window === "undefined") return;
  const next = readStoredAgents().filter((agent) => agent.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore unavailable browser storage in local/demo environments.
  }
}
