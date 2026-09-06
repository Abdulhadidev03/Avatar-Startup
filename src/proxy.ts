import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth-redirect";
import { updateSupabaseSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithAuthCookies(response: NextResponse, destination: URL) {
  const redirect = NextResponse.redirect(destination);

  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });

  ["Cache-Control", "Expires", "Pragma"].forEach((name) => {
    const value = response.headers.get(name);
    if (value) redirect.headers.set(name, value);
  });

  return redirect;
}

export async function proxy(request: NextRequest) {
  const { claims, reason, response } = await updateSupabaseSession(request);
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isSignIn = pathname === "/sign-in";
  const isAuthenticated = typeof claims?.sub === "string";

  if (isDashboard && !isAuthenticated) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/sign-in";
    signInUrl.search = "";
    signInUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    if (reason === "configuration") signInUrl.searchParams.set("error", "configuration");
    if (reason === "unavailable") signInUrl.searchParams.set("error", "unavailable");

    return redirectWithAuthCookies(response, signInUrl);
  }

  if (isSignIn && isAuthenticated) {
    const dashboardUrl = new URL(DEFAULT_AUTH_REDIRECT, request.url);
    return redirectWithAuthCookies(response, dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/", "/sign-in", "/dashboard/:path*"],
};
