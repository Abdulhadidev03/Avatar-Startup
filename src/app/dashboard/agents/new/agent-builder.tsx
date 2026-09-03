"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "../../dashboard-icons";
import { AvatarPortrait } from "../../dashboard-ui";
import { avatars } from "../../mock-data";
import { findStoredAgent, upsertStoredAgent, removeStoredAgent, type FrontendAgent, type StoredBuilderState } from "../agent-storage";

type BuilderStep = 1 | 2 | 3 | 4;
type ScanState = "idle" | "scanning" | "ready";
type AvatarSource = "library" | "custom";
type LaunchState = "draft" | "launching" | "live";

const steps: Array<{ number: BuilderStep; label: string }> = [
  { number: 1, label: "Website & goal" },
  { number: 2, label: "Look & voice" },
  { number: 3, label: "Knowledge & behavior" },
  { number: 4, label: "Widget & launch" },
];

type AnamVoice = {
  id: string;
  displayName: string;
  gender: "MALE" | "FEMALE" | "NEUTRAL" | null;
  country: string | null;
  description: string | null;
  previewSampleUrl: string | null;
  displayTags: string[];
};

const actionOptions = [
  { id: "capture", title: "Capture contact details", description: "Collect a visitor’s name and email with permission.", ready: true },
  { id: "recommend", title: "Recommend products", description: "Suggest relevant products using page and visitor context.", ready: true },
  { id: "meeting", title: "Book meetings", description: "Offer available times through your calendar integration.", ready: false },
  { id: "cart", title: "Help visitors purchase", description: "Guide visitors to the right product and checkout.", ready: true },
  { id: "handoff", title: "Hand off to a person", description: "Escalate important conversations to your team.", ready: true },
  { id: "ticket", title: "Create support requests", description: "Create a ticket when the agent cannot resolve an issue.", ready: false },
];

function BuilderHeader({ step, onSaveExit }: { step: BuilderStep; onSaveExit: () => void }) {
  return (
    <div className="ruh-page-heading ruh-builder-page-heading">
      <div><p className="ruh-kicker">New agent · Step {step} of 4</p><h1>{steps[step - 1].label}</h1><p>Build a capable website agent in a few guided decisions.</p></div>
      <button className="ruh-secondary-button" type="button" onClick={onSaveExit}>Save and exit</button>
    </div>
  );
}

function Progress({ step, maxVisited, onStep }: { step: BuilderStep; maxVisited: BuilderStep; onStep: (step: BuilderStep) => void }) {
  return (
    <nav className="ruh-builder-progress" aria-label="Agent creation progress">
      {steps.map((item) => {
        const complete = item.number < step || item.number < maxVisited;
        return <button className={`${item.number === step ? "is-current" : ""}${complete ? " is-complete" : ""}`} type="button" disabled={item.number > maxVisited} onClick={() => onStep(item.number)} aria-current={item.number === step ? "step" : undefined} key={item.number}><span>{complete ? <Icon name="check" width="13" height="13" /> : item.number}</span><small>{item.label}</small></button>;
      })}
    </nav>
  );
}

function BuilderAvatarVisual({ source, customPreview, avatarId, size = 64 }: { source: AvatarSource; customPreview: string | null; avatarId: string; size?: number }) {
  return source === "custom" && customPreview ? (
    <Image className="ruh-avatar-portrait ruh-custom-avatar-image" src={customPreview} alt="Custom avatar" width={size} height={size} unoptimized />
  ) : (
    <AvatarPortrait avatarId={avatarId} />
  );
}

export function AgentBuilder({ initialAvatarId, initialSource, resumeAgentId }: { initialAvatarId?: string; initialSource: AvatarSource; resumeAgentId?: string }) {
  const router = useRouter();
  const resumeMode = Boolean(resumeAgentId);
  const generatedSeed = useId().replace(/[^a-z0-9]/gi, "").toLowerCase();
  const [generatedId, setGeneratedId] = useState(generatedSeed);
  const storageId = resumeAgentId ?? `agent-${generatedId}`;
  const [step, setStep] = useState<BuilderStep>(resumeMode ? 3 : 1);
  const [maxVisited, setMaxVisited] = useState<BuilderStep>(resumeMode ? 3 : 1);
  const [agentName, setAgentName] = useState(resumeMode ? "Theo Onboarding" : "");
  const [website, setWebsite] = useState(resumeMode ? "app.northstar.com" : "");
  const [purpose, setPurpose] = useState<"sales" | "support" | "both">(resumeMode ? "support" : "sales");
  const [outcome, setOutcome] = useState(resumeMode ? "Guide product onboarding" : "Help visitors purchase");
  const [language, setLanguage] = useState("English");
  const [scanState, setScanState] = useState<ScanState>(resumeMode ? "ready" : "idle");
  const [avatarSource, setAvatarSource] = useState<AvatarSource>(initialSource);
  const [avatarId, setAvatarId] = useState(initialAvatarId && avatars.some((avatar) => avatar.id === initialAvatarId) ? initialAvatarId : avatars[0]?.id ?? "sarah");
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const customFileRef = useRef<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const [greeting, setGreeting] = useState("Hi! I’m here if you’d like help finding the right option.");
  const [tone, setTone] = useState("Warm and professional");
  const [responseLength, setResponseLength] = useState("Balanced");
  const [instructions, setInstructions] = useState("Be helpful, concise, and focused on the visitor’s goal. Never pressure a visitor.");
  const [sources, setSources] = useState([{ id: "site", name: resumeMode ? "app.northstar.com" : "Website scan", detail: resumeMode ? "24 pages ready" : "Added after your website is scanned", enabled: true }]);
  const [enabledActions, setEnabledActions] = useState<Record<string, boolean>>({ capture: true, recommend: !resumeMode, handoff: true });
  const [widgetPosition, setWidgetPosition] = useState<"left" | "right">("right");
  const [widgetTheme, setWidgetTheme] = useState<"light" | "dark">("light");
  const [autoOpen, setAutoOpen] = useState(true);
  const [installMethod, setInstallMethod] = useState("JavaScript");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voices, setVoices] = useState<AnamVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [launchState, setLaunchState] = useState<LaunchState>("draft");
  const [published, setPublished] = useState(false);
  const [launchedAgentId, setLaunchedAgentId] = useState(resumeAgentId ?? "");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [saveLabel, setSaveLabel] = useState("All changes saved");
  const [createdAt] = useState(() => new Date().toISOString());
  const uploadRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);

  const selectedAvatar = useMemo(() => avatars.find((avatar) => avatar.id === avatarId) ?? avatars[0], [avatarId]);
  const displayName = agentName.trim() || selectedAvatar.name;
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const embedCode = `<script src="${appOrigin}/api/embed/${launchedAgentId || storageId}" async></script>`;

  const builderState = useMemo<StoredBuilderState>(() => ({
    step,
    maxVisited,
    agentName,
    website,
    purpose,
    outcome,
    language,
    scanState: scanState === "scanning" ? "idle" : scanState,
    avatarSource,
    avatarId,
    customAvatarDataUrl: customPreview,
    customFileName,
    consent,
    voiceId,
    greeting,
    tone,
    responseLength,
    instructions,
    sources,
    enabledActions,
    widgetPosition,
    widgetTheme,
    autoOpen,
    installMethod,
  }), [step, maxVisited, agentName, website, purpose, outcome, language, scanState, avatarSource, avatarId, customPreview, customFileName, consent, voiceId, greeting, tone, responseLength, instructions, sources, enabledActions, widgetPosition, widgetTheme, autoOpen, installMethod]);

  const draftAgent = useMemo<FrontendAgent>(() => ({
    id: storageId,
    name: displayName,
    role: purpose === "support" ? "Customer support" : purpose === "both" ? "Sales & support" : "Sales concierge",
    website: website.replace(/^https?:\/\//, "") || "Website not set",
    status: published ? "Live" : "Draft",
    avatarId,
    conversations: 0,
    outcomes: 0,
    conversionRate: "—",
    lastActive: published ? "Published just now" : "Draft saved just now",
    setupProgress: Math.max(25, maxVisited * 25),
    customAvatarDataUrl: avatarSource === "custom" ? customPreview ?? undefined : undefined,
    widgetInstalled: false,
    createdAt,
    builderState,
  }), [storageId, displayName, purpose, website, avatarId, published, maxVisited, avatarSource, customPreview, createdAt, builderState]);

  // Fetch real Anam voices on mount
  useEffect(() => {
    fetch("/api/voices?perPage=50")
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) {
          setVoices(json.data);
          // Auto-select the first voice if none is set yet
          if (!voiceId && json.data.length > 0) {
            setVoiceId(json.data[0].id);
          }
        }
      })
      .catch(() => {/* silently degrade */})
      .finally(() => setVoicesLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  useEffect(() => {
    if (!resumeAgentId) {
      if (!hydratedRef.current) {
        const uniqueId = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replaceAll("-", "")
          : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
        setGeneratedId(uniqueId);
      }
      hydratedRef.current = true;
      return;
    }
    const stored = findStoredAgent(resumeAgentId);
    const saved = stored?.builderState;
    if (!saved) {
      hydratedRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      setStep(saved.step); setMaxVisited(saved.maxVisited); setAgentName(saved.agentName); setWebsite(saved.website);
      setPurpose(saved.purpose); setOutcome(saved.outcome); setLanguage(saved.language); setScanState(saved.scanState);
      setAvatarSource(saved.avatarSource); setAvatarId(saved.avatarId); setCustomPreview(saved.customAvatarDataUrl);
      setCustomFileName(saved.customFileName); setConsent(saved.consent); setVoiceId(saved.voiceId); setGreeting(saved.greeting);
      setTone(saved.tone); setResponseLength(saved.responseLength); setInstructions(saved.instructions); setSources(saved.sources);
      setEnabledActions(saved.enabledActions); setWidgetPosition(saved.widgetPosition); setWidgetTheme(saved.widgetTheme);
      setAutoOpen(saved.autoOpen); setInstallMethod(saved.installMethod); setSaveLabel("Draft restored");
      setPublished(stored.status === "Live");
      hydratedRef.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [resumeAgentId]);

  useEffect(() => {
    if (!hydratedRef.current || launchState === "live") return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => upsertStoredAgent(draftAgent), 350);
    return () => { if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current); };
  }, [draftAgent, launchState]);

  function markSaving() { setSaveLabel("Saving…"); window.setTimeout(() => setSaveLabel("Saved just now"), 450); }
  function goForward(next: BuilderStep) { setMaxVisited((current) => Math.max(current, next) as BuilderStep); setStep(next); markSaving(); document.getElementById("dashboard-content")?.scrollTo({ top: 0, behavior: "smooth" }); }
  function scanWebsite() {
    if (!website.trim() || scanState === "scanning") return;
    setScanState("scanning");
    setScanError(null);

    // Move the user forward immediately — don't block them
    goForward(2);

    // Run the crawl in the background
    const rawUrl = website.trim();
    const fullUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fullUrl }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Scan failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setProfileId(data.profileId ?? null);
        const pageCount = data.pageCount ?? "several";
        setSources([{
          id: "site",
          name: website.replace(/^https?:\/\//, ""),
          detail: `${pageCount} pages ready`,
          enabled: true,
        }]);
        if (!agentName.trim()) {
          setAgentName(data.companyName
            ? `${data.companyName} ${purpose === "support" ? "Support" : "Guide"}`
            : `${selectedAvatar.name} ${purpose === "support" ? "Support" : "Guide"}`);
        }
        setScanState("ready");
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Could not reach the website.";
        setScanError(msg);
        setScanState("idle");
      });
  }
  function handlePhoto(file?: File) {
    if (!file) return;
    customFileRef.current = file;
    setCustomFileName(file.name);
    markSaving();
    // Read as base64 so the preview survives navigation (blob URLs die on page leave)
    const reader = new FileReader();
    reader.onload = (e) => setCustomPreview(e.target?.result as string ?? null);
    reader.readAsDataURL(file);
  }
  function addKnowledgeFile(file?: File) { if (!file) return; setSources((current) => [...current, { id: `file-${Date.now()}`, name: file.name, detail: "Ready", enabled: true }]); markSaving(); }
  function previewVoice(id: string) {
    // Stop current playback
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    if (playingVoiceId === id) { setPlayingVoiceId(null); return; }

    const voice = voices.find((v) => v.id === id);
    const url = voice?.previewSampleUrl;
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setPlayingVoiceId(null); audioRef.current = null; };
    audio.onerror = () => { setPlayingVoiceId(null); audioRef.current = null; };
    setPlayingVoiceId(id);
    audio.play().catch(() => setPlayingVoiceId(null));
  }
  async function copyCode() { try { await navigator.clipboard.writeText(embedCode); } catch { /* Clipboard permissions are optional in preview. */ } setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  async function launchAgent() {
    setLaunchState("launching");
    try {
      // Upload custom photo to Supabase Storage + create Anam avatar
      let avatarImageUrl: string | null = null;
      let customAnamAvatarId: string | null = null;
      if (avatarSource === "custom" && customFileRef.current) {
        const form = new FormData();
        form.append("file", customFileRef.current);
        form.append("displayName", displayName || "Custom Avatar");
        const uploadRes = await fetch("/api/agents/upload-avatar", { method: "POST", body: form });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          avatarImageUrl = uploadData.url ?? null;
          customAnamAvatarId = uploadData.anamAvatarId ?? null;
        }
      }

      const selectedAvatarData = avatars.find((a) => a.id === avatarId);
      // If custom photo was uploaded and Anam created an avatar, use that ID;
      // otherwise fall back to the stock avatar's Anam ID
      const finalAnamAvatarId = customAnamAvatarId ?? selectedAvatarData?.anamAvatarId ?? null;

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          role: purpose === "support" ? "Customer support" : purpose === "both" ? "Sales & support" : "Sales concierge",
          website: website.replace(/^https?:\/\//, ""),
          status: "Live",
          avatarId,
          anamAvatarId: finalAnamAvatarId,
          anamVoiceId: voiceId || null,
          avatarImageUrl,
          greeting,
          tone,
          responseLength,
          instructions,
          language,
          purpose,
          profileId,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setLaunchedAgentId(saved.id);
        // Remove the draft from localStorage now that it's persisted in DB
        removeStoredAgent(storageId);
      }
    } catch {
      // Save locally as fallback
    }
    setLaunchState("live");
  }

  return (
    <div className="ruh-page-stack ruh-agent-builder">
      <BuilderHeader step={step} onSaveExit={() => router.push("/dashboard/agents")} />
      <Progress step={step} maxVisited={maxVisited} onStep={setStep} />

      {/* Background scan status — shows across all steps */}
      {scanState === "scanning" && step > 1 ? (
        <div className="ruh-scan-banner" role="status">
          <span className="ruh-progress-spinner" />
          <span>Learning from your website — you can keep building while this runs.</span>
        </div>
      ) : null}
      {scanState === "ready" && step > 1 && step < 4 ? (
        <div className="ruh-scan-banner ruh-scan-banner--done">
          <Icon name="check" width="14" height="14" />
          <span>Website scanned — business profile ready.</span>
        </div>
      ) : null}
      {scanError && step > 1 ? (
        <div className="ruh-scan-banner ruh-scan-banner--error">
          <span>Scan failed: {scanError}</span>
          <button type="button" onClick={() => { setScanError(null); setScanState("idle"); setStep(1); }}>Fix URL</button>
        </div>
      ) : null}

      {step === 1 ? <section className="ruh-builder-surface" aria-labelledby="builder-step-one">
        <div className="ruh-builder-intro"><p className="ruh-kicker">Start with the essentials</p><h2 id="builder-step-one">Where will this agent work?</h2><p>Ruhana uses your website to prepare useful knowledge and page-aware guidance automatically.</p></div>
        <div className="ruh-builder-form-grid">
          <label className="ruh-form-field"><span>Website URL</span><input type="url" value={website} onChange={(event) => { setWebsite(event.target.value); setScanState("idle"); }} placeholder="yourwebsite.com" /><small>You can review every page before launch.</small></label>
          <label className="ruh-form-field"><span>Agent name</span><input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder={`${selectedAvatar.name} Guide`} /><small>Visitors will see this name in the widget.</small></label>
          <fieldset className="ruh-choice-fieldset ruh-full-field"><legend>What should this agent help with?</legend><div className="ruh-choice-card-grid">{[["sales", "Sales", "Recommend, qualify, and help visitors convert."], ["support", "Support", "Answer questions and resolve common requests."], ["both", "Sales & support", "Guide visitors across the complete journey."]].map(([value, title, description]) => <label key={value}><input type="radio" name="purpose" checked={purpose === value} onChange={() => { setPurpose(value as typeof purpose); markSaving(); }} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div></fieldset>
          <label className="ruh-form-field"><span>Most important result</span><select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option>Help visitors purchase</option><option>Capture qualified leads</option><option>Book meetings</option><option>Resolve support questions</option><option>Guide product onboarding</option></select></label>
          <label className="ruh-form-field"><span>Main language</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Spanish</option><option>Arabic</option><option>Urdu</option><option>French</option><option>German</option></select></label>
        </div>
        {scanState === "ready" ? <div className="ruh-inline-success"><Icon name="check" width="17" height="17" /><div><strong>Website ready</strong><small>Pages scanned and business profile created.</small></div></div> : null}
        {scanError ? <div className="ruh-inline-error" role="alert"><div><strong>Scan failed</strong><small>{scanError}</small></div></div> : null}
        <div className="ruh-builder-footer"><span>{saveLabel}</span><button className="ruh-primary-button" type="button" disabled={!website.trim()} onClick={() => scanState === "ready" ? goForward(2) : scanWebsite()}>{scanState === "ready" ? "Continue" : "Scan website & continue"}<Icon name="arrow" width="15" height="15" /></button></div>
      </section> : null}

      {step === 2 ? <section className="ruh-builder-surface ruh-look-step" aria-labelledby="builder-step-two">
        <div className="ruh-builder-intro"><p className="ruh-kicker">Appearance</p><h2 id="builder-step-two">Choose how your agent looks and sounds</h2><p>Use a ready-made avatar or create a custom one from a clear portrait.</p></div>
        <div className="ruh-source-tabs" role="group" aria-label="Avatar source"><button className={avatarSource === "library" ? "is-active" : ""} type="button" aria-pressed={avatarSource === "library"} onClick={() => setAvatarSource("library")}>Avatar library</button><button className={avatarSource === "custom" ? "is-active" : ""} type="button" aria-pressed={avatarSource === "custom"} onClick={() => setAvatarSource("custom")}>Create from photo</button></div>
        {avatarSource === "library" ? <div className="ruh-builder-avatar-grid">{avatars.map((avatar) => <button className={avatar.id === avatarId ? "is-selected" : ""} type="button" onClick={() => { setAvatarId(avatar.id); markSaving(); }} aria-pressed={avatar.id === avatarId} key={avatar.id}><AvatarPortrait avatarId={avatar.id} /><span><strong>{avatar.name}</strong><small>{avatar.title}</small></span>{avatar.id === avatarId ? <i><Icon name="check" width="13" height="13" /></i> : null}</button>)}</div> : <div className="ruh-custom-upload-area"><input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload custom avatar photo" onChange={(event) => handlePhoto(event.target.files?.[0])} hidden />{customPreview ? <div className="ruh-uploaded-photo"><Image src={customPreview} alt="Uploaded avatar preview" width={160} height={200} unoptimized /><div><strong>{customFileName}</strong><small>Photo ready for avatar creation</small><button type="button" onClick={() => uploadRef.current?.click()}>Choose another photo</button></div></div> : <button className="ruh-upload-dropzone" type="button" onClick={() => uploadRef.current?.click()}><span><Icon name="plus" width="22" height="22" /></span><strong>Upload a clear portrait</strong><small>JPG, PNG, or WebP. Face the camera with even lighting.</small></button>}<label className="ruh-consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I have permission to create and use an avatar from this image.</span></label></div>}
        <div className="ruh-builder-divider" />
        <div className="ruh-subsection-heading"><div><h3>Choose a voice</h3><p>Preview voices later; the selected voice is used in the live test.</p></div><span>{language}</span></div>
        {voicesLoading ? (
          <p className="ruh-voices-loading">Loading voices…</p>
        ) : (
          <div className="ruh-voice-grid">{voices.map((voice) => {
            const label = voice.displayName;
            const detail = [voice.description?.split(".")[0], voice.country ? `· ${voice.country}` : ""].filter(Boolean).join(" ");
            const lang = voice.gender ? (voice.gender === "FEMALE" ? "Female" : voice.gender === "MALE" ? "Male" : "Neutral") : "";
            return (
              <label className={voiceId === voice.id ? "is-selected" : ""} key={voice.id}>
                <input type="radio" name="voice" checked={voiceId === voice.id} onChange={() => { setVoiceId(voice.id); markSaving(); }} />
                <button type="button" aria-label={`${playingVoiceId === voice.id ? "Stop" : "Preview"} ${label} voice`} aria-pressed={playingVoiceId === voice.id} onClick={(event) => { event.preventDefault(); previewVoice(voice.id); }}>{playingVoiceId === voice.id ? "■" : "▶"}</button>
                <span><strong>{label}</strong><small>{detail}</small></span>
                <em>{lang}</em>
              </label>
            );
          })}</div>
        )}
        <label className="ruh-form-field ruh-full-field"><span>Welcome message</span><textarea rows={3} value={greeting} onChange={(event) => setGreeting(event.target.value)} /><small>This is the first thing visitors hear or read.</small></label>
        <div className="ruh-builder-footer"><button className="ruh-secondary-button" type="button" onClick={() => setStep(1)}>Back</button><span>{saveLabel}</span><button className="ruh-primary-button" type="button" disabled={avatarSource === "custom" && (!customPreview || !consent)} onClick={() => goForward(3)}>Use this look & continue<Icon name="arrow" width="15" height="15" /></button></div>
      </section> : null}

      {step === 3 ? <section className="ruh-builder-surface" aria-labelledby="builder-step-three">
        <div className="ruh-builder-intro"><p className="ruh-kicker">Intelligence</p><h2 id="builder-step-three">Give your agent the right knowledge and behavior</h2><p>Everything is written in plain language. Technical controls stay out of the way.</p></div>
        <div className="ruh-builder-section-block"><div className="ruh-subsection-heading"><div><h3>What it knows</h3><p>Choose which sources your agent can use in conversations.</p></div><label className="ruh-secondary-button ruh-file-button">Add knowledge<input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => addKnowledgeFile(event.target.files?.[0])} hidden /></label></div><div className="ruh-source-list">{sources.map((source) => <div key={source.id}><span className="ruh-source-icon">{source.id === "site" ? "WWW" : "DOC"}</span><span><strong>{source.name}</strong><small>{source.detail}</small></span><label className="ruh-switch"><input type="checkbox" checked={source.enabled} onChange={() => setSources((items) => items.map((item) => item.id === source.id ? { ...item, enabled: !item.enabled } : item))} /><i /></label></div>)}</div></div>
        <div className="ruh-builder-section-block"><div className="ruh-subsection-heading"><div><h3>How it behaves</h3><p>Set a consistent style without writing a technical prompt.</p></div></div><div className="ruh-builder-form-grid"><label className="ruh-form-field"><span>Tone</span><select value={tone} onChange={(event) => setTone(event.target.value)}><option>Warm and professional</option><option>Confident and concise</option><option>Calm and reassuring</option><option>Friendly and energetic</option></select></label><label className="ruh-form-field"><span>Response length</span><select value={responseLength} onChange={(event) => setResponseLength(event.target.value)}><option>Concise</option><option>Balanced</option><option>Detailed</option></select></label><label className="ruh-form-field ruh-full-field"><span>Behavior instructions</span><textarea rows={4} value={instructions} onChange={(event) => setInstructions(event.target.value)} /><small>When unsure, the agent should say so and offer a human handoff.</small></label></div></div>
        <div className="ruh-builder-section-block"><div className="ruh-subsection-heading"><div><h3>What it can do</h3><p>Start with useful actions. Connect additional tools whenever you need them.</p></div><Link href="/dashboard/integrations">Manage integrations</Link></div><div className="ruh-action-option-grid">{actionOptions.map((action) => <article className={enabledActions[action.id] ? "is-enabled" : ""} key={action.id}><div><span>{enabledActions[action.id] ? <Icon name="check" width="14" height="14" /> : <Icon name="plus" width="14" height="14" />}</span><div><h4>{action.title}</h4><p>{action.description}</p></div></div>{action.ready ? <label className="ruh-switch"><input type="checkbox" checked={Boolean(enabledActions[action.id])} onChange={() => setEnabledActions((current) => ({ ...current, [action.id]: !current[action.id] }))} /><i /></label> : <Link href="/dashboard/integrations">Connect to enable</Link>}</article>)}</div></div>
        <div className="ruh-builder-footer"><button className="ruh-secondary-button" type="button" onClick={() => setStep(2)}>Back</button><span>{saveLabel}</span><button className="ruh-primary-button" type="button" onClick={() => goForward(4)}>Prepare my agent<Icon name="arrow" width="15" height="15" /></button></div>
      </section> : null}

      {step === 4 ? <section className="ruh-builder-surface ruh-launch-step" aria-labelledby="builder-step-four">{launchState === "live" ? <div className="ruh-launch-success"><span><Icon name="check" width="25" height="25" /></span><p className="ruh-kicker">Agent live</p><h2>{displayName} is ready to welcome visitors</h2><p>Your agent is published with its avatar, knowledge, actions, and website context.</p><div><Link className="ruh-primary-button" href={`/dashboard/agents/${launchedAgentId || "northstar-sales"}`}>View agent</Link><button className="ruh-secondary-button" type="button" onClick={() => setLaunchState("draft")}>Return to setup</button></div></div> : <>
        <div className="ruh-builder-intro"><p className="ruh-kicker">Preview and deploy</p><h2 id="builder-step-four">Make it feel at home on your website</h2><p>Adjust the widget, copy one small code snippet, and launch when you are ready.</p></div>
        <div className="ruh-launch-layout"><div className="ruh-widget-controls">
          <div className="ruh-builder-section-block"><div className="ruh-subsection-heading"><div><h3>Widget appearance</h3><p>A quiet default that keeps your website in focus.</p></div></div><div className="ruh-control-pair"><label className="ruh-form-field"><span>Position</span><select value={widgetPosition} onChange={(event) => setWidgetPosition(event.target.value as "left" | "right")}><option value="right">Bottom right</option><option value="left">Bottom left</option></select></label><label className="ruh-form-field"><span>Appearance</span><select value={widgetTheme} onChange={(event) => setWidgetTheme(event.target.value as "light" | "dark")}><option value="light">Light</option><option value="dark">Dark</option></select></label></div><label className="ruh-setting-row"><span><strong>Open with a greeting</strong><small>Invite visitors after a short delay.</small></span><span className="ruh-switch"><input type="checkbox" checked={autoOpen} onChange={(event) => setAutoOpen(event.target.checked)} /><i /></span></label></div>
          <div className="ruh-builder-section-block"><div className="ruh-subsection-heading"><div><h3>Install on your website</h3><p>Choose your platform and follow the short instructions.</p></div></div><div className="ruh-platform-row">{["JavaScript", "Shopify", "WordPress", "Webflow", "GTM"].map((method) => <button className={installMethod === method ? "is-active" : ""} type="button" onClick={() => setInstallMethod(method)} key={method}>{method}</button>)}</div><div className="ruh-code-snippet"><code>{embedCode}</code><button type="button" onClick={copyCode}>{copied ? "Copied" : "Copy code"}</button></div><div className="ruh-install-actions"><button className="ruh-secondary-button" type="button" onClick={() => setSaveLabel("Installation instructions prepared for email")}>Email instructions</button><button className="ruh-secondary-button" type="button" onClick={() => setSaveLabel("Installation check is ready after your site is published")}>Check installation</button></div></div>
        </div><div className={`ruh-site-preview is-${widgetTheme}`}><div className="ruh-browser-bar"><i /><i /><i /><span>{website || "yourwebsite.com"}</span></div><div className="ruh-preview-site-content"><span /><strong /><span /><div /><div /></div><div className={`ruh-widget-preview is-${widgetPosition}`}>{previewOpen ? <div className="ruh-widget-message"><BuilderAvatarVisual source={avatarSource} customPreview={customPreview} avatarId={avatarId} /><span><strong>{displayName}</strong><small>{greeting}</small></span><button type="button" aria-label="Close preview" onClick={() => setPreviewOpen(false)}>×</button></div> : null}<button className="ruh-widget-launcher" type="button" aria-expanded={previewOpen} onClick={() => setPreviewOpen((open) => !open)}><BuilderAvatarVisual source={avatarSource} customPreview={customPreview} avatarId={avatarId} size={48} /><span>{previewOpen ? "Hide" : "Talk to"} {displayName}</span></button></div></div></div>
        <div className="ruh-launch-checklist"><span><Icon name="check" width="14" height="14" /> Website knowledge ready</span><span><Icon name="check" width="14" height="14" /> Avatar and voice selected</span><span><Icon name="check" width="14" height="14" /> {Object.values(enabledActions).filter(Boolean).length} actions enabled</span></div>
        <div className="ruh-builder-footer"><button className="ruh-secondary-button" type="button" onClick={() => setStep(3)}>Back</button><span>{copied ? "Website code copied" : saveLabel}</span><button className="ruh-primary-button" type="button" disabled={launchState === "launching"} onClick={launchAgent}>{launchState === "launching" ? "Launching…" : "Launch agent"}<Icon name="arrow" width="15" height="15" /></button></div>
      </>}</section> : null}
    </div>
  );
}
