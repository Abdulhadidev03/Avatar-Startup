"use client";

import type { ReactNode } from "react";

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" />
    </svg>
  );
}

export function WidgetLauncherPreview({
  avatar,
  name,
  open,
  position,
  onOpenChange,
}: {
  avatar: ReactNode;
  name: string;
  open: boolean;
  position: "left" | "right";
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className={`ruh-widget-preview is-${position}`}>
      {open ? (
        <section className="ruh-widget-call-preview" aria-label={`Call ${name}`}>
          <button type="button" aria-label="Minimize preview" onClick={() => onOpenChange(false)}>−</button>
          <div className="ruh-widget-call-avatar">{avatar}<i aria-hidden="true" /></div>
          <span>Available now</span>
          <strong>Talk with {name}</strong>
          <p>Ask naturally. Your agent already understands the page you are on.</p>
          <button className="ruh-widget-start-preview" type="button"><MicIcon /> Start call</button>
          <small>Continue by text</small>
        </section>
      ) : (
        <div className="ruh-widget-compact-preview">
          <button className="ruh-widget-compact-main" type="button" aria-expanded="false" onClick={() => onOpenChange(true)}>
            <span className="ruh-widget-preview-avatar">{avatar}<i aria-hidden="true" /></span>
            <span><strong>Need a hand?</strong><small>Talk with {name} about this page</small></span>
          </button>
          <button className="ruh-widget-preview-mic" type="button" aria-label={`Start call with ${name}`} onClick={() => onOpenChange(true)}><MicIcon /></button>
        </div>
      )}
    </div>
  );
}
