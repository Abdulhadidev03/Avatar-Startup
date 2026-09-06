import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "agents"
  | "arrow"
  | "billing"
  | "calendar"
  | "check"
  | "chevron-down"
  | "close"
  | "conversations"
  | "copy"
  | "document"
  | "download"
  | "external"
  | "filter"
  | "globe"
  | "insights"
  | "integrations"
  | "menu"
  | "more"
  | "overview"
  | "pause"
  | "play"
  | "plus"
  | "results"
  | "search"
  | "send"
  | "settings"
  | "shield"
  | "sparkle"
  | "team"
  | "upload"
  | "usage";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export function Icon({ name, ...props }: IconProps) {
  const paths: Record<IconName, ReactNode> = {
    agents: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    billing: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 9h18M7 15h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    "chevron-down": <path d="m7 9 5 5 5-5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    conversations: (
      <>
        <path d="M20 15a4 4 0 0 1-4 4H8l-5 2V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" />
        <path d="M7.5 9h8M7.5 13h5" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    download: <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 20h16" />,
    external: <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8Z" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    insights: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        <path d="m4 7 5-4 6 5 5-4" />
      </>
    ),
    integrations: (
      <>
        <path d="M8 3v4M16 3v4M5 7h14v3a7 7 0 0 1-7 7v4" />
        <path d="M9 21h6" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    overview: <path d="M4 13h6V4H4ZM14 20h6v-9h-6ZM4 20h6v-3H4ZM14 7h6V4h-6Z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    play: <path d="m8 5 11 7-11 7Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    results: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="m14.5 9.5 6-6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    send: <path d="m21 3-7 18-4-7-7-4Zm-11 11 5-5" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    sparkle: <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />,
    team: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M16 5a3 3 0 0 1 0 6M18 13a4 4 0 0 1 3 4v2" />
      </>
    ),
    upload: <path d="M12 16V4m0 0L7 9m5-5 5 5M4 15v5h16v-5" />,
    usage: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
