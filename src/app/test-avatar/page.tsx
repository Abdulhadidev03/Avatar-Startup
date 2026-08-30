"use client";

import { useRef, useState, useCallback } from "react";
import { createClient, AnamEvent } from "@anam-ai/js-sdk";
import type { AnamClient } from "@anam-ai/js-sdk";

type Status = "idle" | "connecting" | "connected" | "error";

export default function TestAvatarPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const anamRef = useRef<AnamClient | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const startCall = useCallback(async () => {
    setStatus("connecting");
    setError(null);
    addLog("Requesting session token...");

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl: window.location.href }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const { sessionToken, sessionId: sid } = await res.json();
      setSessionId(sid);
      addLog(`Session created: ${sid}`);

      const anam = createClient(sessionToken);
      anamRef.current = anam;

      anam.addListener(AnamEvent.SESSION_READY, () => {
        setStatus("connected");
        addLog("Session ready — avatar connected");

        // Greeting: avatar speaks first
        anam.talk(
          "Hey! I'm Sarah from FlowDesk — what brings you here today?"
        );
        addLog("Greeting sent");
      });

      anam.addListener(AnamEvent.CONNECTION_CLOSED, () => {
        setStatus("idle");
        addLog("Connection closed");
        anamRef.current = null;
      });

      anam.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (messages) => {
        const last = messages[messages.length - 1];
        if (!last) return;

        addLog(`[${last.role}] ${last.content}`);

        // Only react to user turns — send to brain, speak the reply
        if (last.role !== "user") return;

        try {
          const brainRes = await fetch("/api/brain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sid, userText: last.content }),
          });

          if (!brainRes.ok) throw new Error(`Brain returned ${brainRes.status}`);

          const { replyText, leadCaptured } = await brainRes.json();
          addLog(`[brain] ${replyText}`);

          anam.talk(replyText);

          if (leadCaptured) {
            addLog("🎯 Lead captured!");
          }
        } catch (brainErr) {
          const msg = brainErr instanceof Error ? brainErr.message : "Brain error";
          addLog(`Brain error: ${msg}`);
        }
      });

      await anam.streamToVideoElement("avatar-video");
      addLog("Streaming started");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setStatus("error");
      addLog(`Error: ${msg}`);
    }
  }, [addLog]);

  const endCall = useCallback(() => {
    if (anamRef.current) {
      anamRef.current.stopStreaming();
      anamRef.current = null;
    }
    setStatus("idle");
    addLog("Call ended");
  }, [addLog]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Anam Avatar — Test Page</h1>
        <p className="text-zinc-400 text-sm">
          BE-1 Day 1: verify the avatar connects, streams video, and speaks the
          greeting. This page is throwaway — the real UI lives in the widget.
        </p>

        {/* Status bar */}
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${
              status === "connected"
                ? "bg-green-500"
                : status === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-zinc-600"
            }`}
          />
          <span className="text-sm font-medium capitalize">{status}</span>
          {sessionId && (
            <span className="text-xs text-zinc-500 font-mono">
              session: {sessionId}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Avatar video */}
        <div className="relative aspect-video max-w-lg bg-black rounded-xl overflow-hidden border border-zinc-800">
          <video
            ref={videoRef}
            id="avatar-video"
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {status === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
              Click &quot;Start Call&quot; to connect
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={startCall}
            disabled={status === "connecting" || status === "connected"}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-colors"
          >
            Start Call
          </button>
          <button
            onClick={endCall}
            disabled={status !== "connected"}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-colors"
          >
            End Call
          </button>
        </div>

        {/* Event log */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-400">Event Log</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 h-56 overflow-y-auto font-mono text-xs space-y-1">
            {log.length === 0 ? (
              <p className="text-zinc-600">No events yet</p>
            ) : (
              log.map((entry, i) => (
                <p key={i} className="text-zinc-400">
                  {entry}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
