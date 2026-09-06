"use client";

import { useEffect, useState } from "react";

export default function TestContextPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    "771f5571-f969-47db-9daf-8ae158c6607a"

  );
  const [scrollDepth, setScrollDepth] = useState(0);
  const [visibleSection, setVisibleSection] = useState("Hero Overview");
  const [lastClick, setLastClick] = useState("None");
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Live HUD tracker to demonstrate what the embed script detects
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const innerHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      const depth = Math.min(
        100,
        Math.max(0, Math.round(((scrollY + innerHeight) / scrollHeight) * 100))
      );
      setScrollDepth(depth);

      // Find visible heading
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
      for (const h of headings) {
        const rect = h.getBoundingClientRect();
        if (rect.top >= -20 && rect.top <= innerHeight * 0.45) {
          const text = (h.textContent || "").trim();
          if (text) {
            setVisibleSection(text);
            break;
          }
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        "button, a, [role='button']"
      );
      if (target) {
        const text = (target.textContent || "").trim().slice(0, 40);
        setLastClick(text || target.tagName.toLowerCase());
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { capture: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  // Mount embed script dynamically
  useEffect(() => {
    const existing = document.getElementById("test-ruhana-embed");
    if (existing) existing.remove();

    // Clean up any existing widgets
    const oldWidgets = document.querySelectorAll("[data-ruhana-widget]");
    oldWidgets.forEach((w) => w.remove());

    const script = document.createElement("script");
    script.id = "test-ruhana-embed";
    script.src = `/api/embed/${selectedAgentId}`;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("test-ruhana-embed");
      if (el) el.remove();
      const widgets = document.querySelectorAll("[data-ruhana-widget]");
      widgets.forEach((w) => w.remove());
    };
  }, [selectedAgentId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-32">
      {/* Floating Real-Time HUD */}
      <aside
        style={{
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 9999,
          width: "320px",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#38bdf8" }}>
            Live Screen Context HUD
          </span>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "#065f46",
              color: "#34d399",
              fontWeight: 600,
            }}
          >
            Anam Paused (0 credits)
          </span>
        </div>

        <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 12px 0", lineHeight: "1.4" }}>
          This is what the embed script captures and sends to the brain in real time:
        </p>

        <div style={{ display: "grid", gap: "8px", fontSize: "12px" }}>
          <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "8px 10px", borderRadius: "8px" }}>
            <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>CURRENT SECTION IN VIEW:</span>
            <strong style={{ color: "#f8fafc", wordBreak: "break-word" }}>{visibleSection}</strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "8px 10px", borderRadius: "8px" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>SCROLL DEPTH:</span>
              <strong style={{ color: "#38bdf8" }}>{scrollDepth}%</strong>
            </div>
            <div style={{ background: "rgba(30, 41, 59, 0.6)", padding: "8px 10px", borderRadius: "8px" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "10px" }}>LAST CLICK:</span>
              <strong style={{ color: "#f59e0b", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>
                {lastClick}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(51, 65, 85, 0.8)", fontSize: "11px", color: "#94a3b8" }}>
          💡 <strong>How to test:</strong>
          <ol style={{ paddingLeft: "16px", margin: "4px 0 0 0", lineHeight: "1.4" }}>
            <li>Scroll down & click buttons</li>
            <li>Open the avatar launcher (bottom right)</li>
            <li>Type: <em>&quot;What do you think of this?&quot;</em></li>
            <li>Inspect terminal or press <strong>F12 Console</strong></li>
          </ol>
        </div>
      </aside>

      {/* Main Test Page Content */}
      <div className="max-w-4xl mx-auto px-6 pt-24 space-y-24">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-slate-950">
              R
            </div>
            <span className="font-semibold text-lg text-slate-100 tracking-tight">
              Ruhana Sales Demo Site
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <a
              href="#features"
              className="text-sm text-slate-400 hover:text-cyan-400 transition"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-400 hover:text-cyan-400 transition"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm text-slate-400 hover:text-cyan-400 transition"
            >
              FAQ
            </a>
            <button
              onClick={() => setLastClick("Schedule Live Demo (Nav)")}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
            >
              Schedule Demo
            </button>
          </nav>
        </header>

        {/* Section 1: Hero */}
        <section id="hero" className="space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Test Harness Active: PAUSE_ANAM_API=true
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Meet the Real-Time Context-Aware <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              AI Sales Avatar
            </span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
            As you scroll through this demo page and click around, Ruhana tracks
            your visible viewport heading, scroll percentage, and clicked options.
            When you chat with her, she weaves this context directly into her answers.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={() => setLastClick("Start Free 14-Day Trial")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
            >
              Start Free 14-Day Trial
            </button>
            <button
              onClick={() => setLastClick("Watch 2-Min Product Tour")}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
            >
              Watch 2-Min Product Tour
            </button>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features" className="space-y-8 pt-12 border-t border-slate-800/60">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Capabilities
            </span>
            <h2 className="text-3xl font-bold text-white">
              Autonomous Sales Features
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Equipped with deep website awareness and natural objection handling.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 font-bold">
                01
              </div>
              <h3 className="text-lg font-semibold text-white">
                Viewport Vision
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Knows the exact heading or offer the visitor is looking at when they engage.
              </p>
              <button
                onClick={() => setLastClick("Explore Viewport Vision")}
                className="text-xs text-cyan-400 hover:underline pt-2 inline-block"
              >
                Learn more &rarr;
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 font-bold">
                02
              </div>
              <h3 className="text-lg font-semibold text-white">
                Browsing Trail Memory
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Retains a ring buffer of pages viewed, dwell time, and button clicks.
              </p>
              <button
                onClick={() => setLastClick("Explore Journey Memory")}
                className="text-xs text-emerald-400 hover:underline pt-2 inline-block"
              >
                Learn more &rarr;
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-950 flex items-center justify-center text-purple-400 font-bold">
                03
              </div>
              <h3 className="text-lg font-semibold text-white">
                Natural Lead Capture
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies user intent and captures contact information seamlessly.
              </p>
              <button
                onClick={() => setLastClick("Explore Lead Capture")}
                className="text-xs text-purple-400 hover:underline pt-2 inline-block"
              >
                Learn more &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Pricing Table */}
        <section id="pricing" className="space-y-8 pt-12 border-t border-slate-800/60">
          <div className="space-y-2 text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Transparent Pricing
            </span>
            <h2 className="text-3xl font-bold text-white">
              Choose the Plan That Fits Your Growth
            </h2>
            <p className="text-slate-400 text-sm">
              Click any of the plan selection buttons below, then ask Ruhana: &quot;What do you think of the plan I selected?&quot;
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Starter Tier</h3>
                <div className="text-3xl font-black text-slate-100">
                  $29<span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <p className="text-xs text-slate-400">
                  Best for individual creators and landing pages.
                </p>
              </div>
              <button
                onClick={() => setLastClick("Select Starter Plan ($29/mo)")}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                Select Starter Plan
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-2xl bg-slate-900 border-2 border-cyan-500 space-y-4 flex flex-col justify-between relative shadow-xl shadow-cyan-950/40">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Pro Growth</h3>
                <div className="text-3xl font-black text-white">
                  $79<span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ideal for scaling startups with active traffic.
                </p>
              </div>
              <button
                onClick={() => setLastClick("Select Pro Growth ($79/mo)")}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition"
              >
                Select Pro Growth
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Enterprise Plan</h3>
                <div className="text-3xl font-black text-slate-100">
                  $249<span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <p className="text-xs text-slate-400">
                  Dedicated avatars, custom knowledge models, SLA.
                </p>
              </div>
              <button
                onClick={() => setLastClick("Select Enterprise Plan ($249/mo)")}
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              >
                Select Enterprise Plan
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Enterprise FAQ */}
        <section id="faq" className="space-y-8 pt-12 border-t border-slate-800/60">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Questions & Inquiries
            </span>
            <h2 className="text-3xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <h3 className="text-sm font-semibold text-white">
                How does the avatar know what I am looking at?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The embedded loader runs directly in the browser. It monitors viewport intersection
                with prominent headings, scroll depth percentage, and interaction clicks, forwarding
                this to the AI brain without lag.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Are Anam video/voice credits being billed during this test?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No. With <code className="text-cyan-300">PAUSE_ANAM_API=true</code>, Anam token requests are bypassed.
                You can chat through the text composer to inspect prompts completely free.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-800/40">
            <div>
              <h3 className="font-bold text-white text-base">
                Have custom compliance or volume needs?
              </h3>
              <p className="text-xs text-slate-400">
                Talk to our enterprise solution specialists today.
              </p>
            </div>
            <button
              onClick={() => setLastClick("Schedule Enterprise Consultation")}
              className="px-5 py-2.5 rounded-lg bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition"
            >
              Schedule Consultation
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
