import Link from "next/link";
import type { ReactNode } from "react";
import { RuhanaLogo } from "./ruhana-logo";

export type LegalSectionLink = {
  href: string;
  label: string;
};

type LegalDocumentProps = {
  current: "privacy" | "terms";
  eyebrow: string;
  title: string;
  summary: ReactNode;
  updated: string;
  sections: LegalSectionLink[];
  children: ReactNode;
};

export function LegalDocument({
  current,
  eyebrow,
  title,
  summary,
  updated,
  sections,
  children,
}: LegalDocumentProps) {
  return (
    <div className="legal-page">
      <a className="legal-skip-link" href="#legal-document">
        Skip to document
      </a>

      <header className="legal-header">
        <RuhanaLogo />
        <nav aria-label="Legal documents">
          <Link aria-current={current === "privacy" ? "page" : undefined} href="/privacy">
            Privacy
          </Link>
          <Link aria-current={current === "terms" ? "page" : undefined} href="/terms">
            Terms
          </Link>
          <Link className="legal-header-action" href="/sign-in">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="legal-main" id="legal-document">
        <section className="legal-intro">
          <p className="legal-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <div className="legal-summary">{summary}</div>
          <p className="legal-updated">
            <span>Effective</span>
            <time dateTime="2026-09-07">{updated}</time>
          </p>
        </section>

        <div className="legal-layout">
          <aside className="legal-index">
            <p>In this document</p>
            <nav aria-label={`${title} sections`}>
              {sections.map((section, index) => (
                <a href={section.href} key={section.href}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="legal-content">{children}</article>
        </div>
      </main>

      <footer className="legal-footer">
        <div>
          <RuhanaLogo />
          <p>Context-aware video agents for useful conversations.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/">Product</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <a href="mailto:support@ruhanaai.com">Contact</a>
        </nav>
        <p>© {new Date().getFullYear()} Ruhana AI</p>
      </footer>
    </div>
  );
}
