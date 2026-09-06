import type { Metadata } from "next";
import { getAuthenticatedRuhanaUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Dashboard",
};

function accountName(name: string | null, email: string | null) {
  if (name) return name;
  if (email) return email.split("@")[0].replace(/[._-]+/g, " ");
  return "Ruhana member";
}

function accountInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "R";
}

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const auth = await getAuthenticatedRuhanaUser();

  if (!auth.user) {
    const params = new URLSearchParams({ next: "/dashboard/agents" });
    if (auth.reason === "configuration") params.set("error", "configuration");
    if (auth.reason === "unavailable") params.set("error", "unavailable");
    redirect(`/sign-in?${params.toString()}`);
  }

  const displayName = accountName(auth.user.name, auth.user.email);

  return (
    <DashboardShell
      user={{
        displayName,
        email: auth.user.email,
        initials: accountInitials(displayName),
      }}
    >
      {children}
    </DashboardShell>
  );
}
