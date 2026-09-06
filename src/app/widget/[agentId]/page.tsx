"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient, AnamEvent } from "@anam-ai/js-sdk";
import type { AnamClient } from "@anam-ai/js-sdk";
import { use } from "react";

type Status = "idle" | "connecting" | "connected" | "error" | "ended";

interface AgentConfig {
  name: string;
  greeting: string;
  avatarImageUrl: string | null;
}

export default function WidgetPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [sending, setSending] = useState(false);

  const anamRef = useRef<AnamClient | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<string>("Hi! How can I help you today?");

  // Auto-scroll transcript
  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load agent config
  useEffect(() => {
    fetch(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then((data) => {
        const g = data.greeting || "Hi! How can I help you today?";
        greetingRef.current = g;
        setAgent({
          name: data.name ?? "Sarah",
          greeting: g,
          avatarImageUrl: data.avatar_image_url ?? null,
        });
      })
      .catch(() => {
        setAgent({ name: "Sarah", greeting: "Hi! How can I help you today?", avatarImageUrl: null });
      });
  }, [agentId]);

  const addMessage = useCallback((role: "user" | "assistant", text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  }, []);

  const startCall = useCallback(async (pageUrl?: string) => {
    setStatus("connecting");
    setError(null);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, pageUrl: pageUrl ?? window.location.href, orientation: "portrait" }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? `Session error ${res.status}`);
      }

      const { sessionToken, sessionId: sid } = await res.json();
      setSessionId(sid);
      sessionIdRef.current = sid;

      const anam = createClient(sessionToken);
      anamRef.current = anam;

      anam.addListener(AnamEvent.SESSION_READY, () => {
        setStatus("connected");
        // Avatar speaks the greeting as soon as the session is live
        const greeting = greetingRef.current;
        if (greeting) {
          addMessage("assistant", greeting);
          anam.talk(greeting);
        }
      });

      anam.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        setStatus("ended");
        anamRef.current = null;
        const sid = sessionIdRef.current;
        if (sid) {
          fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid }),
          }).catch(() => {});
        }
      });

      let lastProcessedIdx = -1;
      anam.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (msgs) => {
        const idx = msgs.length - 1;
        if (idx <= lastProcessedIdx) return;
        const last = msgs[idx];
        if (!last || last.role !== "user") return;
        const text = (last.content ?? "").trim();
        if (!text) return;
        lastProcessedIdx = idx;

        addMessage("user", text);

        const sid = sessionIdRef.current;
        if (!sid) return;

        try {
          const brainRes = await fetch("/api/brain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, userText: text }),
          });

          if (!brainRes.ok) return;
          const { replyText } = await brainRes.json();
          if (replyText?.trim()) {
            addMessage("assistant", replyText);
            anam.talk(replyText);
          }
        } catch {
          // Brain errors are non-fatal — avatar stays connected
        }
      });

      await anam.streamToVideoElement("widget-video");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
      setStatus("error");
    }
  }, [agentId, addMessage]);

  // Start the call when the iframe becomes visible (user opened the widget)
  useEffect(() => {
    if (status !== "idle") return;

    // Listen for parent postMessage
    function onMessage(ev: MessageEvent) {
      if (ev.data?.type === "WIDGET_START") {
        const pageUrl = ev.data.pageUrl || document.referrer || window.location.href;
        startCall(pageUrl);
      }
    }
    window.addEventListener("message", onMessage);

    // Fallback: if no postMessage arrives within 500ms, auto-start
    const fallback = setTimeout(() => {
      const pageUrl = document.referrer || window.location.href;
      startCall(pageUrl);
    }, 500);

    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(fallback);
    };
  }, [startCall, status]);

  function endCall() {
    const sid = sessionIdRef.current;
    anamRef.current?.stopStreaming();
    anamRef.current = null;
    setStatus("ended");

    // Score the call for the conversations dashboard
    if (sid) {
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      }).catch(() => {});
    }

    // Tell the parent iframe to close
    window.parent.postMessage({ type: "WIDGET_END" }, "*");
  }

  async function sendText() {
    const text = userInput.trim();
    if (!text || sending || !anamRef.current || !sessionIdRef.current) return;
    setSending(true);
    setUserInput("");
    addMessage("user", text);

    try {
      const brainRes = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, userText: text }),
      });
      if (brainRes.ok) {
        const { replyText } = await brainRes.json();
        if (replyText?.trim()) {
          addMessage("assistant", replyText);
          anamRef.current?.talk(replyText);
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setSending(false);
    }
  }

  const agentName = agent?.name ?? "…";

  return (
    <div className="wgt-root">
      {/* Header */}
      <div className="wgt-header">
        <span className="wgt-header-dot" data-status={status} />
        <span className="wgt-header-name">{agentName}</span>
        <span className="wgt-header-status">
          {status === "connecting" ? "Connecting…" :
           status === "connected" ? "Live" :
           status === "ended" ? "Session ended" :
           status === "error" ? "Connection error" : ""}
        </span>
        <button className="wgt-close-btn" type="button" aria-label="End call" onClick={endCall}>✕</button>
      </div>

      {/* Avatar video */}
      <div className="wgt-video-wrap">
        <video id="widget-video" className="wgt-video" autoPlay playsInline />
        {status === "connecting" && (
          <div className="wgt-overlay">
            <span className="wgt-spinner" />
            <p>Connecting to {agentName}…</p>
          </div>
        )}
        {status === "ended" && (
          <div className="wgt-overlay">
            <p>Session ended</p>
            <button className="wgt-restart-btn" type="button" onClick={() => startCall()}>Start a new session</button>
          </div>
        )}
        {status === "error" && (
          <div className="wgt-overlay wgt-overlay--error">
            <p>{error}</p>
            <button className="wgt-restart-btn" type="button" onClick={() => startCall()}>Try again</button>
          </div>
        )}
      </div>

      {/* Voice-only — no chat transcript or text input */}
    </div>
  );
}
