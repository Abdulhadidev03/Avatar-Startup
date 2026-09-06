export type SelfServePlanName = "Launch" | "Growth" | "Scale";

export type PricingPlan = {
  name: SelfServePlanName | "Enterprise";
  priceMonthly: number;
  priceLabel: string;
  minutes: number;
  minutesLabel: string;
  agents: string;
  websites: string;
  concurrency: string;
  overage: string;
  description: string;
  analytics: string;
  features: readonly string[];
  support: string;
  tone: "sky" | "mineral" | "clay" | "lavender";
  recommended?: boolean;
};

export const selfServePricingPlans: readonly PricingPlan[] = [
  {
    name: "Launch",
    priceMonthly: 39,
    priceLabel: "$39",
    minutes: 100,
    minutesLabel: "100 connected minutes",
    agents: "1 agent",
    websites: "1 website",
    concurrency: "1 live session",
    overage: "$0.32 / minute",
    description: "For one team putting its first useful video agent on a live website.",
    analytics: "Lead, booking, resolution, and conversation outcomes",
    features: ["Ruhana avatar or your own photo", "Conversation transcripts", "Email support"],
    support: "Email support",
    tone: "sky",
  },
  {
    name: "Growth",
    priceMonthly: 129,
    priceLabel: "$129",
    minutes: 400,
    minutesLabel: "400 connected minutes",
    agents: "3 agents",
    websites: "3 websites",
    concurrency: "3 live sessions",
    overage: "$0.29 / minute",
    description: "For growing sales and support teams that need actions and clearer attribution.",
    analytics: "Journey funnels, intent signals, and agent comparison",
    features: ["Integrations and custom actions", "Conversation transcripts", "Priority support"],
    support: "Priority support",
    tone: "mineral",
    recommended: true,
  },
  {
    name: "Scale",
    priceMonthly: 349,
    priceLabel: "$349",
    minutes: 1200,
    minutesLabel: "1,200 connected minutes",
    agents: "10 agents",
    websites: "10 websites",
    concurrency: "6 live sessions",
    overage: "$0.27 / minute",
    description: "For multi-site teams making Ruhana part of a repeatable customer journey.",
    analytics: "Revenue attribution, conversion exports, and workspace reporting",
    features: ["Webhooks and team controls", "Conversation transcripts", "Launch review"],
    support: "Priority support + launch review",
    tone: "clay",
  },
];
export const enterprisePricingPlan: PricingPlan = {
  name: "Enterprise",
  priceMonthly: 999,
  priceLabel: "From $999",
  minutes: 3500,
  minutesLabel: "3,500+ connected minutes",
  agents: "Custom agents",
  websites: "Custom websites",
  concurrency: "Custom concurrency",
  overage: "From $0.26 / minute",
  description: "For regulated, high-volume, or deeply integrated customer experiences.",
  analytics: "Custom KPI model, governance, exports, and success reporting",
  features: ["Private cloud or on-premise pathway", "SSO, SLA, and governance", "Success engineering"],
  support: "Dedicated success engineering",
  tone: "lavender",
};

export const pricingPlans: readonly PricingPlan[] = [
  ...selfServePricingPlans,
  enterprisePricingPlan,
];
