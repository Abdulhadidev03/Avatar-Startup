import Link from "next/link";

type RuhanaLogoProps = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export function RuhanaLogo({ href = "/", className = "", compact = false }: RuhanaLogoProps) {
  const content = (
    <>
      <svg aria-hidden="true" className="ruh-brand-mark" viewBox="0 0 30 30">
        <path d="M6 25.5V4.5h8.6c5.7 0 9.1 2.6 9.1 7.2s-3.4 7.3-9.1 7.3H6" />
        <path d="m15 19 9 7" />
        <path d="M6 10.7h8.2" />
      </svg>
      {!compact && <span>Ruhana</span>}
    </>
  );

  return href ? (
    <Link className={`ruh-brand ${className}`.trim()} href={href} aria-label="Ruhana home">
      {content}
    </Link>
  ) : (
    <span className={`ruh-brand ${className}`.trim()} aria-label="Ruhana">
      {content}
    </span>
  );
}
