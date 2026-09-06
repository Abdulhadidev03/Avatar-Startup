import { LegalDocument, type LegalSectionLink } from "@/components/legal-document";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ruhana AI collects, uses, and protects personal information.",
  alternates: { canonical: "/privacy" },
};

const sections: LegalSectionLink[] = [
  { href: "#scope", label: "Scope and roles" },
  { href: "#information", label: "Information we handle" },
  { href: "#use", label: "How we use information" },
  { href: "#ai", label: "AI and service providers" },
  { href: "#sharing", label: "How information is shared" },
  { href: "#retention", label: "Retention and security" },
  { href: "#rights", label: "Your choices and rights" },
  { href: "#international", label: "International use" },
  { href: "#children", label: "Children" },
  { href: "#changes", label: "Changes and contact" },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      current="privacy"
      eyebrow="Legal · Privacy"
      title="Privacy Policy"
      updated="September 7, 2026"
      sections={sections}
      summary={
        <>
          <p>
            This Privacy Policy explains how Ruhana AI (“Ruhana,” “we,” “us,” or “our”)
            handles personal information when people visit our website, create a workspace,
            build an avatar agent, or interact with a Ruhana-powered agent.
          </p>
          <p>
            Our goal is simple: collect what is needed to provide useful conversations,
            protect it, and make the roles of Ruhana and the businesses using Ruhana clear.
          </p>
        </>
      }
    >
      <section id="scope">
        <span className="legal-section-number">01</span>
        <h2>Scope and roles</h2>
        <p>
          This Policy applies to ruhanaai.com, the Ruhana dashboard, our APIs, and the
          video or chat widgets businesses install on their websites (together, the
          “Services”). It does not govern a customer’s website or any unrelated third-party
          service linked from the Services.
        </p>
        <h3>Workspace customers</h3>
        <p>
          When you create and operate a Ruhana workspace, Ruhana determines how account,
          billing, product-usage, and support information is handled. For that information,
          Ruhana acts as the business responsible for the processing.
        </p>
        <h3>Visitors speaking with a customer’s agent</h3>
        <p>
          A business that deploys a Ruhana agent decides where the agent appears, what it
          knows, what it asks, and which actions it may take. That business is generally
          responsible for its visitor relationship and privacy notices; Ruhana processes
          conversation and website-context data on its behalf. Visitors should also review
          the privacy policy of the website where the agent appears.
        </p>
      </section>

      <section id="information">
        <span className="legal-section-number">02</span>
        <h2>Information we handle</h2>
        <h3>Information you provide</h3>
        <ul>
          <li><strong>Account information</strong>, including your name, email address, profile details, organization, and authentication information received from Google or email sign-in.</li>
          <li><strong>Workspace content</strong>, including agent names, instructions, greetings, knowledge sources, website URLs, integration settings, and support communications.</li>
          <li><strong>Avatar and voice materials</strong>, including photographs, likenesses, or other files you choose to upload when creating a custom avatar.</li>
          <li><strong>Conversation information</strong>, including chat messages, speech transcripts, contact details voluntarily shared in a conversation, agent responses, outcomes, and feedback.</li>
          <li><strong>Payment and transaction information</strong> when paid plans are available. Payment-card details are handled by the applicable payment provider rather than stored directly by Ruhana.</li>
        </ul>
        <h3>Information collected through a deployed agent</h3>
        <p>
          To make an agent aware of what a visitor is viewing, the widget may collect limited
          session context such as the current page path and title, time on page, visible
          section headings, scroll milestones, and interactions with links or buttons. The
          widget does not read passwords, payment-card fields, or the contents of arbitrary
          form fields. Context is sent to Ruhana when the visitor opens or uses the agent so
          the response can be relevant to that visit.
        </p>
        <p>
          Microphone access remains off until a visitor chooses the voice control. During a
          voice conversation, audio is transmitted in real time to provide speech recognition,
          avatar speech, and lip sync. Ruhana stores the resulting conversation transcript and
          session outcome; we do not claim to store raw microphone audio unless the interface
          clearly says recording is enabled.
        </p>
        <h3>Technical information</h3>
        <p>
          We and our service providers may receive IP address, browser and device type,
          operating system, timestamps, referring pages, diagnostics, security events, and
          cookie or local-storage identifiers needed to keep sessions secure and understand
          how the Services perform.
        </p>
      </section>

      <section id="use">
        <span className="legal-section-number">03</span>
        <h2>How we use information</h2>
        <p>We use information described above to:</p>
        <ul>
          <li>create accounts, authenticate users, and operate workspaces;</li>
          <li>generate, configure, deliver, and improve avatar-agent conversations;</li>
          <li>use page context and conversation history to provide relevant answers and next actions;</li>
          <li>produce transcripts, analytics, lead information, and outcome reporting for the deploying customer;</li>
          <li>process requested website knowledge and connected integrations;</li>
          <li>provide support and send security, service, or transactional messages;</li>
          <li>detect abuse, protect the Services, debug failures, and enforce our Terms; and</li>
          <li>comply with law and protect the rights and safety of Ruhana, our customers, and others.</li>
        </ul>
        <p>
          Where applicable law requires a legal basis, we rely on performance of a contract,
          legitimate interests in operating and securing the Services, compliance with legal
          obligations, and consent where required—for example, before microphone access.
        </p>
        <div className="legal-callout">
          <strong>No sale of personal information</strong>
          <p>Ruhana does not sell personal information for money or use customer conversations for third-party behavioural advertising.</p>
        </div>
      </section>

      <section id="ai">
        <span className="legal-section-number">04</span>
        <h2>AI and service providers</h2>
        <p>
          Ruhana uses specialist providers to deliver the Services. Depending on the feature
          used, information may be processed by providers supporting:
        </p>
        <ul>
          <li><strong>AI responses and analysis</strong>, currently including OpenAI;</li>
          <li><strong>real-time avatar video, voice, and transcription</strong>, currently including Anam;</li>
          <li><strong>authentication, databases, and file storage</strong>, currently including Supabase;</li>
          <li><strong>application hosting and delivery</strong>, currently including Vercel;</li>
          <li><strong>Google sign-in</strong>, when a user chooses that authentication method; and</li>
          <li><strong>website knowledge ingestion</strong>, currently including Firecrawl, when a customer requests a website scan.</li>
        </ul>
        <p>
          These providers process information under their own contractual and security terms.
          We send them only the information reasonably needed for the selected feature. Provider
          availability and our vendor list may change as the Services develop.
        </p>
      </section>

      <section id="sharing">
        <span className="legal-section-number">05</span>
        <h2>How information is shared</h2>
        <p>We may disclose information:</p>
        <ul>
          <li>to the customer that deployed the agent, including transcripts, contact details a visitor chooses to provide, session context, analytics, and outcomes;</li>
          <li>to service providers operating under instructions to host, secure, analyze, communicate, or otherwise support the Services;</li>
          <li>to professional advisers where necessary for legal, accounting, insurance, or security purposes;</li>
          <li>when reasonably required to comply with law, legal process, or a valid government request, or to protect rights and safety; and</li>
          <li>as part of a merger, financing, acquisition, restructuring, or transfer of all or part of our business, subject to appropriate safeguards.</li>
        </ul>
        <p>
          Workspace administrators may be able to access content and activity associated with
          users in their organization. Customers are responsible for giving access only to
          authorized team members.
        </p>
      </section>

      <section id="retention">
        <span className="legal-section-number">06</span>
        <h2>Retention and security</h2>
        <p>
          We keep information for as long as reasonably necessary to provide the Services,
          maintain a customer’s workspace, meet legal or accounting obligations, resolve
          disputes, and protect against fraud or abuse. Retention can vary by information type,
          workspace settings, contractual instructions, and applicable law. Deleted information
          may remain temporarily in protected backups before routine deletion.
        </p>
        <p>
          We use technical and organizational measures designed to protect information,
          including encrypted network transport, access controls, authentication safeguards,
          and restricted administrative access. No online service can guarantee absolute
          security. Customers must protect account access, integration credentials, and widget
          configuration.
        </p>
      </section>

      <section id="rights">
        <span className="legal-section-number">07</span>
        <h2>Your choices and rights</h2>
        <p>
          Depending on where you live, you may have the right to request access, correction,
          deletion, restriction, objection, portability, or withdrawal of consent regarding
          personal information. You may also have the right to complain to a local data
          protection authority.
        </p>
        <p>
          Workspace users can update certain information from the dashboard. For other requests,
          email <a href="mailto:support@ruhanaai.com">support@ruhanaai.com</a>. We may need to
          verify your identity before completing a request. If your request concerns an agent on
          another business’s website, contact that business first; we will assist it as required.
        </p>
        <p>
          You can decline microphone permission, continue by text where available, block or
          delete browser storage through browser settings, and stop a conversation at any time.
          Blocking essential authentication storage may prevent parts of the Services from working.
        </p>
      </section>

      <section id="international">
        <span className="legal-section-number">08</span>
        <h2>International use</h2>
        <p>
          Ruhana and its providers may process information in countries other than the country
          where it was collected. Where required, we use recognized safeguards for international
          transfers and require service providers to protect information consistently with
          applicable law.
        </p>
      </section>

      <section id="children">
        <span className="legal-section-number">09</span>
        <h2>Children</h2>
        <p>
          The Services are intended for business use and are not directed to children under 13,
          or a higher minimum age where local law requires it. Do not upload a child’s likeness
          or intentionally collect children’s information through an agent without all legally
          required authority and consent. Contact us if you believe a child provided information
          improperly.
        </p>
      </section>

      <section id="changes">
        <span className="legal-section-number">10</span>
        <h2>Changes and contact</h2>
        <p>
          We may update this Policy as the Services or legal requirements change. We will post
          the revised version here, update the effective date, and provide additional notice when
          a material change requires it.
        </p>
        <p>
          Questions or privacy requests can be sent to
          {" "}<a href="mailto:support@ruhanaai.com">support@ruhanaai.com</a>.
          You can also review our <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>
    </LegalDocument>
  );
}
