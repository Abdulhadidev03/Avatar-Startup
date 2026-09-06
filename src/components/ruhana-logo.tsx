import Link from "next/link";

type RuhanaLogoProps = {
  href?: string | null;
  className?: string;
  compact?: boolean;
  orientation?: "horizontal" | "vertical";
};

export function RuhanaMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`ruh-brand-mark ruh-logo-mark ${className}`.trim()}
      focusable="false"
      viewBox="0 0 100 120"
    >
      <path d="M0 0h53c22 0 36 14 36 36 0 16-8 27-22 32L0 0Z" />
      <circle cx="20" cy="49" r="14" />
      <path d="M0 62v58h58L0 62Z" />
      <path d="M18 70h50l32 33v17H68L18 70Z" />
    </svg>
  );
}

export function RuhanaLogo({
  href = "/",
  className = "",
  compact = false,
  orientation = "horizontal",
}: RuhanaLogoProps) {
  const content = (
    <>
      <RuhanaMark />
      {!compact && <span>Ruhana AI</span>}
    </>
  );
  const classes = `ruh-brand ruh-logo is-${orientation} ${className}`.trim();

  return href ? (
    <Link className={classes} href={href} aria-label="Ruhana AI home">
      {content}
    </Link>
  ) : (
    <span className={classes} aria-label="Ruhana AI">
      {content}
    </span>
  );
}
