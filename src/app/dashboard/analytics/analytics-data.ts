export type AnalyticsView = "overview" | "results" | "insights" | "usage";

export type PeriodKey = "7d" | "30d" | "90d";

export type MetricSnapshot = {
  revenue: number;
  outcomes: number;
  conversations: number;
  minutes: number;
  change: {
    revenue: number;
    outcomes: number;
    conversations: number;
    minutes: number;
  };
};

export const periodOptions: Array<{ value: PeriodKey; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const periodSnapshots: Record<PeriodKey, MetricSnapshot> = {
  "7d": {
    revenue: 11420,
    outcomes: 137,
    conversations: 342,
    minutes: 1288,
    change: { revenue: 18.6, outcomes: 14.2, conversations: 9.8, minutes: 7.4 },
  },
  "30d": {
    revenue: 42860,
    outcomes: 514,
    conversations: 1284,
    minutes: 4820,
    change: { revenue: 23.8, outcomes: 18.4, conversations: 12.6, minutes: 9.2 },
  },
  "90d": {
    revenue: 109740,
    outcomes: 1367,
    conversations: 3415,
    minutes: 12840,
    change: { revenue: 31.4, outcomes: 26.1, conversations: 20.8, minutes: 17.5 },
  },
};

export const agents = [
  {
    id: "northstar-sales",
    name: "Nova",
    role: "Sales concierge",
    status: "Live",
    conversations: 842,
    outcomes: 196,
    revenue: 36620,
    minutes: 3180,
  },
  {
    id: "ruh-support",
    name: "Nia Support",
    role: "Customer support",
    status: "Live",
    conversations: 442,
    outcomes: 318,
    revenue: 6240,
    minutes: 1640,
  },
  {
    id: "onboarding-guide",
    name: "Theo Onboarding",
    role: "Product onboarding",
    status: "Draft",
    conversations: 0,
    outcomes: 0,
    revenue: 0,
    minutes: 0,
  },
] as const;

export const sites = [
  {
    id: "northstar",
    name: "Northstar",
    domain: "northstar.com",
    agentId: "northstar-sales",
    conversations: 842,
    outcomes: 196,
    revenue: 36620,
    minutes: 3180,
  },
  {
    id: "help",
    name: "Northstar Help",
    domain: "help.northstar.com",
    agentId: "ruh-support",
    conversations: 442,
    outcomes: 318,
    revenue: 6240,
    minutes: 1640,
  },
  {
    id: "app",
    name: "Northstar App",
    domain: "app.northstar.com",
    agentId: "onboarding-guide",
    conversations: 0,
    outcomes: 0,
    revenue: 0,
    minutes: 0,
  },
] as const;

export const outcomeBreakdown = [
  { id: "sale", label: "Purchases assisted", value: 128, share: 24.9, kind: "Sales" },
  { id: "lead", label: "Leads captured", value: 44, share: 8.6, kind: "Sales" },
  { id: "booking", label: "Meetings booked", value: 24, share: 4.7, kind: "Sales" },
  { id: "resolved", label: "Support resolved", value: 318, share: 61.8, kind: "Support" },
] as const;

export const funnel = [
  { label: "Widget viewed", value: 38420 },
  { label: "Engaged", value: 4906 },
  { label: "Conversation", value: 1284 },
  { label: "Qualified", value: 874 },
  { label: "Outcome generated", value: 514 },
] as const;

export const trendSeries = {
  revenue: {
    label: "Revenue",
    formatter: "currency",
    values: {
      "7d": [1300, 1420, 1510, 1620, 1690, 1810, 2070],
      "30d": [3710, 4230, 4580, 4970, 5340, 6170, 6410, 7450],
      "90d": [10320, 11180, 11490, 11750, 11980, 12630, 13020, 13090, 14280],
    },
  },
  conversations: {
    label: "Conversations",
    formatter: "number",
    values: {
      "7d": [41, 44, 46, 47, 51, 54, 59],
      "30d": [132, 145, 151, 162, 170, 184, 164, 176],
      "90d": [335, 348, 359, 367, 372, 388, 399, 405, 442],
    },
  },
  outcomes: {
    label: "Outcomes",
    formatter: "number",
    values: {
      "7d": [15, 17, 18, 19, 20, 22, 26],
      "30d": [48, 52, 57, 61, 66, 73, 72, 85],
      "90d": [128, 137, 142, 147, 149, 154, 161, 165, 184],
    },
  },
  minutes: {
    label: "Minutes",
    formatter: "number",
    values: {
      "7d": [151, 164, 171, 178, 191, 204, 229],
      "30d": [470, 510, 545, 578, 610, 675, 697, 735],
      "90d": [1240, 1300, 1340, 1370, 1410, 1450, 1500, 1530, 1700],
    },
  },
} as const;

export const trendLabels: Record<PeriodKey, string[]> = {
  "7d": ["Aug 25", "Aug 26", "Aug 27", "Aug 28", "Aug 29", "Aug 30", "Aug 31"],
  "30d": ["Aug 2", "Aug 6", "Aug 10", "Aug 14", "Aug 18", "Aug 22", "Aug 26", "Aug 30"],
  "90d": ["Jun 1", "Jun 11", "Jun 21", "Jul 1", "Jul 11", "Jul 21", "Jul 31", "Aug 10", "Aug 20"],
};

export const recentOutcomes = [
  {
    id: "OC-1284",
    visitor: "Sofia R.",
    type: "Sale assisted",
    kind: "Sales",
    agentId: "northstar-sales",
    agent: "Nova",
    siteId: "northstar",
    source: "Enterprise pricing",
    value: "$2,400",
    when: "8 minutes ago",
  },
  {
    id: "OC-1281",
    visitor: "Marcus T.",
    type: "Meeting booked",
    kind: "Sales",
    agentId: "northstar-sales",
    agent: "Nova",
    siteId: "northstar",
    source: "Product comparison",
    value: "Qualified",
    when: "24 minutes ago",
  },
  {
    id: "OC-1278",
    visitor: "Visitor 8F2",
    type: "Support resolved",
    kind: "Support",
    agentId: "ruh-support",
    agent: "Nia Support",
    siteId: "help",
    source: "Account migration",
    value: "Deflected",
    when: "41 minutes ago",
  },
  {
    id: "OC-1274",
    visitor: "Jordan K.",
    type: "Lead captured",
    kind: "Sales",
    agentId: "northstar-sales",
    agent: "Nova",
    siteId: "northstar",
    source: "Winter collection",
    value: "$680 intent",
    when: "1 hour ago",
  },
  {
    id: "OC-1269",
    visitor: "Priya N.",
    type: "Sale assisted",
    kind: "Sales",
    agentId: "northstar-sales",
    agent: "Nova",
    siteId: "northstar",
    source: "Checkout",
    value: "$1,180",
    when: "2 hours ago",
  },
] as const;

export const topPages = [
  { page: "/pricing", title: "Pricing", siteId: "northstar", visitors: 4890, conversations: 418, outcomes: 72, influence: "$16,840" },
  { page: "/collections/winter", title: "Winter collection", siteId: "northstar", visitors: 3720, conversations: 306, outcomes: 58, influence: "$13,260" },
  { page: "/compare", title: "Plan comparison", siteId: "northstar", visitors: 2180, conversations: 187, outcomes: 40, influence: "$7,420" },
  { page: "/shipping-returns", title: "Shipping & returns", siteId: "help", visitors: 1940, conversations: 149, outcomes: 120, influence: "$3,180" },
  { page: "/enterprise", title: "Enterprise", siteId: "northstar", visitors: 1280, conversations: 118, outcomes: 26, influence: "$2,160" },
] as const;

export const intentSignals = [
  { label: "Pricing and plans", value: 436 },
  { label: "Product comparison", value: 318 },
  { label: "Purchase readiness", value: 264 },
  { label: "Shipping and returns", value: 181 },
  { label: "Implementation", value: 146 },
] as const;

export const objections = [
  { label: "Price or budget", value: 238 },
  { label: "Needs more proof", value: 172 },
  { label: "Setup complexity", value: 129 },
  { label: "Missing integration", value: 94 },
  { label: "Timing", value: 76 },
] as const;

export const recommendations = [
  {
    label: "Conversion opportunity",
    title: "Answer implementation questions earlier",
    copy: "Visitors who ask about setup on the pricing page convert 2.4× more often after Nova shares the three-step rollout plan.",
    impact: "+$6.2k potential monthly revenue",
  },
  {
    label: "Content gap",
    title: "Clarify return eligibility",
    copy: "Seventy-one visitors asked a return question that is not answered on the product page.",
    impact: "71 repeated questions",
  },
  {
    label: "Agent coaching",
    title: "Improve the enterprise handoff",
    copy: "Nova identifies high-intent visitors well, but 18% leave before completing the sales handoff.",
    impact: "18% handoff drop-off",
  },
] as const;

export const usageEvents = [
  { date: "Aug 30, 2026", agentId: "northstar-sales", agent: "Nova", site: "Northstar", conversations: 42, minutes: 158, peak: 9 },
  { date: "Aug 29, 2026", agentId: "ruh-support", agent: "Nia Support", site: "Northstar Help", conversations: 38, minutes: 147, peak: 7 },
  { date: "Aug 28, 2026", agentId: "northstar-sales", agent: "Nova", site: "Northstar", conversations: 36, minutes: 136, peak: 6 },
  { date: "Aug 27, 2026", agentId: "ruh-support", agent: "Nia Support", site: "Northstar Help", conversations: 40, minutes: 151, peak: 8 },
] as const;
