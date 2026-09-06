import { getSafeAuthRedirect } from "@/lib/auth-redirect";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const supportedEmailOtpTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "magiclink",
]);

function returnToSignIn(request: NextRequest, message: "configuration" | "callback") {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", getSafeAuthRedirect(request.nextUrl.searchParams.get("next")));
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

/**
 * Handles the server side of PKCE OAuth and the optional email-link fallback.
 * The visible email journey verifies the six-digit OTP in the browser, but
 * keeping this route allows a correctly configured email template or Google
 * to establish the same secure cookie session.
 */
export async function GET(request: NextRequest) {
  if (!getSupabasePublicConfig()) {
    return returnToSignIn(request, "configuration");
  }

  try {
    const supabase = await createServerSupabaseClient();
    const code = request.nextUrl.searchParams.get("code");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return returnToSignIn(request, "callback");

      return NextResponse.redirect(
        new URL(getSafeAuthRedirect(request.nextUrl.searchParams.get("next")), request.url),
      );
    }

    const tokenHash = request.nextUrl.searchParams.get("token_hash");
    const type = request.nextUrl.searchParams.get("type");

    if (tokenHash && type && supportedEmailOtpTypes.has(type as EmailOtpType)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });

      if (!error) {
        return NextResponse.redirect(
          new URL(getSafeAuthRedirect(request.nextUrl.searchParams.get("next")), request.url),
        );
      }
    }
  } catch {
    // Fall through to a friendly, non-sensitive error state.
  }

  return returnToSignIn(request, "callback");
}
