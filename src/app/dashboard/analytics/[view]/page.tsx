import { notFound } from "next/navigation";
import { AnalyticsDashboard } from "../analytics-dashboard";
import type { AnalyticsView } from "../analytics-data";

const supportedViews = ["results", "insights", "usage"] as const;

export function generateStaticParams() {
  return supportedViews.map((view) => ({ view }));
}

function isAnalyticsView(view: string): view is Exclude<AnalyticsView, "overview"> {
  return supportedViews.some((candidate) => candidate === view);
}

export default async function AnalyticsViewPage({
  params,
}: PageProps<"/dashboard/analytics/[view]">) {
  const { view } = await params;

  if (!isAnalyticsView(view)) {
    notFound();
  }

  return <AnalyticsDashboard view={view} />;
}
