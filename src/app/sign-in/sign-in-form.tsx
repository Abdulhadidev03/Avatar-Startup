"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useId, useRef, useState } from "react";

type SignInFormProps = {
  configured: boolean;
  initialMessage: string | null;
  nextPath: string;
};

type Stage = "email" | "code";
type PendingAction = "email" | "code" | "resend" | "google" | null;
type MessageKind = "error" | "status";

function friendlyAuthError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("provider") || message.includes("google")) {
    return "Google sign-in is not available for this project. Use email instead.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Please wait a moment before requesting another code.";
  }

  if (message.includes("configuration") || message.includes("api key")) {
    return "Sign-in is not configured for this deployment yet.";
  }

  return fallback;
}

function callbackUrl(nextPath: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function SignInForm({ configured, initialMessage, nextPath }: SignInFormProps) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<PendingAction>(null);
  const [message, setMessage] = useState(initialMessage);
  const [messageKind, setMessageKind] = useState<MessageKind>(initialMessage ? "error" : "status");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const emailId = useId();
  const codeId = useId();
  const messageId = useId();

  useEffect(() => {
    if (stage === "code") {
      codeInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, [stage]);

  function showMessage(nextMessage: string, kind: MessageKind) {
    setMessage(nextMessage);
    setMessageKind(kind);
  }

  function emailIsValid() {
    return /^\S+@\S+\.\S+$/.test(email.trim());
  }

  async function sendCode(targetEmail: string, action: "email" | "resend") {
    setPending(action);
    setMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          // Supabase creates a first-time account by default. Make that choice
          // explicit so passwordless sign-in remains the only onboarding path.
          shouldCreateUser: true,
          emailRedirectTo: callbackUrl(nextPath),
        },
      });

      if (error) {
        showMessage(friendlyAuthError(error, "We could not send a code. Please try again."), "error");
        return false;
      }

      return true;
    } catch (error) {
      showMessage(friendlyAuthError(error, "We could not send a code. Please try again."), "error");
      return false;
    } finally {
      setPending(null);
    }
  }

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      showMessage("Sign-in is not configured for this deployment yet.", "error");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      showMessage("Enter a valid email address to receive a code.", "error");
      emailInputRef.current?.focus();
      return;
    }

    if (!(await sendCode(normalizedEmail, "email"))) {
      return;
    }

    setEmail(normalizedEmail);
    setStage("code");
    showMessage(`A 6-digit code is on its way to ${normalizedEmail}.`, "status");
  }

  // Resend in place. The previous handler dropped the user back to the email
  // step, forcing them to retype an address they had already entered.
  async function resendCode() {
    if (!configured) {
      showMessage("Sign-in is not configured for this deployment yet.", "error");
      return;
    }

    setCode("");

    if (!(await sendCode(email, "resend"))) {
      return;
    }

    showMessage(`A new 6-digit code is on its way to ${email}.`, "status");
    codeInputRef.current?.focus();
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (code.length !== 6) {
      showMessage("Enter the 6-digit code from your email.", "error");
      codeInputRef.current?.focus();
      return;
    }

    setPending("code");
    setMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });

      if (error || !data.session) {
        showMessage(friendlyAuthError(error, "That code did not work. Request a new one and try again."), "error");
        return;
      }

      // A full navigation makes the new cookie-backed session immediately
      // available to the proxy and server-rendered dashboard.
      window.location.assign(nextPath);
    } catch (error) {
      showMessage(friendlyAuthError(error, "That code did not work. Request a new one and try again."), "error");
    } finally {
      setPending(null);
    }
  }

  async function continueWithGoogle() {
    if (!configured) {
      showMessage("Sign-in is not configured for this deployment yet.", "error");
      return;
    }

    setPending("google");
    setMessage(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(nextPath),
        },
      });

      if (error) {
        showMessage(friendlyAuthError(error, "We could not start Google sign-in. Please try email instead."), "error");
        setPending(null);
      }
    } catch (error) {
      showMessage(friendlyAuthError(error, "We could not start Google sign-in. Please try email instead."), "error");
      setPending(null);
    }
  }

  function returnToEmail() {
    setStage("email");
    setCode("");
    setMessage(null);
  }

  const isBusy = pending !== null;

  return (
    <div className="ruh-auth-form-wrap" id="sign-in-form">
      {message ? (
        <p
          className={`ruh-auth-message is-${messageKind}`}
          id={messageId}
          role={messageKind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      {stage === "email" ? (
        <>
          <button
            className="ruh-auth-google-button"
            type="button"
            disabled={!configured || isBusy}
            aria-busy={pending === "google"}
            onClick={continueWithGoogle}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.24c0-.77-.07-1.51-.2-2.22H12v4.2h5.23a4.47 4.47 0 0 1-1.94 2.93v2.73h3.53c2.07-1.9 3.27-4.7 3.27-7.64Z"/><path fill="#34A853" d="M12 21.7c2.62 0 4.82-.87 6.42-2.36l-3.53-2.73c-.98.66-2.24 1.05-3.89 1.05-2.99 0-5.53-2.02-6.44-4.73H.91v2.82A9.7 9.7 0 0 0 12 21.7Z"/><path fill="#FBBC05" d="M5.56 12.93A5.82 5.82 0 0 1 5.2 10.9c0-.7.13-1.37.36-2.03V6.05H.91a9.7 9.7 0 0 0 0 8.7l4.65-1.82Z"/><path fill="#EA4335" d="M12 5.06c1.68 0 3.18.58 4.36 1.7l3.25-3.25C17.63 1.68 15.04.5 12 .5 8.24.5 4.99 2.65 3.36 5.79l3.8 2.94c.96-2.87 3.64-4.67 6.84-4.67Z"/></svg>
            <span>{pending === "google" ? "Opening Google…" : "Continue with Google"}</span>
          </button>

          <div className="ruh-auth-divider" aria-hidden="true"><span>or</span></div>

          <form className="ruh-auth-form" onSubmit={requestCode} noValidate>
            <label htmlFor={emailId}>Email address</label>
            <input
              ref={emailInputRef}
              id={emailId}
              type="email"
              name="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              disabled={!configured || isBusy}
              aria-describedby={message ? messageId : undefined}
              required
            />
            <button
              className="ruh-auth-primary-button"
              type="submit"
              disabled={!configured || isBusy || !emailIsValid()}
              aria-busy={pending === "email"}
            >
              {pending === "email" ? "Sending code…" : "Continue with email"}
            </button>
          </form>
          <p className="ruh-auth-help">New here? Your first code creates your secure workspace access automatically.</p>
        </>
      ) : (
        <form className="ruh-auth-form" onSubmit={verifyCode} noValidate>
          <div className="ruh-auth-code-heading">
            <div>
              <label htmlFor={codeId}>6-digit code</label>
              <p>Enter the code sent to <strong>{email}</strong>.</p>
            </div>
            <button type="button" onClick={returnToEmail} disabled={isBusy}>Use another email</button>
          </div>
          <input
            ref={codeInputRef}
            className="ruh-auth-code-input"
            id={codeId}
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            disabled={isBusy}
            aria-describedby={message ? messageId : undefined}
            required
          />
          <button
            className="ruh-auth-primary-button"
            type="submit"
            disabled={isBusy || code.length !== 6}
            aria-busy={pending === "code"}
          >
            {pending === "code" ? "Confirming…" : "Sign in"}
          </button>
          <button
            className="ruh-auth-text-button"
            type="button"
            disabled={isBusy}
            aria-busy={pending === "resend"}
            onClick={resendCode}
          >
            {pending === "resend" ? "Sending a new code…" : "Didn’t receive a code? Send another"}
          </button>
        </form>
      )}
    </div>
  );
}
