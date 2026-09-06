import { DEFAULT_AUTH_REDIRECT, getSafeAuthRedirect } from "@/lib/auth-redirect";
import { getAuthenticatedRuhanaUser } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RuhanaLogo } from "../dashboard/dashboard-icons";
import { SignInForm } from "./sign-in-form";
import "./sign-in.css";

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function signInMessage(error: string | undefined, authReason: string) {
  if (error === "configuration" || authReason === "configuration") {
    return "Sign-in is not configured for this deployment yet. Add the public Supabase URL and key, then try again.";
  }

  if (error === "unavailable" || authReason === "unavailable") {
    return "We could not reach the sign-in service. Please try again in a moment.";
  }

  if (error === "callback") {
    return "That sign-in link could not be confirmed. Request a fresh code and try again.";
  }

  return null;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const auth = await getAuthenticatedRuhanaUser();

  // Visiting the sign-in screen while already authenticated should always
  // return to the product's primary dashboard destination.
  if (auth.user) {
    redirect(DEFAULT_AUTH_REDIRECT);
  }

  const nextPath = getSafeAuthRedirect(firstValue(query.next));
  const initialMessage = signInMessage(firstValue(query.error), auth.reason);
  const configured = auth.reason !== "configuration";

  return (
    <main className="ruh-auth-page">
      <a className="ruh-auth-skip-link" href="#sign-in-form">Skip to sign in</a>

      <section className="ruh-auth-story" aria-labelledby="ruh-auth-story-title">
        <Link className="ruh-auth-logo-link" href="/" aria-label="Ruhana home">
          <RuhanaLogo />
        </Link>

        <div className="ruh-auth-halo" aria-hidden="true">
          <span className="ruh-auth-halo-ring ruh-auth-halo-ring-one" />
          <span className="ruh-auth-halo-ring ruh-auth-halo-ring-two" />
          <span className="ruh-auth-atlas-tile ruh-auth-atlas-one" />
          <span className="ruh-auth-atlas-tile ruh-auth-atlas-two" />
          <span className="ruh-auth-atlas-tile ruh-auth-atlas-three" />
        </div>

        <div className="ruh-auth-story-copy">
          <p className="ruh-auth-eyebrow">Ruhana workspace</p>
          <h1 id="ruh-auth-story-title">A more human welcome for every visitor.</h1>
          <p>Build, launch, and improve video agents from one calm workspace.</p>
        </div>

        <div className="ruh-auth-story-note" aria-label="Ruhana product promise">
          <span aria-hidden="true">✦</span>
          <p>Clear context. Confident conversations. Useful outcomes.</p>
        </div>
      </section>

      <section className="ruh-auth-panel" aria-labelledby="sign-in-title">
        <div className="ruh-auth-panel-inner">
          <Link className="ruh-auth-mobile-logo" href="/" aria-label="Ruhana home"><RuhanaLogo /></Link>
          <div className="ruh-auth-heading">
            <p className="ruh-auth-eyebrow">Welcome back</p>
            <h2 id="sign-in-title">Sign in</h2>
            <p>Use Google or a one-time code sent to your email.</p>
          </div>

          <SignInForm
            configured={configured}
            initialMessage={initialMessage}
            nextPath={nextPath}
          />
        </div>
      </section>
    </main>
  );
}
