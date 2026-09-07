"use client";

import { FormEvent, RefObject, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AnamClient } from "@anam-ai/js-sdk";
import { RuhanaLogo } from "@/components/ruhana-logo";
import { avatarById } from "./dashboard/mock-data";

type LandingPageProps = {
  authenticated: boolean;
};

type DemoStatus = "idle" | "connecting" | "live" | "error" | "ended";
type DemoMessage = { role: "user" | "assistant"; text: string };
type DemoMedia = { id?: string | null; name?: string | null; imageUrl?: string | null; videoUrl?: string | null };

type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "close"
  | "code"
  | "eye"
  | "mail"
  | "mic"
  | "mute"
  | "send"
  | "spark"
  | "volume";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    code: <><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></>,
    mute: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6M21 9l-5 6"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    spark: <><path d="m12 2 1.2 4.1a6.5 6.5 0 0 0 4.5 4.5L22 12l-4.3 1.4a6.5 6.5 0 0 0-4.5 4.5L12 22l-1.2-4.1a6.5 6.5 0 0 0-4.5-4.5L2 12l4.3-1.4a6.5 6.5 0 0 0 4.5-4.5Z"/></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12"/></>,
  };

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}
      stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
      {paths[name]}
    </svg>
  );
}

function AtlasAvatar({ index, className = "" }: { index: number; className?: string }) {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <span
      aria-hidden="true"
      className={`lp-atlas-avatar ${className}`.trim()}
      style={{
        backgroundPosition: `${column * 33.333}% ${row * 100}%`,
      }}
    />
  );
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.dataset.visible = "true");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.visible = "true";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function useDockedRect(anchorRef: RefObject<HTMLDivElement | null>, expanded: boolean) {
  const [geometry, setGeometry] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    progress: 0,
    shapeProgress: 0,
    ready: false,
  });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const documentTop = rect.top + window.scrollY;
      const start = Math.max(0, documentTop - 116);
      const distance = viewportWidth < 760 ? 300 : 540;
      const raw = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
      const progress = raw * raw * (3 - 2 * raw);
      const shapeRaw = Math.min(1, raw * 1.7);
      const shapeProgress = shapeRaw * shapeRaw * (3 - 2 * shapeRaw);

      const compactWidth = viewportWidth < 760 ? Math.min(viewportWidth - 24, 390) : 352;
      const compactHeight = viewportWidth < 760 ? 108 : 122;
      const panelWidth = Math.min(viewportWidth - 24, 410);
      const panelHeight = Math.min(viewportHeight - 24, 610);
      const targetWidth = expanded && progress > 0.7 ? panelWidth : compactWidth;
      const targetHeight = expanded && progress > 0.7 ? panelHeight : compactHeight;
      const gutter = viewportWidth < 760 ? 12 : 22;
      const targetLeft = viewportWidth - targetWidth - gutter;
      const targetTop = viewportHeight - targetHeight - gutter;

      setGeometry({
        left: rect.left + (targetLeft - rect.left) * progress,
        top: rect.top + (targetTop - rect.top) * progress,
        width: rect.width + (targetWidth - rect.width) * shapeProgress,
        height: rect.height + (targetHeight - rect.height) * shapeProgress,
        progress,
        shapeProgress,
        ready: true,
      });
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [anchorRef, expanded]);

  return geometry;
}

type LiveContext = {
  url?: string;
  path?: string;
  scrollDepth?: number;
  visibleSection?: string;
  lastClick?: string;
};

type JourneyEvent = {
  type: string;
  path?: string;
  title?: string;
  tag?: string;
  text?: string | null;
  href?: string | null;
  seconds?: number;
  depth?: number;
  ts?: number;
};

const JOURNEY_KEY = "ruhana_journey_v1";
const JOURNEY_LIMIT = 20;

function readScrollDepth() {
  try {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight || 1;
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 1,
    );
    return Math.min(100, Math.max(0, Math.round(((scrollTop + viewportHeight) / documentHeight) * 100)));
  } catch {
    return 0;
  }
}

function readVisibleSection(): string | null {
  try {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>("h1,h2,h3,[data-section],section[aria-label]"),
    );
    const viewportHeight = window.innerHeight || 800;
    const focusLine = viewportHeight * 0.35;

    let onScreen: HTMLElement | null = null;
    let onScreenDistance = Number.POSITIVE_INFINITY;
    let lastPassed: HTMLElement | null = null;
    let lastPassedTop = Number.NEGATIVE_INFINITY;

    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      // A heading actually on screen wins — it is what the visitor can read.
      if (rect.top >= -40 && rect.top <= viewportHeight * 0.75) {
        const distance = Math.abs(rect.top - focusLine);
        if (distance < onScreenDistance) {
          onScreenDistance = distance;
          onScreen = candidate;
        }
      }

      // Otherwise fall back to the last heading scrolled past: sections on this
      // page are far taller than the viewport, so for most scroll positions no
      // heading is on screen at all and the visitor is *inside* a section.
      if (rect.top < focusLine && rect.top > lastPassedTop) {
        lastPassedTop = rect.top;
        lastPassed = candidate;
      }
    }

    const chosen = onScreen ?? lastPassed;
    if (!chosen) return null;
    const label = (chosen.innerText || chosen.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 80);
    return label || null;
  } catch {
    return null;
  }
}

/**
 * Mirrors the visitor tracking the embed script runs on customer sites, so the
 * landing demo reaches /api/brain with the same live context a real deployment
 * sends. Without this the agent cannot tell what the visitor is looking at.
 */
function useVisitorContext() {
  const recentEventsRef = useRef<JourneyEvent[]>([]);
  const lastClickRef = useRef<string | null>(null);

  // Computed on demand rather than on every scroll tick: reading the visible
  // section walks the DOM, and it is only ever needed when the agent answers.
  const getLiveContext = useCallback((): LiveContext => ({
    url: window.location.href.slice(0, 2048),
    path: window.location.pathname.slice(0, 512),
    scrollDepth: readScrollDepth(),
    visibleSection: readVisibleSection() ?? undefined,
    lastClick: lastClickRef.current ?? undefined,
  }), []);

  useEffect(() => {
    const scrollMarks: Record<number, boolean> = {};
    const startedAt = Date.now();

    const remember = (event: JourneyEvent) => {
      recentEventsRef.current = [...recentEventsRef.current, event].slice(-JOURNEY_LIMIT);
      try {
        window.sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(recentEventsRef.current));
      } catch {
        // Blocked storage must never interrupt the page.
      }
    };

    try {
      const stored: unknown = JSON.parse(window.sessionStorage.getItem(JOURNEY_KEY) ?? "[]");
      if (Array.isArray(stored)) recentEventsRef.current = stored.slice(-JOURNEY_LIMIT);
    } catch {
      recentEventsRef.current = [];
    }

    remember({ type: "page_view", path: window.location.pathname, title: document.title, ts: Date.now() });

    const onScroll = () => {
      const depth = readScrollDepth();
      for (const milestone of [25, 50, 75, 100]) {
        if (depth >= milestone && !scrollMarks[milestone]) {
          scrollMarks[milestone] = true;
          remember({ type: "scroll", path: window.location.pathname, depth: milestone, ts: Date.now() });
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      try {
        const target = event.target as HTMLElement | null;
        const control = target?.closest?.(
          "a,button,[role='button'],input[type='submit'],input[type='button']",
        ) as HTMLElement | null;
        // Skip the demo panel's own controls — those are not visitor intent.
        if (!control || control.closest(".demo-shell")) return;

        const tag = control.tagName.toLowerCase();
        const raw = (
          control.innerText ||
          (control as HTMLInputElement).value ||
          control.getAttribute("aria-label") ||
          ""
        ).trim().replace(/\s+/g, " ");
        const text = raw.slice(0, 50);

        const href = control.getAttribute("href");
        let safeHref: string | null = null;
        if (href) {
          try {
            const hrefUrl = new URL(href, window.location.href);
            safeHref = hrefUrl.origin === window.location.origin
              ? hrefUrl.pathname.slice(0, 512)
              : hrefUrl.hostname.slice(0, 120);
          } catch {
            safeHref = null;
          }
        }

        lastClickRef.current = `${text ? `"${text}" ` : ""}(${tag}${safeHref ? ` to ${safeHref}` : ""})`;
        remember({ type: "click", path: window.location.pathname, tag, text: text || null, href: safeHref, ts: Date.now() });
      } catch {
        // Tracking must never interrupt the page.
      }
    };

    const onHide = () => {
      remember({
        type: "page_time",
        path: window.location.pathname,
        seconds: Math.round((Date.now() - startedAt) / 1000),
        ts: Date.now(),
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", onHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  return { getLiveContext, recentEventsRef };
}

function LiveDemo({ anchorRef }: { anchorRef: RefObject<HTMLDivElement | null> }) {
  const [expanded, setExpanded] = useState(false);
  const geometry = useDockedRect(anchorRef, expanded);
  const [status, setStatus] = useState<DemoStatus>("idle");
  const [media, setMedia] = useState<DemoMedia>({});
  const [messages, setMessages] = useState<DemoMessage[]>([
    { role: "assistant", text: "Hi — want help choosing the right plan for your team?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [micMuted, setMicMuted] = useState(true);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anamRef = useRef<AnamClient | null>(null);
  const sessionRef = useRef<{ token: string; id: string } | null>(null);
  const sessionPromiseRef = useRef<Promise<{ token: string; id: string }> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const historyIndexRef = useRef(-1);
  const { getLiveContext, recentEventsRef } = useVisitorContext();

  const docked = geometry.shapeProgress > 0.72;
  const displayMode = expanded && docked ? "expanded" : docked ? "docked" : "hero";

  useEffect(() => {
    fetch("/api/landing-media")
      .then((response) => response.ok ? response.json() : {})
      .then((data: DemoMedia) => setMedia(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const video = document.getElementById("landing-avatar-video") as HTMLVideoElement | null;
    if (video) video.muted = speakerMuted || status !== "live";
  }, [speakerMuted, status]);

  useEffect(() => () => {
    if (anamRef.current) void anamRef.current.stopStreaming();
  }, []);

  const addMessage = useCallback((role: DemoMessage["role"], text: string) => {
    setMessages((current) => [...current, { role, text }]);
  }, []);

  const getBackendSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    sessionPromiseRef.current = fetch("/api/demo-session", { method: "POST" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "The live preview could not start.");
        const session = { token: body.sessionToken as string, id: body.sessionId as string };
        sessionRef.current = session;
        return session;
      })
      .finally(() => {
        sessionPromiseRef.current = null;
      });

    return sessionPromiseRef.current;
  }, []);

  const askBrain = useCallback(async (text: string, id: string) => {
    const response = await fetch("/api/brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: id,
        userText: text,
        liveContext: getLiveContext(),
        recentEvents: recentEventsRef.current.slice(-15),
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Ruhana could not answer just now.");
    return String(body.replyText ?? "").trim();
  }, [getLiveContext, recentEventsRef]);

  const connectVoice = useCallback(async () => {
    if (anamRef.current?.isStreaming()) return anamRef.current;
    setStatus("connecting");
    setError(null);
    setExpanded(true);

    try {
      const session = await getBackendSession();
      const { AnamEvent, createClient } = await import("@anam-ai/js-sdk");
      const anam = createClient(session.token);
      anamRef.current = anam;
      historyIndexRef.current = -1;

      anam.addListener(AnamEvent.SESSION_READY, () => {
        setStatus("live");
        setMicMuted(false);
        setSpeakerMuted(false);
        const greeting = "Hi — I can see you’re exploring Ruhana. What would you like to know?";
        addMessage("assistant", greeting);
        void anam.talk(greeting);
      });

      anam.addListener(AnamEvent.MIC_PERMISSION_DENIED, () => {
        setMicMuted(true);
        setError("Microphone access is off. You can still type below.");
      });

      anam.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        anamRef.current = null;
        setMicMuted(true);
        setStatus("ended");
      });

      anam.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (history) => {
        const index = history.length - 1;
        if (index <= historyIndexRef.current) return;
        const latest = history[index];
        if (!latest || latest.role !== "user") return;
        const text = String(latest.content ?? "").trim();
        if (!text) return;
        historyIndexRef.current = index;
        addMessage("user", text);

        try {
          const reply = await askBrain(text, session.id);
          if (!reply) return;
          addMessage("assistant", reply);
          await anam.talk(reply);
        } catch {
          setError("I lost that answer. Please try once more.");
        }
      });

      await anam.streamToVideoElement("landing-avatar-video");
      return anam;
    } catch (cause) {
      setStatus("error");
      setMicMuted(true);
      setError(cause instanceof Error ? cause.message : "The live preview could not start.");
      return null;
    }
  }, [addMessage, askBrain, getBackendSession]);

  const handleMic = useCallback(async () => {
    const current = anamRef.current;
    if (!current?.isStreaming()) {
      await connectVoice();
      return;
    }
    if (current.getInputAudioState().isMuted) {
      current.unmuteInputAudio();
      setMicMuted(false);
    } else {
      current.muteInputAudio();
      setMicMuted(true);
    }
  }, [connectVoice]);

  const sendMessage = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setError(null);
    setExpanded(true);
    addMessage("user", text);

    try {
      const session = await getBackendSession();
      const reply = await askBrain(text, session.id);
      if (reply) {
        addMessage("assistant", reply);
        if (anamRef.current?.isStreaming()) await anamRef.current.talk(reply);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ruhana could not answer just now.");
    } finally {
      setSending(false);
    }
  }, [addMessage, askBrain, getBackendSession, input, sending]);

  const endSession = useCallback(async () => {
    if (anamRef.current) await anamRef.current.stopStreaming();
    anamRef.current = null;
    sessionRef.current = null;
    setStatus("ended");
    setMicMuted(true);
    setExpanded(false);
  }, []);

  if (!geometry.ready) return null;

  return (
    <aside
      aria-label="Try Ruhana live"
      className="demo-shell"
      data-mode={displayMode}
      data-status={status}
      style={{
        "--dock-progress": geometry.shapeProgress,
        height: geometry.height,
        left: geometry.left,
        top: geometry.top,
        width: geometry.width,
      } as React.CSSProperties}
    >
      <div className="demo-hero-view">
        <div className="demo-video-panel">
          {media.videoUrl ? (
            <video
              autoPlay
              className="demo-avatar-video"
              id="landing-avatar-video"
              loop={status !== "live"}
              muted={speakerMuted || status !== "live"}
              playsInline
              poster={media.imageUrl ?? undefined}
              src={status === "live" ? undefined : media.videoUrl}
            />
          ) : (
            <AtlasAvatar className="demo-avatar-fallback" index={1} />
          )}
          {!media.videoUrl && <video aria-hidden="true" className="demo-stream-target" id="landing-avatar-video" autoPlay playsInline />}
          <div className="demo-video-wash" />
          <div className="demo-live-label"><span /> {status === "live" ? "Live" : "Preview"}</div>
          <div className="demo-avatar-caption">
            <strong>{media.name ?? "Ruhana guide"}</strong>
            <span>Ruhana product guide</span>
          </div>
          <button className="demo-sound" onClick={() => setSpeakerMuted((value) => !value)}
            type="button" aria-label={speakerMuted ? "Turn sound on" : "Mute sound"}>
            <Icon name={speakerMuted ? "mute" : "volume"} />
          </button>
        </div>

        <div className="demo-conversation-panel">
          <div className="demo-panel-head">
            <div>
              <span className="demo-kicker">Live conversation</span>
              <strong>Help, without the hunt.</strong>
            </div>
            <span className="demo-presence"><i /> Available now</span>
          </div>

          <div className="demo-transcript" ref={transcriptRef} aria-live="polite">
            {messages.slice(-4).map((message, index) => (
              <div className="demo-message" data-role={message.role} key={`${message.role}-${index}-${message.text.slice(0, 12)}`}>
                {message.text}
              </div>
            ))}
            {sending && <div className="demo-thinking"><i/><i/><i/><span className="sr-only">Ruhana is thinking</span></div>}
          </div>

          <div className="demo-context-card">
            <div className="demo-context-title"><Icon name="eye" size={15}/><span>Page context</span><b>Live</b></div>
            <div className="demo-context-row"><span>Viewing</span><strong>Growth plan</strong></div>
            <div className="demo-context-row"><span>Intent</span><strong>Comparing options</strong></div>
          </div>

          {error && <p className="demo-error" role="status">{error}</p>}
          <form className="demo-composer" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="hero-demo-message">Ask Ruhana a question</label>
            <input id="hero-demo-message" onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about pricing, setup, or your use case…" value={input} />
            <button className="demo-icon-button" data-active={status === "live" && !micMuted}
              onClick={handleMic} type="button" aria-label={status === "live" ? (micMuted ? "Unmute microphone" : "Mute microphone") : "Start voice conversation"}>
              <Icon name="mic" />
            </button>
            <button className="demo-send" disabled={!input.trim() || sending} type="submit" aria-label="Send message">
              <Icon name="send" size={17}/>
            </button>
          </form>
          <p className="demo-permission-note">Voice starts only when you press the microphone.</p>
        </div>
      </div>

      <div className="demo-compact-view">
        <button className="demo-compact-main" onClick={() => setExpanded(true)} type="button" aria-label="Open Ruhana assistant">
          {media.imageUrl ? (
            <span
              className="demo-thumb"
              style={{ backgroundImage: `url(${media.imageUrl})` }}
            />
          ) : (
            <AtlasAvatar className="demo-thumb" index={1} />
          )}
          <span className="demo-compact-copy"><strong>Need a hand?</strong><small>Ask Maya about this page</small></span>
        </button>
        <button className="demo-compact-mic" data-active={status === "live" && !micMuted} onClick={handleMic}
          type="button" aria-label={status === "live" ? (micMuted ? "Unmute microphone" : "Mute microphone") : "Talk to Maya"}>
          <Icon name="mic" size={19}/>
        </button>
      </div>

      <div className="demo-mobile-head">
        <div><span className="demo-presence"><i /> {status === "live" ? "Live" : "Ready"}</span><strong>Maya · Ruhana</strong></div>
        <div className="demo-mobile-actions">
          {status === "live" && <button onClick={endSession} type="button">End</button>}
          <button onClick={() => setExpanded(false)} type="button" aria-label="Minimize assistant"><Icon name="close"/></button>
        </div>
      </div>
    </aside>
  );
}

const steps = [
  { number: "01", title: "Choose a face", body: "Select a Ruhana avatar or create one from a photo you own." },
  { number: "02", title: "Give it context", body: "Add your website, files, voice, tone, and the outcomes that matter." },
  { number: "03", title: "Shape the conversation", body: "Set goals, guardrails, handoffs, and actions in plain language." },
  { number: "04", title: "Copy one line", body: "Preview it, publish it, and follow every useful result from the dashboard." },
];

const builderAvatars = [
  { name: "Sarah", kind: "Real", imageUrl: avatarById("sarah").imageUrl },
  { name: "Sarah", kind: "Animated", imageUrl: "/avatars/sarah-animated-v1.webp" },
  { name: "Rumi", kind: "Animal", imageUrl: "/avatars/rumi-red-panda-v1.webp" },
];

const roles = [
  { name: avatarById("sarah").name, role: avatarById("sarah").title, imageUrl: avatarById("sarah").imageUrl, line: "Turns comparison into clarity." },
  { name: avatarById("anne").name, role: avatarById("anne").title, imageUrl: avatarById("anne").imageUrl, line: "Resolves the question in context." },
  { name: avatarById("gabriel").name, role: avatarById("gabriel").title, imageUrl: avatarById("gabriel").imageUrl, line: "Shows the next useful step." },
];

export default function LandingPage({ authenticated }: LandingPageProps) {
  const heroDemoRef = useRef<HTMLDivElement>(null);
  const [navRaised, setNavRaised] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const activeBuilderAvatarIndex = activeStep < 3 ? activeStep : 0;
  useReveal();

  useEffect(() => {
    const onScroll = () => setNavRaised(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const stepNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-builder-step]"));
    let animationFrame = 0;

    const updateActiveStep = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const focusLine = window.innerHeight * 0.48;
        let closestStep = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        stepNodes.forEach((node) => {
          const bounds = node.getBoundingClientRect();
          const distance = Math.abs(bounds.top + bounds.height / 2 - focusLine);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestStep = Number(node.dataset.builderStep);
          }
        });

        setActiveStep(closestStep);
      });
    };

    updateActiveStep();
    window.addEventListener("scroll", updateActiveStep, { passive: true });
    window.addEventListener("resize", updateActiveStep);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateActiveStep);
      window.removeEventListener("resize", updateActiveStep);
    };
  }, []);

  const primaryHref = authenticated ? "/dashboard/agents" : "/sign-in";
  const primaryLabel = authenticated ? "Go to app" : "Build your agent";

  return (
    <div className="landing-root">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="lp-nav" data-raised={navRaised}>
        <RuhanaLogo href="/" />
        <button className="lp-menu-button" onClick={() => setMenuOpen((value) => !value)} type="button"
          aria-controls="landing-navigation" aria-expanded={menuOpen} aria-label="Toggle navigation">
          <span/><span/>
        </button>
        <nav aria-label="Main navigation" className="lp-nav-links" data-open={menuOpen} id="landing-navigation">
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#use-cases" onClick={() => setMenuOpen(false)}>Use cases</a>
          <a href="#impact" onClick={() => setMenuOpen(false)}>Impact</a>
          <Link href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
          <a href="#developers" onClick={() => setMenuOpen(false)}>Developers</a>
        </nav>
        <div className="lp-nav-actions">
          {!authenticated && <Link className="lp-text-link" href="/sign-in">Sign in</Link>}
          <Link className="lp-button lp-button-dark lp-button-small" href={primaryHref}>{primaryLabel}<Icon name="arrow" size={16}/></Link>
        </div>
      </header>

      <main id="main-content">
        <section className="lp-hero" id="product">
          <div className="lp-hero-copy" data-reveal>
            <span className="lp-eyebrow"><i/> Context-aware video agents</span>
            <h1>An agent that understands the page—and <em>knows what to do next.</em></h1>
            <p>Ruhana sees the products, clicks, questions, and intent behind every visit. Then it talks, guides, and takes action.</p>
            <div className="lp-hero-actions">
              <Link className="lp-button lp-button-dark" href={primaryHref}>{primaryLabel}<Icon name="arrow"/></Link>
              <a className="lp-button lp-button-light" href="#context">See how it works<Icon name="chevron"/></a>
            </div>
            <div className="lp-hero-facts" aria-label="Product highlights">
              <span><Icon name="check" size={15}/> Four guided steps</span>
              <span><Icon name="check" size={15}/> One-line install</span>
              <span><Icon name="check" size={15}/> Voice and chat</span>
            </div>
          </div>
          <div className="lp-hero-stage" ref={heroDemoRef} aria-hidden="true">
            <div className="lp-stage-loading">Preparing the live Ruhana preview…</div>
          </div>
          <div className="lp-scroll-cue"><span>Scroll to watch it become your widget</span><i/></div>
        </section>

        <LiveDemo anchorRef={heroDemoRef}/>

        <section className="lp-context-section lp-section" id="context">
          <div className="lp-section-heading" data-reveal>
            <span className="lp-index">01 · Context</span>
            <h2>It reads the room.<br/><em>Because it reads the page.</em></h2>
            <p>A generic chatbot waits for the visitor to explain everything. Ruhana already understands the page, the journey, and the signals around the question.</p>
          </div>
          <div className="context-browser" data-reveal>
            <div className="browser-bar"><i/><i/><i/><span>yourstore.com/products/studio-chair</span><b>Live context</b></div>
            <div className="browser-content">
              <div className="browser-product-art">
                <div className="chair-art"><span className="chair-back"/><span className="chair-seat"/><span className="chair-base"/></div>
                <span className="product-tag">New collection · 04</span>
              </div>
              <div className="browser-product-copy">
                <span className="lp-kicker">Form / 04</span>
                <h3>Studio chair</h3>
                <p>Designed for long focus. Built from recycled aluminium and natural wool.</p>
                <div className="product-price"><strong>$680</strong><span>Ships in 3–5 days</span></div>
                <button type="button">Choose a finish</button>
              </div>
            </div>
            <div className="context-signal signal-one"><span>01</span><div><small>Page</small><strong>Studio chair</strong></div></div>
            <div className="context-signal signal-two"><span>02</span><div><small>Behaviour</small><strong>Compared 3 finishes</strong></div></div>
            <div className="context-signal signal-three"><span>03</span><div><small>Intent</small><strong>Delivery concern</strong></div></div>
          </div>
        </section>

        <section className="lp-action-section lp-section">
          <div className="action-grid">
            <div className="action-copy" data-reveal>
              <span className="lp-index lp-index-light">02 · Action</span>
              <h2>From hesitation to a <em>useful next step.</em></h2>
              <p>Ruhana does more than answer. It can recommend, compare, capture details, book a meeting, begin checkout, or hand the conversation to a person.</p>
            </div>
            <div className="action-sequence" data-reveal>
              <div className="action-question"><span>Visitor</span><p>Will this fit under a 72 cm desk?</p></div>
              <div className="action-route"><i/><span>Ruhana considers page + product + intent</span><i/></div>
              <div className="action-answer"><span>Ruhana</span><p>Yes. With the standard base, the arms lower to 68 cm. I can set that configuration for you.</p></div>
              <div className="action-outcome"><Icon name="spark"/><div><small>Next best action</small><strong>Configure standard base</strong></div><button type="button" aria-label="Continue"><Icon name="arrow"/></button></div>
            </div>
          </div>
          <div className="action-capabilities" data-reveal>
            {[
              ["01", "Recommend", "Match the right option"],
              ["02", "Qualify", "Understand real intent"],
              ["03", "Act", "Book, capture, or convert"],
              ["04", "Handoff", "Bring in a human cleanly"],
            ].map(([number, title, body]) => <article key={number}><span>{number}</span><strong>{title}</strong><small>{body}</small></article>)}
          </div>
        </section>

        <section className="lp-builder-section lp-section" id="how-it-works">
          <div className="builder-intro" data-reveal>
            <span className="lp-index">03 · Build</span>
            <h2>From idea to live<br/><em>in four clear steps.</em></h2>
            <p>No prompt engineering. No maze of settings. Every screen answers one question and moves you closer to a working agent.</p>
          </div>
          <div className="builder-layout">
            <div className="builder-preview" data-step={activeStep}>
              <div className="builder-window">
                <div className="builder-window-head"><RuhanaLogo href="/" compact/><span>New agent</span><b>Step {activeStep + 1} of 4</b></div>
                <div className="builder-progress"><i/><i/><i/><i/></div>
                <div className="builder-screen builder-screen-avatar">
                  <span className="lp-kicker">Choose an avatar</span>
                  <h3>A presence your visitors will remember.</h3>
                  <div className="builder-avatar-stage" aria-live="polite">
                    {builderAvatars.map((avatar, index) => (
                      <div
                        aria-hidden={activeBuilderAvatarIndex !== index}
                        className="builder-avatar-frame"
                        data-active={activeBuilderAvatarIndex === index}
                        key={avatar.name + "-" + avatar.kind}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" loading={index === 0 ? "eager" : "lazy"} src={avatar.imageUrl}/>
                        <span>{avatar.kind}</span>
                      </div>
                    ))}
                    <div className="builder-avatar-switcher" aria-hidden="true">
                      {builderAvatars.map((avatar, index) => <i data-active={activeBuilderAvatarIndex === index} key={avatar.kind + "-indicator"}/>)}
                    </div>
                  </div>
                  <div className="builder-field"><span>Agent name</span><strong>{["Sarah · Sales partner", "Sarah · Animated", "Rumi · Animal avatar", "Sarah · Live"][activeStep]}</strong></div>
                  <button type="button">{["Use this avatar", "Add context", "Review behaviour", "Copy widget code"][activeStep]}<Icon name="arrow" size={16}/></button>
                </div>
              </div>
            </div>
            <div className="builder-steps">
              {steps.map((step, index) => (
                <article data-builder-step={index} data-active={activeStep === index} key={step.number}>
                  <span>{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-roles-section lp-section" id="use-cases">
          <div className="roles-heading" data-reveal>
            <div><span className="lp-index">04 · One platform, many roles</span><h2>The right presence<br/><em>for every moment.</em></h2></div>
            <p>Start with a Ruhana avatar or bring your own photo. Give every role its own knowledge, voice, goals, and handoff rules.</p>
          </div>
          <div className="role-cards" data-reveal>
            {roles.map((role, index) => (
              <article className="role-card" key={role.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="role-avatar-image" src={role.imageUrl} alt={role.name + ", " + role.role} loading="lazy"/>
                <div className="role-card-number">0{index + 1}</div>
                <div className="role-card-copy"><span>{role.role}</span><h3>{role.name}</h3><p>{role.line}</p></div>
                <div className="role-wave" aria-hidden="true">{Array.from({length: 18}, (_, item) => <i key={item}/>)}</div>
              </article>
            ))}
          </div>
          <p className="asset-note">Ruhana original avatar collection · Your custom avatars remain private to your workspace.</p>
        </section>

        <section className="lp-impact-section lp-section" id="impact">
          <div className="impact-heading" data-reveal>
            <span className="lp-index">05 · Impact</span>
            <h2>See what changed<br/><em>after the conversation.</em></h2>
            <p>Not a vanity dashboard. Ruhana connects conversations to outcomes so you can see where it helped—and where the experience still needs work.</p>
          </div>
          <div className="impact-dashboard" data-reveal>
            <div className="impact-topbar"><div><RuhanaLogo href="/" compact/><span>Impact overview</span></div><button type="button">Last 30 days <Icon name="chevron" size={14}/></button></div>
            <div className="impact-metrics">
              <article><span>Useful outcomes</span><strong>68%</strong><small><b>+12%</b> this month</small></article>
              <article><span>Qualified visitors</span><strong>184</strong><small>From 612 conversations</small></article>
              <article><span>Resolved in session</span><strong>76%</strong><small>Without a handoff</small></article>
            </div>
            <div className="impact-main">
              <div className="impact-chart-card">
                <div className="impact-card-head"><div><strong>Outcomes over time</strong><span>Conversation → useful result</span></div><span className="impact-legend"><i/> Outcomes</span></div>
                <div className="impact-chart">
                  {[34, 42, 37, 51, 48, 58, 53, 66, 62, 71, 68, 78].map((height, index) => <i key={index} style={{height: `${height}%`}}/>)}
                  <span className="chart-line line-one"/><span className="chart-line line-two"/><span className="chart-line line-three"/>
                </div>
                <div className="chart-labels"><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Today</span></div>
              </div>
              <div className="impact-results-card">
                <div className="impact-card-head"><div><strong>What Ruhana did</strong><span>Completed actions</span></div></div>
                {[["Product recommendation", "82", 82], ["Lead qualified", "47", 62], ["Meeting booked", "31", 44], ["Human handoff", "24", 34]].map(([label, value, width]) => (
                  <div className="result-row" key={String(label)}><div><span>{label}</span><strong>{value}</strong></div><i><b style={{width: `${width}%`}}/></i></div>
                ))}
              </div>
            </div>
            <span className="demo-data-label">Illustrative dashboard data</span>
          </div>
        </section>

        <section className="lp-deploy-section lp-section" id="developers">
          <div className="deploy-card" data-reveal>
            <div className="deploy-copy">
              <span className="lp-index lp-index-light">06 · Deploy</span>
              <h2>One line between<br/>built and <em>live.</em></h2>
              <p>Paste the Ruhana snippet before your closing body tag. The widget inherits its saved identity, behaviour, and knowledge automatically.</p>
              <div className="deploy-list"><span><Icon name="check"/> Works on any website</span><span><Icon name="check"/> Responsive by default</span><span><Icon name="check"/> Versioned and reversible</span></div>
            </div>
            <div className="code-window">
              <div className="code-head"><span><Icon name="code" size={16}/> Install widget</span><b>HTML</b></div>
              <pre aria-label="Example widget installation code"><code><span>&lt;script</span>{"\n  "}<b>src</b>=<em>&quot;https://cdn.ruhana.ai/widget.js&quot;</em>{"\n  "}<b>data-agent</b>=<em>&quot;your-agent-id&quot;</em>{"\n  "}<span>defer&gt;&lt;/script&gt;</span></code></pre>
              <div className="code-success"><span><Icon name="check"/></span><div><strong>Your agent is live</strong><small>Visible on all published pages</small></div></div>
            </div>
          </div>
        </section>

        <section className="lp-final-section">
          <div className="final-avatar-field" aria-hidden="true">
            {[0, 1, 2, 4, 5, 6, 7].map((index) => <AtlasAvatar index={index} key={index}/>)}
          </div>
          <div className="final-copy" data-reveal>
            <span className="lp-eyebrow"><i/> Ready when your visitors are</span>
            <h2>Make every visit<br/><em>feel understood.</em></h2>
            <p>Build your first high-IQ sales or support avatar in minutes.</p>
            <Link className="lp-button lp-button-dark" href={primaryHref}>{primaryLabel}<Icon name="arrow"/></Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="footer-top"><RuhanaLogo href="/"/><p>Context-aware video agents for the moments that move a business forward.</p></div>
        <div className="footer-links">
          <div><span>Product</span><a href="#how-it-works">How it works</a><a href="#use-cases">Use cases</a><a href="#impact">Analytics</a><Link href="/pricing">Pricing</Link></div>
          <div><span>Build</span><Link href={primaryHref}>Create an agent</Link><a href="#developers">Developers</a><Link href="/sign-in">Sign in</Link></div>
          <div><span>Principles</span><p>Context aware</p><p>Visitor controlled</p><p>Measurable outcomes</p></div>
          <div><span>Company</span><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><a href="mailto:support@ruhanaai.com">Contact</a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Ruhana AI</span><span>Built for useful conversations.</span></div>
      </footer>
    </div>
  );
}
