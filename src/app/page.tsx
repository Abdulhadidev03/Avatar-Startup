import LandingPage from "./landing-page";
import "./landing.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  let authenticated = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    authenticated = Boolean(data.user);
  } catch {
    // The public page remains available while auth is being configured.
  }

  return <LandingPage authenticated={authenticated} />;
}
