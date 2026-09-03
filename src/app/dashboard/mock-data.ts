export type AvatarCategory = "Sales" | "Support" | "General";

export type AvatarProfile = {
  id: string;
  name: string;
  title: string;
  category: AvatarCategory;
  languages: string[];
  imageUrl: string;
  anamAvatarId: string;
  description: string;
  tone: string;
};

export type AgentStatus = "Live" | "Draft" | "Paused";

export type AgentProfile = {
  id: string;
  name: string;
  role: string;
  website: string;
  status: AgentStatus;
  avatarId: string;
  conversations: number;
  outcomes: number;
  conversionRate: string;
  lastActive: string;
};

export type ConversationOutcome = "Purchase" | "Lead" | "Resolved" | "Booked" | "Open";

export type Conversation = {
  id: string;
  visitor: string;
  agent: string;
  avatarId: string;
  startedAt: string;
  duration: string;
  intent: string;
  page: string;
  outcome: ConversationOutcome;
  value?: string;
  summary: string;
  messages: Array<{ speaker: "Visitor" | "Agent"; time: string; text: string }>;
  events: Array<{ time: string; label: string; detail: string }>;
};

// Real Anam avatars — these are actual faces that work in video calls
export const avatars: AvatarProfile[] = [
  {
    id: "sarah",
    name: "Sarah",
    title: "Sales Partner",
    category: "Sales",
    languages: ["English"],
    imageUrl: "https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/mMfYrWxaKzQEexPHol2Aidf9O7qa6fCT/one-shot_mMfYrWxaKzQEexPHol2Aidf9O7qa6fCT_sarah-sales-partner1788028958576-cropped-rWOGLJNpT5CBX0QurOzWRnNV40rJJp.png",
    anamAvatarId: "1ad88653-60e6-4f2f-9b1b-e881e36b286e",
    description: "Professional woman in a modern office. Your custom avatar, ready for sales conversations.",
    tone: "Professional",
  },
  {
    id: "mia",
    name: "Mia",
    title: "Studio assistant",
    category: "General",
    languages: ["English"],
    imageUrl: "https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatars/stock/mia_studio.webp",
    anamAvatarId: "edf6fdcb-acab-44b8-b974-ded72665ee26",
    description: "A woman with long dark hair in a casual professional setting.",
    tone: "Warm",
  },
  {
    id: "liv",
    name: "Liv",
    title: "Home advisor",
    category: "Sales",
    languages: ["English"],
    imageUrl: "https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatars/stock/liv_home.webp",
    anamAvatarId: "071b0286-4cce-4808-bee2-e642f1062de3",
    description: "A woman with curly brown hair and a beige blazer, professional and neutral.",
    tone: "Confident",
  },
  {
    id: "gabriel",
    name: "Gabriel",
    title: "Senior consultant",
    category: "Sales",
    languages: ["English"],
    imageUrl: "https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatars/stock/gabriel_table.webp",
    anamAvatarId: "6cc28442-cccd-42a8-b6e4-24b7210a09c5",
    description: "A mature man with salt-and-pepper hair and a calm, trustworthy presence.",
    tone: "Polished",
  },
  {
    id: "anne",
    name: "Anne",
    title: "Customer care",
    category: "Support",
    languages: ["English"],
    imageUrl: "https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatars/stock/anne_home.webp",
    anamAvatarId: "27e12daa-50fc-4384-93c2-ebca73f1f78d",
    description: "A woman with short dark hair in a modern setting with warm lighting.",
    tone: "Reassuring",
  },
  {
    id: "bella",
    name: "Bella",
    title: "Product guide",
    category: "General",
    languages: ["English"],
    imageUrl: "https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatars/stock/bella_sofa.webp",
    anamAvatarId: "dc9aa3e1-32f2-499e-9921-ecabac1076fc",
    description: "A woman in business casual on a couch, approachable and direct.",
    tone: "Friendly",
  },
];

// No mock agents — real agents come from the database
export const agents: AgentProfile[] = [];

// No mock conversations — real conversations come from Supabase
export const conversations: Conversation[] = [];

export function avatarById(id: string) {
  return avatars.find((avatar) => avatar.id === id) ?? avatars[0];
}
