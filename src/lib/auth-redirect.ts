export const DEFAULT_AUTH_REDIRECT = "/dashboard/agents";

/**
 * Permit only internal dashboard destinations after authentication. Restricting
 * this to dashboard URLs prevents an attacker-controlled `next` query value
 * from becoming an open redirect.
 */
export function getSafeAuthRedirect(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  const lowerCaseNext = next.toLowerCase();
  if (
    next.includes("\\") ||
    lowerCaseNext.includes("%2f") ||
    lowerCaseNext.includes("%5c")
  ) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const base = "https://ruhana.invalid";
    const url = new URL(next, base);

    const isDashboardPath =
      url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/");

    if (url.origin !== base || !isDashboardPath) {
      return DEFAULT_AUTH_REDIRECT;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}
