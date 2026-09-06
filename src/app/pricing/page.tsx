import type { Metadata } from "next";
import Link from "next/link";
import { RuhanaLogo } from "@/components/ruhana-logo";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pricingPlans } from "@/lib/pricing";
import "./pricing.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple paid plans for context-aware Ruhana video agents, with deployment, transcripts, actions, and outcome analytics included.",
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="m3.3 8.2 2.8 2.7 6.5-6.2" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3 10h13M11.5 5.5 16 10l-4.5 4.5" />
    </svg>
  );
}
export default async function PricingPage() {
  let authenticated = false;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    authenticated = Boolean(data.user);
  } catch {
    // Pricing stays public while authentication is being configured.
  }

  const appHref = authenticated ? "/dashboard/agents" : "/sign-in";
  const appLabel = authenticated ? "Go to app" : "Build your agent";

  return (
    <div className="pricing-root">
      <a className="pricing-skip" href="#pricing-main">Skip to pricing</a>

      <header className="pricing-nav">
        <RuhanaLogo href="/" />
        <nav aria-label="Main navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#use-cases">Use cases</Link>
          <Link href="/#impact">Impact</Link>
          <Link aria-current="page" href="/pricing">Pricing</Link>
        </nav>
        <div className="pricing-nav-actions">
          {!authenticated ? <Link className="pricing-sign-in" href="/sign-in">Sign in</Link> : null}
          <Link className="pricing-button pricing-button-dark pricing-button-small" href={appHref}>
            {appLabel}<ArrowIcon />
          </Link>
        </div>
      </header>

      <main id="pricing-main">
        <section className="pricing-hero">
          <div className="pricing-hero-copy">
            <span className="pricing-eyebrow"><i /> Simple, outcome-ready pricing</span>
            <h1>Choose the room your agent needs to <em>make an impact.</em></h1>
            <p>
              Every Ruhana plan includes the agent builder, website deployment, conversations,
              transcripts, and business-impact analytics. Upgrade for more agents, capacity, and control.
            </p>
          </div>
          <aside className="pricing-hero-note" aria-label="How Ruhana bills">
            <span>How billing works</span>
            <strong>Platform access + connected minutes.</strong>
            <p>You pay for real conversation time. Idle widgets do not use the included allowance.</p>
            <div><b>USD</b><b>Monthly</b><b>Cancel anytime</b></div>
          </aside>
        </section>

        <section className="pricing-plans" aria-labelledby="plans-heading">
          <div className="pricing-section-heading">
            <span>01 · Plans</span>
            <h2 id="plans-heading">Four plans. No feature maze.</h2>
            <p>Start with the deployment you need now. Connected-minute overage keeps a successful agent online.</p>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => {
              const enterprise = plan.name === "Enterprise";
              return (
                <article
                  className={`pricing-card tone-${plan.tone}${plan.recommended ? " is-recommended" : ""}`}
                  key={plan.name}
                >
                  <div className="pricing-card-accent" />
                  <div className="pricing-card-head">
                    <h3>{plan.name}</h3>
                    {plan.recommended ? <span>Most useful</span> : null}
                  </div>
                  <p className="pricing-card-description">{plan.description}</p>
                  <div className="pricing-price">
                    <strong>{plan.priceLabel}</strong>
                    <span>/ month</span>
                  </div>
                  <div className="pricing-capacity">
                    <span>{plan.minutesLabel}</span>
                    <small>{plan.overage} after that</small>
                  </div>
                  <dl className="pricing-plan-facts">
                    <div><dt>Agents</dt><dd>{plan.agents}</dd></div>
                    <div><dt>Websites</dt><dd>{plan.websites}</dd></div>
                    <div><dt>Concurrent</dt><dd>{plan.concurrency}</dd></div>
                  </dl>
                  <div className="pricing-analytics">
                    <span>Included analytics</span>
                    <strong>{plan.analytics}</strong>
                  </div>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}><CheckIcon /><span>{feature}</span></li>
                    ))}
                  </ul>
                  <Link className={`pricing-button ${plan.recommended ? "pricing-button-paper" : "pricing-button-outline"}`} href={enterprise ? "mailto:sales@ruhanaai.com?subject=Ruhana%20Enterprise" : appHref}>
                    {enterprise ? "Talk to us" : authenticated ? "Choose plan" : "Start with this plan"}<ArrowIcon />
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="pricing-fine-print">Prices exclude applicable taxes. Connected minutes are measured by actual live session time.</p>
        </section>

        <section className="pricing-included" aria-labelledby="included-heading">
          <div className="pricing-section-heading pricing-section-heading-light">
            <span>02 · Included</span>
            <h2 id="included-heading">The complete customer journey starts on every plan.</h2>
          </div>
          <div className="pricing-included-grid">
            {[
              ["Observe", "Page, product, click, and journey context shape the conversation."],
              ["Converse", "Visitors can speak or type while the agent keeps the thread coherent."],
              ["Act", "Capture leads, qualify intent, book, recommend, or hand off cleanly."],
              ["Measure", "See conversations become outcomes instead of stopping at usage counts."],
            ].map(([title, body], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </section>

        <section className="pricing-compare" aria-labelledby="compare-heading">
          <div className="pricing-section-heading">
            <span>03 · Compare</span>
            <h2 id="compare-heading">The practical differences, at a glance.</h2>
          </div>
          <div className="pricing-table-wrap">
            <table>
              <thead>
                <tr><th scope="col">Capability</th>{pricingPlans.map((plan) => <th scope="col" key={plan.name}>{plan.name}</th>)}</tr>
              </thead>
              <tbody>
                <tr><th scope="row">Connected minutes</th>{pricingPlans.map((plan) => <td key={plan.name}>{plan.minutesLabel.replace(" connected minutes", "")}</td>)}</tr>
                <tr><th scope="row">Agents</th>{pricingPlans.map((plan) => <td key={plan.name}>{plan.agents}</td>)}</tr>
                <tr><th scope="row">Websites</th>{pricingPlans.map((plan) => <td key={plan.name}>{plan.websites}</td>)}</tr>
                <tr><th scope="row">Live sessions</th>{pricingPlans.map((plan) => <td key={plan.name}>{plan.concurrency}</td>)}</tr>
                <tr><th scope="row">Own photo or Ruhana avatar</th>{pricingPlans.map((plan) => <td className="has-check" key={plan.name}><CheckIcon /><span className="pricing-visually-hidden">Included</span></td>)}</tr>
                <tr><th scope="row">Transcripts and history</th>{pricingPlans.map((plan) => <td className="has-check" key={plan.name}><CheckIcon /><span className="pricing-visually-hidden">Included</span></td>)}</tr>
                <tr><th scope="row">Outcome analytics</th>{pricingPlans.map((plan) => <td key={plan.name}>{plan.analytics}</td>)}</tr>
                <tr><th scope="row">Support</th>{pricingPlans.map((plan) => <td key={plan.name}>{plan.support}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="pricing-enterprise">
          <div>
            <span className="pricing-eyebrow pricing-eyebrow-light"><i /> Enterprise pathway</span>
            <h2>Your customer experience, inside <em>your boundaries.</em></h2>
          </div>
          <div className="pricing-enterprise-copy">
            <p>For teams that need private deployment, tighter governance, custom actions, or a KPI model shaped around their operation.</p>
            <ul>
              <li><CheckIcon /> Private cloud or on-premise pathway</li>
              <li><CheckIcon /> SSO, governance, and custom retention</li>
              <li><CheckIcon /> Integration and success engineering</li>
            </ul>
            <a className="pricing-button pricing-button-paper" href="mailto:sales@ruhanaai.com?subject=Ruhana%20Enterprise">Plan an enterprise deployment<ArrowIcon /></a>
          </div>
        </section>

        <section className="pricing-faq" aria-labelledby="faq-heading">
          <div className="pricing-section-heading">
            <span>04 · Questions</span>
            <h2 id="faq-heading">Clear before you commit.</h2>
          </div>
          <div className="pricing-faq-list">
            <details>
              <summary>What counts as a connected minute?<span>+</span></summary>
              <p>Only time inside an active live agent session. A visitor seeing the closed widget does not consume minutes.</p>
            </details>
            <details>
              <summary>Can I use my own picture?<span>+</span></summary>
              <p>Yes. You can start with a Ruhana avatar or create a private avatar from your own approved image.</p>
            </details>
            <details>
              <summary>Do analytics cost extra?<span>+</span></summary>
              <p>No. Every paid plan includes outcome analytics; higher tiers add deeper attribution, comparison, exports, and governance.</p>
            </details>
            <details>
              <summary>What happens when I use my allowance?<span>+</span></summary>
              <p>Your agent can stay available at the plan&apos;s connected-minute overage rate. Workspace owners can set usage alerts.</p>
            </details>
            <details>
              <summary>Can we start with a design partnership?<span>+</span></summary>
              <p>Yes. Contact us for a focused launch where the success metric and integration scope are agreed before deployment.</p>
            </details>
          </div>
        </section>

        <section className="pricing-final">
          <span>Ready when your visitors are</span>
          <h2>Put a useful agent on your website.</h2>
          <p>Start simple. Measure what changes. Scale the conversations that work.</p>
          <Link className="pricing-button pricing-button-dark" href={appHref}>{appLabel}<ArrowIcon /></Link>
        </section>
      </main>

      <footer className="pricing-footer">
        <div className="pricing-footer-top"><RuhanaLogo href="/" /><p>Context-aware video agents for sales, support, and measurable customer outcomes.</p></div>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <a href="mailto:support@ruhanaai.com">Contact</a>
        </nav>
        <p>© {new Date().getFullYear()} Ruhana AI · Built for useful conversations.</p>
      </footer>
    </div>
  );
}
