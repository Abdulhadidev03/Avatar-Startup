import { notFound } from "next/navigation";
import { Icon, type IconName } from "../dashboard-icons";

const sections: Record<
  string,
  { title: string; description: string; icon: IconName; note: string }
> = {
  integrations: {
    title: "Integrations",
    description: "Connect Ruhana to the tools that power your website and customer journey.",
    icon: "integrations",
    note: "Website, calendar, commerce, CRM, and support connections will be managed here.",
  },
  billing: {
    title: "Billing",
    description: "Manage your plan, usage allowance, invoices, and payment details.",
    icon: "billing",
    note: "Your current plan and billing history will appear here.",
  },
  settings: {
    title: "Settings",
    description: "Manage your workspace, team access, notifications, and data preferences.",
    icon: "settings",
    note: "Workspace and account controls will be available here.",
  },
};

export default async function UtilityPage({ params }: PageProps<"/dashboard/[section]">) {
  const { section } = await params;
  const content = sections[section];

  if (!content) {
    notFound();
  }

  return (
    <div className="ruh-page-stack">
      <div className="ruh-page-heading">
        <div>
          <p className="ruh-kicker">Workspace</p>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
      </div>
      <section className="ruh-empty-state">
        <span className="ruh-empty-icon">
          <Icon name={content.icon} width="23" height="23" />
        </span>
        <h2>{content.title} setup</h2>
        <p>{content.note}</p>
      </section>
    </div>
  );
}
