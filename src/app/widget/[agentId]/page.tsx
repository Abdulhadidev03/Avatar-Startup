"use client";

import {
  type FormEvent,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient, AnamEvent } from "@anam-ai/js-sdk";
import type { AnamClient } from "@anam-ai/js-sdk";

type Status =
  | "idle"
  | "preparing"
  | "chatting"
  | "connecting"
  | "connected"
  | "error"
  | "ended";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type SessionCredentials = {
  sessionToken: string;
  sessionId: string;
};

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

interface AgentConfig {
  name: string;
  greeting: string;
  avatarImageUrl: string | null;
}

type IconName =
  | "brand"
  | "end"
  | "mic"
  | "micOff"
  | "minimize"
  | "send"
  | "volume"
  | "volumeOff";

function WidgetIcon({ name }: { name: IconName }) {
  if (name === "brand") {
    return (
      <svg className="wgt-brand-glyph" viewBox="0 0 100 120" aria-hidden="true" focusable="false">
        <path d="M0 0h53c22 0 36 14 36 36 0 16-8 27-22 32L0 0Z" />
        <circle cx="20" cy="49" r="14" />
        <path d="M0 62v58h58L0 62Z" />
        <path d="M18 70h50l32 33v17H68L18 70Z" />
      </svg>
    );
  }

  const paths: Record<Exclude<IconName, "brand">, React.ReactNode> = {
    end: <path d="M6.3 15.8a8.5 8.5 0 0 1 11.4 0l1.2-2.2a1.5 1.5 0 0 0-.45-1.95 10.75 10.75 0 0 0-12.9 0 1.5 1.5 0 0 0-.45 1.95l1.2 2.2Z" />,
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
      </>
    ),
    micOff: (
      <>
        <path d="M9 8.25V6a3 3 0 0 1 5.8-1.08M15 8v3.5a3 3 0 0 1-.55 1.73M6.5 11.5A5.5 5.5 0 0 0 16 15.28M12 17v4M9 21h6M4 4l16 16" />
      </>
    ),
    minimize: <path d="M5 12h14" />,
    send: (
      <>
        <path d="m4 4 16 8-16 8 3-8-3-8Z" />
        <path d="M7 12h13" />
      </>
    ),
    volume: (
      <>
        <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
        <path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" />
      </>
    ),
    volumeOff: (
      <>
        <path d="M5 10v4h3l4 3V7l-4 3H5ZM16 10l4 4M20 10l-4 4" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

function statusLabel(status: Status, listening: boolean, micMuted: boolean) {
  if (status === "preparing") return "Preparing chat";
  if (status === "chatting") return "Text chat ready";
  if (status === "connecting") return "Connecting voice";
  if (status === "connected" && listening) return "Listening";
  if (status === "connected" && micMuted) return "Live · mic muted";
  if (status === "connected") return "Live · mic on";
  if (status === "error") return "Voice unavailable";
  if (status === "ended") return "Session ended";
  return "Ready when you are";
}

export default function WidgetPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = use(params);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [sending, setSending] = useState(false);
  const [micMuted, setMicMuted] = useState(true);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const anamRef = useRef<AnamClient | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const sessionPromiseRef = useRef<Promise<SessionCredentials> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const greetingRef = useRef("Hi! How can I help you today?");
  const messageIdRef = useRef(0);
  const voiceStartingRef = useRef(false);
  const intentionalStopRef = useRef(false);
  const greetingSpokenRef = useRef(false);
  const pageUrlRef = useRef("");
  const parentOriginRef = useRef<string | null>(null);
  const channelRef = useRef<string | null>(null);
  const liveContextRef = useRef<LiveContext | null>(null);
  const recentEventsRef = useRef<JourneyEvent[]>([]);

  const addMessage = useCallback(
    (role: Message["role"], text: string) => {
      const cleanText = text.trim();
      if (!cleanText) return;
      messageIdRef.current += 1;
      setMessages((current) => [
        ...current,
        { id: messageIdRef.current, role, text: cleanText },
      ]);
    },
    [],
  );

  const postToParent = useCallback(
    (type: string, detail: Record<string, unknown> = {}) => {
      const targetOrigin = parentOriginRef.current;
      const channel = channelRef.current;
      if (!targetOrigin || !channel || window.parent === window) return;
      window.parent.postMessage({ type, channel, ...detail }, targetOrigin);
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/agents/${agentId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Agent unavailable");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const greeting = data.greeting || "Hi! How can I help you today?";
        const nextAgent = {
          name: data.name ?? "Ruhana",
          greeting,
          avatarImageUrl: data.avatar_image_url ?? null,
        };
        greetingRef.current = greeting;
        setAgent(nextAgent);
        setImageFailed(false);
        setMessages((current) => {
          if (current.length) return current;
          messageIdRef.current += 1;
          return [
            {
              id: messageIdRef.current,
              role: "assistant",
              text: greeting,
            },
          ];
        });
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = {
          name: "Ruhana",
          greeting: "Hi! How can I help you today?",
          avatarImageUrl: null,
        };
        greetingRef.current = fallback.greeting;
        setAgent(fallback);
        setMessages((current) => {
          if (current.length) return current;
          messageIdRef.current += 1;
          return [
            {
              id: messageIdRef.current,
              role: "assistant",
              text: fallback.greeting,
            },
          ];
        });
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    transcript.scrollTo({
      top: transcript.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [messages, sending]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = speakerMuted;
  }, [speakerMuted]);

  const ensureSession = useCallback(
    async (mode: "text" | "voice"): Promise<SessionCredentials> => {
      if (sessionIdRef.current) {
        if (mode === "text" || sessionTokenRef.current) {
          return {
            sessionId: sessionIdRef.current,
            sessionToken: sessionTokenRef.current ?? "",
          };
        }
      }

      if (sessionPromiseRef.current) return sessionPromiseRef.current;

      setStatus(mode === "voice" ? "connecting" : "preparing");
      setError(null);
      setComposerError(null);

      const request = (async () => {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            pageUrl:
              pageUrlRef.current || document.referrer || window.location.href,
            orientation: "portrait",
            liveContext: liveContextRef.current,
            recentEvents: recentEventsRef.current,
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.sessionToken || !body.sessionId) {
          throw new Error(body.error ?? `Session error ${response.status}`);
        }

        sessionIdRef.current = body.sessionId;
        sessionTokenRef.current = body.sessionToken;
        if (mode === "text") setStatus("chatting");

        return {
          sessionToken: body.sessionToken as string,
          sessionId: body.sessionId as string,
        };
      })();

      sessionPromiseRef.current = request;
      try {
        return await request;
      } catch (caughtError) {
        sessionIdRef.current = null;
        sessionTokenRef.current = null;
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Could not start a secure conversation";
        setError(message);
        setStatus("error");
        throw caughtError;
      } finally {
        sessionPromiseRef.current = null;
      }
    },
    [agentId],
  );

  const askBrain = useCallback(
    async (text: string) => {
      setSending(true);
      setComposerError(null);

      try {
        const { sessionId } = await ensureSession("text");
        const response = await fetch("/api/brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            userText: text,
            liveContext: liveContextRef.current,
            recentEvents: recentEventsRef.current,
          }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "Reply unavailable");
        }

        const replyText = String(body.replyText ?? "").trim();
        if (body.debug?.systemPrompt) {
          console.groupCollapsed(
            "%c🧠 [AGENT BRAIN SYSTEM PROMPT & CONTEXT]",
            "color: #0ea5e9; font-weight: bold; font-size: 12px; padding: 2px 4px; background: #0f172a; border-radius: 4px;"
          );
          console.log("%cLive Screen Context:", "font-weight: bold; color: #10b981;", body.debug.liveContext);
          console.log("%cVisitor Browsing Journey:", "font-weight: bold; color: #f59e0b;", body.debug.recentEvents);
          console.log("%cFinal System Prompt Sent to LLM:\n\n", "font-weight: bold; color: #c084fc;", body.debug.systemPrompt);
          console.groupEnd();
        }
        if (!replyText) return;
        addMessage("assistant", replyText);
        if (anamRef.current?.isStreaming()) {
          anamRef.current.talk(replyText);
        }
      } catch {
        setComposerError(
          "I couldn’t send that. Please check your connection and try again.",
        );
      } finally {
        setSending(false);
      }
    },
    [addMessage, ensureSession],
  );

  const sendText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim().slice(0, 1000);
      if (!text || sending) return;
      setUserInput("");
      addMessage("user", text);
      await askBrain(text);
      composerRef.current?.focus();
    },
    [addMessage, askBrain, sending],
  );

  const startVoice = useCallback(
    async (options: { fresh?: boolean } = {}) => {
      if (voiceStartingRef.current) return;

      if (anamRef.current?.isStreaming()) {
        if (anamRef.current.getInputAudioState().isMuted) {
          anamRef.current.unmuteInputAudio();
          setMicMuted(false);
        }
        return;
      }

      if (options.fresh) {
        sessionIdRef.current = null;
        sessionTokenRef.current = null;
        sessionPromiseRef.current = null;
        greetingSpokenRef.current = false;
        setMessages(() => {
          messageIdRef.current += 1;
          return [
            {
              id: messageIdRef.current,
              role: "assistant",
              text: greetingRef.current,
            },
          ];
        });
      }

      voiceStartingRef.current = true;
      intentionalStopRef.current = false;
      setStatus("connecting");
      setError(null);
      setComposerError(null);

      try {
        const { sessionToken } = await ensureSession("voice");
        if (!sessionToken) throw new Error("Voice session unavailable");

        if (sessionToken.startsWith("mock-")) {
          voiceStartingRef.current = false;
          setStatus("chatting");
          setError(
            "Anam avatar video/voice is paused (PAUSE_ANAM_API=true) to save credits. Use the text box below to chat & inspect prompts!",
          );
          return;
        }

        const anam = createClient(sessionToken);
        anamRef.current = anam;

        anam.addListener(AnamEvent.MIC_PERMISSION_PENDING, () => {
          setStatus("connecting");
        });
        anam.addListener(AnamEvent.MIC_PERMISSION_GRANTED, () => {
          setMicMuted(false);
        });
        anam.addListener(AnamEvent.MIC_PERMISSION_DENIED, () => {
          setMicMuted(true);
          setError(
            "Microphone access was blocked. Allow it in your browser to talk, or continue by text.",
          );
          setStatus("error");
        });
        anam.addListener(AnamEvent.USER_SPEECH_STARTED, () => {
          setListening(true);
        });
        anam.addListener(AnamEvent.USER_SPEECH_ENDED, () => {
          setListening(false);
        });
        anam.addListener(AnamEvent.SESSION_READY, () => {
          voiceStartingRef.current = false;
          setStatus("connected");
          setMicMuted(anam.getInputAudioState().isMuted);

          if (!greetingSpokenRef.current) {
            greetingSpokenRef.current = true;
            anam.talk(greetingRef.current);
          }
        });
        anam.addListener(AnamEvent.CONNECTION_CLOSED, () => {
          voiceStartingRef.current = false;
          setListening(false);
          setMicMuted(true);
          anamRef.current = null;

          if (!intentionalStopRef.current) {
            sessionIdRef.current = null;
            sessionTokenRef.current = null;
            setError(
              "The voice connection ended. You can keep chatting or start voice again.",
            );
            setStatus("error");
          }
        });

        let lastProcessedIndex = -1;
        anam.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (history) => {
          const index = history.length - 1;
          if (index <= lastProcessedIndex) return;
          const latest = history[index];
          if (!latest || latest.role !== "user") return;
          const text = (latest.content ?? "").trim();
          if (!text) return;
          lastProcessedIndex = index;
          addMessage("user", text);
          await askBrain(text);
        });

        await anam.streamToVideoElement("widget-video");
      } catch (caughtError) {
        voiceStartingRef.current = false;
        setListening(false);
        setMicMuted(true);
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Could not start voice";
        setError(message);
        setStatus("error");
        if (anamRef.current) {
          intentionalStopRef.current = true;
          void anamRef.current.stopStreaming();
          anamRef.current = null;
        }
        sessionIdRef.current = null;
        sessionTokenRef.current = null;
      }
    },
    [addMessage, askBrain, ensureSession],
  );

  const toggleMicrophone = useCallback(() => {
    const anam = anamRef.current;
    if (!anam?.isStreaming()) {
      void startVoice();
      return;
    }

    const currentlyMuted = anam.getInputAudioState().isMuted;
    if (currentlyMuted) {
      anam.unmuteInputAudio();
      setMicMuted(false);
    } else {
      anam.muteInputAudio();
      setMicMuted(true);
      setListening(false);
    }
  }, [startVoice]);

  const muteForPrivacy = useCallback(() => {
    const anam = anamRef.current;
    if (!anam?.isStreaming()) return;
    if (!anam.getInputAudioState().isMuted) anam.muteInputAudio();
    setMicMuted(true);
    setListening(false);
  }, []);

  const minimize = useCallback(() => {
    muteForPrivacy();
    postToParent("RUHANA_WIDGET_MINIMIZE");
  }, [muteForPrivacy, postToParent]);

  const endSession = useCallback(async () => {
    const activeSessionId = sessionIdRef.current;
    intentionalStopRef.current = true;
    voiceStartingRef.current = false;
    setListening(false);
    setMicMuted(true);

    const anam = anamRef.current;
    anamRef.current = null;
    if (anam) {
      try {
        await anam.stopStreaming();
      } catch {
        // The session is still considered ended locally if transport cleanup fails.
      }
    }

    sessionIdRef.current = null;
    sessionTokenRef.current = null;
    sessionPromiseRef.current = null;
    setStatus("ended");
    setError(null);

    if (activeSessionId) {
      void fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId }),
        keepalive: true,
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (window.parent === window) return;

    const query = new URLSearchParams(window.location.search);
    const requestedOrigin = query.get("parentOrigin");
    const channel = query.get("channel");
    let referrerOrigin: string | null = null;

    try {
      if (document.referrer) referrerOrigin = new URL(document.referrer).origin;
    } catch {
      referrerOrigin = null;
    }

    let safeOrigin: string | null = null;
    try {
      if (requestedOrigin) {
        const parsed = new URL(requestedOrigin);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          safeOrigin = parsed.origin;
        }
      }
    } catch {
      safeOrigin = null;
    }

    if (referrerOrigin && safeOrigin && referrerOrigin !== safeOrigin) return;
    if (!safeOrigin) safeOrigin = referrerOrigin;
    if (!safeOrigin || !channel || !/^[a-zA-Z0-9_-]{12,128}$/.test(channel)) {
      return;
    }

    parentOriginRef.current = safeOrigin;
    channelRef.current = channel;

    function onMessage(event: MessageEvent) {
      if (
        event.source !== window.parent ||
        event.origin !== parentOriginRef.current ||
        event.data?.channel !== channelRef.current
      ) {
        return;
      }

      const pageUrl =
        typeof event.data?.pageUrl === "string"
          ? event.data.pageUrl.slice(0, 2048)
          : "";
      if (pageUrl) pageUrlRef.current = pageUrl;

      if (
        event.data?.liveContext &&
        typeof event.data.liveContext === "object"
      ) {
        liveContextRef.current = event.data.liveContext as LiveContext;
      }
      if (Array.isArray(event.data?.recentEvents)) {
        recentEventsRef.current = event.data.recentEvents.slice(-15) as JourneyEvent[];
      }

      if (event.data?.type === "RUHANA_WIDGET_OPEN") {
        window.requestAnimationFrame(() => composerRef.current?.focus());
      }
      if (event.data?.type === "LIVE_CONTEXT_UPDATE") {
        return;
      }
      if (event.data?.type === "RUHANA_WIDGET_START_VOICE") {
        void startVoice();
      }
      if (
        event.data?.type === "RUHANA_WIDGET_SEND_TEXT" &&
        typeof event.data.text === "string"
      ) {
        void sendText(event.data.text);
      }
      if (event.data?.type === "RUHANA_WIDGET_HOST_MINIMIZE") {
        muteForPrivacy();
      }
    }

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      { type: "RUHANA_WIDGET_READY", channel },
      safeOrigin,
    );

    return () => window.removeEventListener("message", onMessage);
  }, [muteForPrivacy, sendText, startVoice]);

  useEffect(() => {
    postToParent("RUHANA_WIDGET_STATE", {
      status,
      micMuted,
      speakerMuted,
    });
  }, [micMuted, postToParent, speakerMuted, status]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") minimize();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [minimize]);

  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      if (anamRef.current) void anamRef.current.stopStreaming();
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendText(userInput);
  }

  const agentName = agent?.name ?? "Ruhana";
  const initials = agentName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const voiceBusy = status === "connecting" || status === "preparing";
  const sessionOpen = [
    "preparing",
    "chatting",
    "connecting",
    "connected",
  ].includes(status);
  const label = statusLabel(status, listening, micMuted);

  return (
    <main className={`wgt-root is-${status}`} aria-label={`Chat with ${agentName}`}>
      <header className="wgt-header">
        <span className="wgt-brand-mark" aria-hidden="true">
          <WidgetIcon name="brand" />
        </span>
        <span className="wgt-identity">
          <strong>{agentName}</strong>
          <span className="wgt-status" role="status" aria-live="polite">
            <i data-status={status} />
            {label}
          </span>
        </span>
        <button
          className="wgt-icon-button"
          type="button"
          aria-label="Minimize conversation"
          onClick={minimize}
        >
          <WidgetIcon name="minimize" />
        </button>
      </header>

      <section className="wgt-stage" aria-label="Avatar video">
        <video
          ref={videoRef}
          id="widget-video"
          className="wgt-video"
          autoPlay
          playsInline
          muted={speakerMuted}
        />

        <div className="wgt-avatar-fallback" aria-hidden={status === "connected"}>
          {agent?.avatarImageUrl && !imageFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agent.avatarImageUrl}
              alt=""
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span>{initials || "R"}</span>
          )}
          <div>
            <small>Available now</small>
            <strong>Ask by voice or text</strong>
          </div>
        </div>

        {status === "connecting" || status === "preparing" ? (
          <div className="wgt-stage-overlay" role="status">
            <span className="wgt-spinner" />
            <strong>
              {status === "connecting" ? "Starting voice…" : "Opening chat…"}
            </strong>
            <small>
              {status === "connecting"
                ? "Your browser may ask for microphone access."
                : "Getting a secure session ready."}
            </small>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="wgt-stage-overlay wgt-stage-overlay--error" role="alert">
            <strong>Voice needs a moment</strong>
            <small>{error}</small>
            <button type="button" onClick={() => void startVoice({ fresh: true })}>
              Try voice again
            </button>
          </div>
        ) : null}

        {status === "ended" ? (
          <div className="wgt-stage-overlay" role="status">
            <strong>Conversation ended</strong>
            <small>Your messages stay here until you start again.</small>
            <button type="button" onClick={() => void startVoice({ fresh: true })}>
              Start a new conversation
            </button>
          </div>
        ) : null}

        {status === "connected" ? (
          <span className="wgt-live-label">
            <i /> {listening ? "Listening" : "Live"}
          </span>
        ) : null}

        <div className="wgt-call-controls" aria-label="Voice controls">
          <button
            className={`wgt-call-button ${
              status === "connected" && !micMuted ? "is-active" : ""
            }`}
            type="button"
            aria-label={
              status !== "connected"
                ? "Start voice conversation"
                : micMuted
                  ? "Unmute microphone"
                  : "Mute microphone"
            }
            aria-pressed={status === "connected" ? !micMuted : undefined}
            disabled={voiceBusy}
            onClick={toggleMicrophone}
          >
            <WidgetIcon
              name={status === "connected" && !micMuted ? "mic" : "micOff"}
            />
          </button>
          <button
            className="wgt-call-button"
            type="button"
            aria-label={speakerMuted ? "Unmute speaker" : "Mute speaker"}
            aria-pressed={speakerMuted}
            disabled={status !== "connected"}
            onClick={() => setSpeakerMuted((muted) => !muted)}
          >
            <WidgetIcon name={speakerMuted ? "volumeOff" : "volume"} />
          </button>
          <button
            className="wgt-call-button wgt-call-button--end"
            type="button"
            aria-label="End conversation"
            disabled={!sessionOpen}
            onClick={() => void endSession()}
          >
            <WidgetIcon name="end" />
          </button>
        </div>
      </section>

      <section className="wgt-conversation" aria-label="Conversation transcript">
        <div className="wgt-conversation-heading">
          <span>Conversation</span>
          <small>Private to this session</small>
        </div>
        <div
          ref={transcriptRef}
          className="wgt-transcript"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {messages.map((message) => (
            <div className={`wgt-message is-${message.role}`} key={message.id}>
              <span>{message.role === "assistant" ? agentName : "You"}</span>
              <p>{message.text}</p>
            </div>
          ))}
          {sending ? (
            <div className="wgt-message is-assistant" aria-label={`${agentName} is replying`}>
              <span>{agentName}</span>
              <p className="wgt-typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <footer className="wgt-composer">
        <form onSubmit={handleSubmit}>
          <label className="wgt-visually-hidden" htmlFor="widget-message">
            Message {agentName}
          </label>
          <input
            ref={composerRef}
            id="widget-message"
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength={1000}
            value={userInput}
            placeholder={`Message ${agentName}…`}
            aria-describedby="widget-composer-hint"
            aria-invalid={Boolean(composerError)}
            onChange={(event) => {
              setUserInput(event.target.value);
              if (composerError) setComposerError(null);
            }}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!userInput.trim() || sending}
          >
            <WidgetIcon name="send" />
          </button>
        </form>
        <p id="widget-composer-hint" className="wgt-composer-hint">
          {composerError ? (
            <span role="alert">{composerError}</span>
          ) : status === "connected" ? (
            micMuted ? "Your microphone is muted." : "Microphone on · tap it to mute."
          ) : (
            "Voice stays off until you choose the microphone."
          )}
        </p>
      </footer>
    </main>
  );
}
