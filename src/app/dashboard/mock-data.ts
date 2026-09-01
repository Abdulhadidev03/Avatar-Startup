export type AvatarCategory =
  | "Sales"
  | "Support"
  | "Commerce"
  | "Onboarding"
  | "Hospitality"
  | "Education";

export type AvatarProfile = {
  id: string;
  name: string;
  title: string;
  category: AvatarCategory;
  languages: string[];
  atlasIndex: number;
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

export const avatars: AvatarProfile[] = [
  {
    id: "aria",
    name: "Aria",
    title: "Sales concierge",
    category: "Sales",
    languages: ["English", "Spanish"],
    atlasIndex: 0,
    description: "Confident and concise for considered purchases and B2B sales.",
    tone: "Confident",
  },
  {
    id: "mei",
    name: "Mei",
    title: "Product guide",
    category: "Commerce",
    languages: ["English", "Mandarin"],
    atlasIndex: 1,
    description: "Warm product discovery for ecommerce and guided shopping.",
    tone: "Warm",
  },
  {
    id: "nia",
    name: "Nia",
    title: "Support specialist",
    category: "Support",
    languages: ["English", "French"],
    atlasIndex: 2,
    description: "Calm, clear assistance for questions, troubleshooting, and handoff.",
    tone: "Reassuring",
  },
  {
    id: "elena",
    name: "Elena",
    title: "Care navigator",
    category: "Support",
    languages: ["English", "Spanish"],
    atlasIndex: 3,
    description: "Patient and precise for sensitive service and healthcare journeys.",
    tone: "Patient",
  },
  {
    id: "omar",
    name: "Omar",
    title: "Guest experience host",
    category: "Hospitality",
    languages: ["English", "Arabic"],
    atlasIndex: 4,
    description: "Polished recommendations and bookings for hospitality teams.",
    tone: "Polished",
  },
  {
    id: "clara",
    name: "Clara",
    title: "Property advisor",
    category: "Sales",
    languages: ["English", "German"],
    atlasIndex: 5,
    description: "Consultative qualification for real estate and high-value services.",
    tone: "Consultative",
  },
  {
    id: "theo",
    name: "Theo",
    title: "Onboarding coach",
    category: "Onboarding",
    languages: ["English", "Dutch"],
    atlasIndex: 6,
    description: "Friendly step-by-step guidance for SaaS onboarding and activation.",
    tone: "Encouraging",
  },
  {
    id: "sana",
    name: "Sana",
    title: "Learning guide",
    category: "Education",
    languages: ["English", "Urdu"],
    atlasIndex: 7,
    description: "Clear explanations and adaptive guidance for learning experiences.",
    tone: "Encouraging",
  },
];

export const agents: AgentProfile[] = [
  {
    id: "northstar-sales",
    name: "Nova",
    role: "Sales concierge",
    website: "northstar.com",
    status: "Live",
    avatarId: "mei",
    conversations: 842,
    outcomes: 196,
    conversionRate: "23.3%",
    lastActive: "2 min ago",
  },
  {
    id: "ruh-support",
    name: "Nia Support",
    role: "Customer support",
    website: "help.northstar.com",
    status: "Live",
    avatarId: "nia",
    conversations: 442,
    outcomes: 318,
    conversionRate: "71.9%",
    lastActive: "8 min ago",
  },
  {
    id: "onboarding-guide",
    name: "Theo Onboarding",
    role: "Product onboarding",
    website: "app.northstar.com",
    status: "Draft",
    avatarId: "theo",
    conversations: 0,
    outcomes: 0,
    conversionRate: "—",
    lastActive: "Edited yesterday",
  },
];

export const conversations: Conversation[] = [
  {
    id: "CNV-2841",
    visitor: "Maya R.",
    agent: "Nova",
    avatarId: "mei",
    startedAt: "Today, 2:42 PM",
    duration: "4m 18s",
    intent: "Compare plans",
    page: "/pricing",
    outcome: "Purchase",
    value: "$249",
    summary: "Compared Pro and Scale, resolved an integration concern, and completed annual Pro checkout.",
    messages: [
      { speaker: "Visitor", time: "2:42", text: "We have 12 people. Is Pro enough or do we need Scale?" },
      { speaker: "Agent", time: "2:42", text: "Pro covers 15 seats, so it fits today. Scale is useful if you need SSO or advanced permissions. Which matters more for your team?" },
      { speaker: "Visitor", time: "2:44", text: "We mainly need HubSpot and room to grow." },
      { speaker: "Agent", time: "2:44", text: "HubSpot is included with Pro. I can apply annual pricing and keep the upgrade path open when you pass 15 seats." },
    ],
    events: [
      { time: "2:41", label: "Viewed pricing", detail: "Pro plan for 38 seconds" },
      { time: "2:43", label: "Compared plans", detail: "Pro and Scale" },
      { time: "2:45", label: "Checkout opened", detail: "Annual Pro" },
      { time: "2:46", label: "Purchase completed", detail: "$249 attributed revenue" },
    ],
  },
  {
    id: "CNV-2838",
    visitor: "Daniel K.",
    agent: "Nia Support",
    avatarId: "nia",
    startedAt: "Today, 1:17 PM",
    duration: "3m 06s",
    intent: "Reconnect integration",
    page: "/help/integrations",
    outcome: "Resolved",
    summary: "Identified an expired HubSpot connection and guided the visitor through reconnection without a ticket.",
    messages: [
      { speaker: "Visitor", time: "1:17", text: "Our HubSpot leads stopped syncing this morning." },
      { speaker: "Agent", time: "1:18", text: "The connection token expired at 9:12 AM. I can guide you to reconnect it now." },
      { speaker: "Visitor", time: "1:19", text: "Done. Can you check it?" },
      { speaker: "Agent", time: "1:20", text: "Confirmed—new leads are syncing again. No data was lost." },
    ],
    events: [
      { time: "1:16", label: "Opened help article", detail: "HubSpot connection" },
      { time: "1:18", label: "Diagnostic action", detail: "Connection status checked" },
      { time: "1:20", label: "Issue resolved", detail: "Ticket deflected" },
    ],
  },
  {
    id: "CNV-2832",
    visitor: "Anonymous visitor",
    agent: "Nova",
    avatarId: "mei",
    startedAt: "Today, 11:03 AM",
    duration: "2m 41s",
    intent: "Book a demo",
    page: "/enterprise",
    outcome: "Booked",
    summary: "Qualified a 75-seat opportunity and booked a product demo for Thursday.",
    messages: [
      { speaker: "Visitor", time: "11:03", text: "Can this support about 75 sales reps?" },
      { speaker: "Agent", time: "11:04", text: "Yes. At that size I recommend Scale with SSO and role controls. Would a tailored demo help?" },
      { speaker: "Visitor", time: "11:05", text: "Thursday afternoon works." },
      { speaker: "Agent", time: "11:05", text: "Booked for Thursday at 3:00 PM. I’ve sent the calendar invitation." },
    ],
    events: [
      { time: "11:02", label: "Viewed enterprise", detail: "Pricing section" },
      { time: "11:04", label: "Lead qualified", detail: "75 seats · Sales" },
      { time: "11:05", label: "Demo booked", detail: "Thursday, 3:00 PM" },
    ],
  },
  {
    id: "CNV-2827",
    visitor: "Sofia T.",
    agent: "Nova",
    avatarId: "mei",
    startedAt: "Yesterday, 5:26 PM",
    duration: "5m 12s",
    intent: "Product recommendation",
    page: "/collections/studio",
    outcome: "Lead",
    value: "$1,480 pipeline",
    summary: "Recommended a studio bundle and captured contact details for a procurement follow-up.",
    messages: [
      { speaker: "Visitor", time: "5:26", text: "We are outfitting a six-person creative studio." },
      { speaker: "Agent", time: "5:27", text: "The Studio Team bundle is the best fit. Do you need installation included?" },
      { speaker: "Visitor", time: "5:29", text: "Yes, please send a quote with installation." },
      { speaker: "Agent", time: "5:30", text: "I’ve prepared the request. A specialist will follow up with the itemized quote." },
    ],
    events: [
      { time: "5:25", label: "Viewed collection", detail: "Studio furniture" },
      { time: "5:28", label: "Bundle recommended", detail: "Studio Team" },
      { time: "5:30", label: "Lead captured", detail: "$1,480 estimated value" },
    ],
  },
  {
    id: "CNV-2819",
    visitor: "Henry L.",
    agent: "Nia Support",
    avatarId: "nia",
    startedAt: "Yesterday, 3:09 PM",
    duration: "1m 54s",
    intent: "Refund policy",
    page: "/returns",
    outcome: "Resolved",
    summary: "Explained the return window and generated a return label.",
    messages: [
      { speaker: "Visitor", time: "3:09", text: "Can I return an unopened item after 20 days?" },
      { speaker: "Agent", time: "3:10", text: "Yes, unopened items can be returned within 30 days. I can create the label now." },
      { speaker: "Visitor", time: "3:10", text: "Please do." },
      { speaker: "Agent", time: "3:11", text: "Done—the prepaid label is in your email." },
    ],
    events: [
      { time: "3:08", label: "Viewed returns", detail: "Return policy" },
      { time: "3:10", label: "Return created", detail: "Label sent" },
      { time: "3:11", label: "Issue resolved", detail: "No human handoff" },
    ],
  },
];

export function avatarById(id: string) {
  return avatars.find((avatar) => avatar.id === id) ?? avatars[0];
}
