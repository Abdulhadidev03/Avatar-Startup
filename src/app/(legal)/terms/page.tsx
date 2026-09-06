import { LegalDocument, type LegalSectionLink } from "@/components/legal-document";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing access to and use of Ruhana AI.",
  alternates: { canonical: "/terms" },
};

const sections: LegalSectionLink[] = [
  { href: "#agreement", label: "Agreement and eligibility" },
  { href: "#accounts", label: "Accounts and workspaces" },
  { href: "#service", label: "The Services" },
  { href: "#content", label: "Content and likeness rights" },
  { href: "#responsible-agents", label: "Responsible agent use" },
  { href: "#acceptable-use", label: "Acceptable use" },
  { href: "#ai", label: "AI outputs and actions" },
  { href: "#fees", label: "Plans and payment" },
  { href: "#ownership", label: "Ownership" },
  { href: "#third-parties", label: "Third-party services" },
  { href: "#termination", label: "Suspension and termination" },
  { href: "#disclaimers", label: "Disclaimers and liability" },
  { href: "#changes", label: "Changes" },
  { href: "#contact", label: "Contact" },
];

export default function TermsPage() {
  return (
    <LegalDocument
      current="terms"
      eyebrow="Legal · Terms"
      title="Terms of Service"
      updated="September 7, 2026"
      sections={sections}
      summary={
        <>
          <p>
            These Terms of Service (“Terms”) govern access to and use of the Ruhana AI
            website, dashboard, APIs, avatar agents, embedded widgets, and related services.
          </p>
          <p>
            By creating an account, using the Services, or accepting an order that refers to
            these Terms, you agree to them. If you use Ruhana for an organization, you confirm
            that you have authority to bind that organization.
          </p>
        </>
      }
    >
      <section id="agreement">
        <span className="legal-section-number">01</span>
        <h2>Agreement and eligibility</h2>
        <p>
          You must be legally able to enter into a binding agreement and be at least 18 years
          old to create a Ruhana workspace. If applicable law permits business use at a lower
          age, a parent, guardian, or authorized organization must accept these Terms and remain
          responsible for the account.
        </p>
        <p>
          “Customer,” “you,” and “your” mean the person accepting these Terms and any
          organization they represent. “Ruhana,” “we,” “us,” and “our” mean Ruhana AI. If an
          order form or signed agreement conflicts with these Terms, that document controls for
          the specific conflict.
        </p>
      </section>

      <section id="accounts">
        <span className="legal-section-number">02</span>
        <h2>Accounts and workspaces</h2>
        <p>
          You must provide accurate information, keep account access secure, and promptly tell
          us about suspected unauthorized use. Passwordless email codes and connected identity
          providers are personal to the intended user and must not be shared. You are responsible
          for activity performed through your workspace and for managing team-member access.
        </p>
        <p>
          We may rely on instructions from workspace owners and administrators. If you lose
          access to your authentication email or identity provider, recovery may require
          reasonable verification of ownership.
        </p>
      </section>

      <section id="service">
        <span className="legal-section-number">03</span>
        <h2>The Services</h2>
        <p>
          Ruhana lets customers configure and deploy video or chat agents, connect business
          knowledge, observe limited website context, conduct conversations, and review outcomes
          and analytics. Features, limits, supported integrations, and availability may vary by
          plan and may evolve over time.
        </p>
        <p>
          We may provide previews, trials, beta functionality, or illustrative data. Preview and
          beta features may be incomplete, change without notice, and should not be used where a
          failure could cause material harm. Illustrative dashboard data is not a promise of
          future performance.
        </p>
      </section>

      <section id="content">
        <span className="legal-section-number">04</span>
        <h2>Content and likeness rights</h2>
        <p>
          “Customer Content” includes photographs, likenesses, voice materials, instructions,
          websites, documents, knowledge sources, messages, branding, and other material you
          submit or connect to the Services. You keep ownership of Customer Content.
        </p>
        <p>
          You grant Ruhana and its service providers a limited, worldwide license to host, copy,
          process, adapt, transmit, display, and create technical derivatives of Customer Content
          only as reasonably necessary to provide, secure, support, and improve the Services and
          comply with law. This license ends when the content is deleted, subject to reasonable
          backup, legal, and security retention.
        </p>
        <p>You represent and warrant that:</p>
        <ul>
          <li>you own Customer Content or have every permission needed to use it with Ruhana;</li>
          <li>each person whose face, voice, name, or likeness is used has given valid, informed authorization for the intended avatar use;</li>
          <li>Customer Content and its use do not violate privacy, publicity, intellectual-property, employment, contractual, or other rights; and</li>
          <li>you will not upload a person’s likeness to impersonate, deceive, defraud, harass, or mislead others.</li>
        </ul>
        <p>
          We may request evidence of authorization and may remove or disable an avatar where
          consent, ownership, safety, or identity is reasonably disputed.
        </p>
      </section>

      <section id="responsible-agents">
        <span className="legal-section-number">05</span>
        <h2>Responsible agent use</h2>
        <p>
          You control where your agent is installed, the knowledge and instructions it receives,
          the actions it may propose or take, and how your organization uses conversation data.
          You are responsible for your deployment and must:
        </p>
        <ul>
          <li>clearly disclose that visitors are interacting with an AI agent whenever required by law or needed to avoid deception;</li>
          <li>provide an appropriate privacy notice and obtain legally required consent for microphone access, recording, tracking, marketing, or lead collection;</li>
          <li>configure human review and escalation for material decisions or sensitive situations;</li>
          <li>keep business information, prices, policies, and connected knowledge accurate; and</li>
          <li>test the agent and its actions before deploying it to real visitors.</li>
        </ul>
        <p>
          Ruhana’s interface is not a substitute for your own legal, accessibility, consumer,
          employment, or industry-compliance review.
        </p>
      </section>

      <section id="acceptable-use">
        <span className="legal-section-number">06</span>
        <h2>Acceptable use</h2>
        <p>You may not use the Services to:</p>
        <ul>
          <li>break the law, violate another person’s rights, or facilitate fraud, abuse, harassment, exploitation, or violence;</li>
          <li>create deceptive deepfakes, impersonate a real person without permission, or hide an agent’s artificial nature where disclosure is required;</li>
          <li>collect passwords, authentication secrets, full payment-card data, government identifiers, or highly sensitive information without a lawful and necessary purpose;</li>
          <li>make decisions in healthcare, employment, housing, credit, education, insurance, legal services, or another high-impact area without qualified human oversight and required safeguards;</li>
          <li>send spam, unlawful marketing, malware, or content designed to manipulate or mislead;</li>
          <li>probe, attack, disrupt, overload, bypass limits, reverse engineer, or gain unauthorized access to the Services or another customer’s data;</li>
          <li>resell or provide the Services as a competing platform except under an agreement that permits it; or</li>
          <li>use output or access to infringe intellectual-property rights or develop systems in violation of applicable third-party terms.</li>
        </ul>
        <p>
          We may investigate suspected misuse and cooperate with lawful requests. Enforcement may
          include limiting an agent, removing content, suspending access, or terminating an account.
        </p>
      </section>

      <section id="ai">
        <span className="legal-section-number">07</span>
        <h2>AI outputs and actions</h2>
        <p>
          AI-generated speech, text, analysis, classifications, recommendations, and suggested
          actions (“Outputs”) are probabilistic. They may be incomplete, inaccurate, outdated,
          offensive, or unsuitable for a particular purpose. Similar inputs may produce similar
          outputs for different users.
        </p>
        <p>
          You must review Outputs appropriate to the risk before relying on or publishing them.
          Do not treat Outputs as legal, medical, financial, employment, safety, or other
          professional advice. You remain responsible for offers, representations, purchases,
          bookings, lead decisions, handoffs, and other actions taken through your agent.
        </p>
      </section>

      <section id="fees">
        <span className="legal-section-number">08</span>
        <h2>Plans and payment</h2>
        <p>
          Paid features, usage allowances, overages, billing periods, taxes, and renewal terms
          will be shown at purchase or in an applicable order. You authorize us and our payment
          provider to charge amounts when due. Except where law or the applicable order requires
          otherwise, fees already paid are non-refundable.
        </p>
        <p>
          We may change pricing prospectively by providing reasonable notice. Continued use after
          a renewal or price change constitutes acceptance of the disclosed charge. We may limit
          or suspend paid functionality for overdue amounts.
        </p>
      </section>

      <section id="ownership">
        <span className="legal-section-number">09</span>
        <h2>Ownership</h2>
        <p>
          Ruhana and its licensors own the Services, including our software, interface, product
          design, documentation, models and workflows we develop, and Ruhana branding. Subject to
          these Terms and applicable plan limits, we grant you a limited, non-exclusive,
          non-transferable, revocable right to use the Services during your subscription.
        </p>
        <p>
          If you provide feedback, you allow us to use it without restriction or compensation,
          provided we do not identify you publicly as its source without permission. No rights are
          granted except those expressly stated in these Terms.
        </p>
      </section>

      <section id="third-parties">
        <span className="legal-section-number">10</span>
        <h2>Third-party services</h2>
        <p>
          The Services depend on or may connect to third-party products, including identity,
          hosting, AI, avatar, website-ingestion, communications, and payment providers. Your use
          of a connected service may also be governed by that provider’s terms and privacy policy.
          We are not responsible for a third party’s independent services, content, or changes.
        </p>
        <p>
          You authorize Ruhana to exchange information with a provider when you enable the
          relevant feature. Disabling an integration may limit functionality but does not
          necessarily delete information already processed under the provider’s terms.
        </p>
      </section>

      <section id="termination">
        <span className="legal-section-number">11</span>
        <h2>Suspension and termination</h2>
        <p>
          You may stop using the Services at any time and may request workspace deletion through
          available account controls or support. Charges already incurred remain due.
        </p>
        <p>
          We may suspend or terminate access where reasonably necessary to address a material
          breach, unlawful or harmful use, security risk, non-payment, third-party restriction, or
          risk to the Services or other users. Where practical, we will provide notice and an
          opportunity to cure. Provisions that by their nature should survive termination—including
          ownership, payment obligations, disclaimers, and liability limits—will survive.
        </p>
      </section>

      <section id="disclaimers">
        <span className="legal-section-number">12</span>
        <h2>Disclaimers and liability</h2>
        <p className="legal-uppercase">
          To the maximum extent permitted by law, the Services and Outputs are provided “as is”
          and “as available.” Ruhana disclaims implied warranties of merchantability, fitness for
          a particular purpose, title, non-infringement, and uninterrupted or error-free operation.
        </p>
        <p>
          To the maximum extent permitted by law, Ruhana will not be liable for indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for lost profits,
          revenue, goodwill, data, or business opportunity, arising from the Services. Ruhana’s
          aggregate liability for claims relating to the Services will not exceed the amount you
          paid Ruhana for the Services during the three months before the event giving rise to the
          claim, or US$100 if you used only free Services.
        </p>
        <p>
          Some jurisdictions do not allow certain exclusions or limits. In those places, these
          provisions apply only to the extent permitted, and mandatory consumer rights remain
          unaffected. Nothing excludes liability that cannot lawfully be excluded.
        </p>
        <h3>Your responsibility for claims</h3>
        <p>
          To the extent permitted by law, you will defend and indemnify Ruhana from third-party
          claims, losses, and reasonable costs arising from your Customer Content, your deployed
          agents, your violation of these Terms, or your infringement of another person’s rights.
          We will give reasonable notice and cooperation, and you may not settle a claim in a way
          that admits fault by or imposes obligations on Ruhana without our consent.
        </p>
      </section>

      <section id="changes">
        <span className="legal-section-number">13</span>
        <h2>Changes</h2>
        <p>
          We may update the Services and these Terms. We will post updated Terms with a new
          effective date and provide additional notice of material changes where required. If you
          do not agree to revised Terms, stop using the Services before they take effect. Continued
          use after the effective date means you accept them.
        </p>
        <p>
          If any provision is unenforceable, it will be limited to the minimum extent necessary
          and the remaining provisions will continue. A failure to enforce a provision is not a
          waiver. You may not assign these Terms without our consent; Ruhana may assign them as
          part of a reorganization, financing, merger, acquisition, or transfer of the Services.
        </p>
      </section>

      <section id="contact">
        <span className="legal-section-number">14</span>
        <h2>Contact</h2>
        <p>
          Questions about these Terms can be sent to
          {" "}<a href="mailto:support@ruhanaai.com">support@ruhanaai.com</a>.
          Our handling of personal information is described in the
          {" "}<Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalDocument>
  );
}
