import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid sign-out request." }, { status: 403 });
  }

  if (getSupabasePublicConfig()) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Always complete the local browser journey, even if the provider is
      // briefly unavailable. The session cookies are cleared when possible.
    }
  }

  return NextResponse.redirect(new URL("/sign-in", request.url), 303);
}
