# Ruhana AI

> The AI Video Agent for Customer Service

Ruhana helps businesses create and deploy realistic video agents that can speak with customers, understand what they are doing on a website, guide them toward the right action, and measure what happened next.

Our goal is simple. When someone needs help, they should not have to search through pages, repeat their problem to a chatbot, or wait for a human agent. Ruhana brings a natural face to face conversation directly into the customer journey.

[Open the live product](https://www.ruhanaai.com/)

[Watch the product demonstration](https://www.loom.com/share/b3e84d20a4da4d51a345311d8dbb2342)

[Watch the analytics demonstration](https://www.loom.com/share/59d0cdb32a0147acb71d2e7eb9fcfffc)

## The Problem

Most automated customer support still feels like a search box or a phone menu. It waits for customers to explain everything and often misses the page, product, intent, and actions that led to the question.

Customers still want the clarity and confidence of speaking to a person, especially when they are confused, comparing products, making a purchase, or asking for support.

## The Product

Ruhana is a platform for creating context aware AI video agents in a few guided steps. A business can choose an avatar, add its website and knowledge, select a voice, define the agent behavior, and deploy it using a small website widget.

The agent can understand what a visitor is viewing, speak naturally, answer using approved business knowledge, recommend the next step, collect a lead, book a meeting, start checkout, or hand the conversation to a team member.

Ruhana then connects those conversations to outcomes so the business can see whether the agent created engagement, qualified a visitor, supported a purchase, or resolved a request.

## What Makes Ruhana Different

### It understands the visit

Ruhana can use the current page, product, visitor journey, clicks, and conversation history as live context.

### It feels present

Customers interact with an expressive video agent through natural voice or text instead of another empty chat box.

### It moves the customer forward

The agent is designed around useful outcomes such as answering questions, recommending products, capturing leads, booking meetings, and beginning approved actions.

### It proves its value

The analytics experience connects agent conversations with website behavior, customer intent, generated outcomes, usage, and business impact.

## What We Built

For this project we built the complete product experience for creating, deploying, operating, and measuring AI video agents.

1. A guided agent creation flow designed for nontechnical users.

2. A library of ready to use avatars with support for custom avatars.

3. Website scanning and business knowledge ingestion.

4. Voice selection, behavior settings, goals, and agent preview.

5. A deployable website widget with voice and text conversation.

6. Live awareness of the page, product, clicks, and visitor intent.

7. Conversation history, transcripts, and session details.

8. Analytics for engagement, qualification, outcomes, usage, and business impact.

9. Google and passwordless email authentication.

10. Website management, integrations, and copyable deployment code.

## How It Works

### Context

Ruhana receives the page, product, and visitor signals available during the session.

### Speech

The speech layer manages real time listening and natural voice responses.

### Intelligence

GPT 5.6 Terra reasons over page context, business knowledge, conversation history, goals, and approved rules.

### Presence

The video layer turns each response into an expressive, voice synced avatar conversation.

### Outcomes

Ruhana records what happened after the conversation, including engagement, qualification, approved actions, conversions, and attributed impact.

## Judge Ruhana in Sixty Seconds

1. Visit [www.ruhanaai.com](https://www.ruhanaai.com/).

2. Scroll through the landing page and watch the live agent become the website widget.

3. Open the product and sign in using Google or email.

4. Explore the agents, websites, conversations, integrations, and analytics sections.

5. Open the agent creation experience to see how a business can move from a website to a deployable agent in a few guided steps.

6. Use the two demonstration videos above for a complete guided walkthrough.

## The Bigger Vision

Websites are the starting point. The same Ruhana agent can eventually appear anywhere customers need human guidance.

A Ruhana agent could serve as a digital bank teller, a hotel greeter, a healthcare navigation assistant, a multilingual receptionist, or a self service kiosk agent.

Our larger vision is to give every business a human like digital workforce that can be present across websites, counters, kiosks, and screens.

## Technology

Ruhana is built with Next.js, React, TypeScript, Supabase, and the OpenAI API.

The product connects live website context, business knowledge, speech, video presence, approved actions, and analytics through one continuous customer session.

## Run Locally

### Requirements

Node.js 20 or newer

A Supabase project

An OpenAI API key

Credentials for the website ingestion and video session layers

### Setup

1. Clone this repository and open its project directory.

2. Install the dependencies.

```bash
npm install
```

3. Create a `.env.local` file and add your own project credentials.

```text
ANAM_API_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_REASONING_EFFORT=
FIRECRAWL_API_KEY=
Google_Client_ID=
Google_Client_Secret=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Start the development server.

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

Never commit real credentials to the repository.

## Product Principles

Ruhana is designed around simple setup, clear customer consent, approved business actions, and measurable outcomes. Businesses remain in control of their knowledge, agent behavior, goals, and deployment.

[Privacy Policy](https://www.ruhanaai.com/privacy)

[Terms of Service](https://www.ruhanaai.com/terms)

## Status

Ruhana is an active product prototype demonstrating how context aware AI video agents can improve customer service, sales, and support.

## Contact

[www.ruhanaai.com](https://www.ruhanaai.com/)
