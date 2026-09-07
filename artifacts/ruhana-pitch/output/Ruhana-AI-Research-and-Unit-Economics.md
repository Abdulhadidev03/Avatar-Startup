# Ruhana AI — Research and Unit Economics

Prepared 7 September 2026. This companion note records the evidence, calculations, and management assumptions behind the Ruhana AI pitch deck and public pricing page. It is not a claim of current revenue, customer count, or contractual infrastructure cost.

## Product thesis

Ruhana is a context-aware video agent for customer success, sales, and support. It combines a face and voice with live website context, actions, deployment, transcripts, and outcome analytics. The strategic distinction is the customer journey around the avatar: Ruhana observes intent, converses naturally, takes an approved action, and measures the business result.

## Evidence used in the deck

| Claim | Evidence and interpretation | Source |
| --- | --- | --- |
| $3.8 trillion in global sales was at risk from poor customer experiences in 2025 | Used to establish the size of the customer-experience problem, not as revenue available to Ruhana. | [Qualtrics XM Institute](https://www.qualtrics.com/articles/customer-experience/trillion-sales-at-risk-2025/) |
| 55% of consumers would leave a brand after poor service even when the product is good | Supports the cost of service failure. | [Capgemini Research Institute, *Unleashing the value of customer service*](https://www.capgemini.com/wp-content/uploads/2025/03/Final-Web-Version-Report-Customer-Service-Transformation.pdf) |
| 71% prefer human agents when empathy matters | Supports the need for a more human interface while retaining escalation. It does not imply that AI replaces human agents. | [Capgemini Research Institute](https://www.capgemini.com/wp-content/uploads/2025/03/Final-Web-Version-Report-Customer-Service-Transformation.pdf) |
| 87% say companies using GenAI in customer service must provide access to a human agent | Supports Ruhana's hand-off and human-access principle. | [Gartner, 4 August 2026](https://www.gartner.com/en/newsroom/press-releases/2026-08-04-gartner-survey-finds-87-percent-of-customers-say-companies-using-genai-for-customer-service-must-provide-access-to-a-human-agent0) |
| Embodied conversational agents can produce more informative, detailed responses and higher time-efficient engagement than text chatbots | A 2026 randomized study supports the direction of the product thesis. The study did **not** find a significant satisfaction difference, so the deck deliberately avoids inventing a universal conversion or customer-success uplift percentage. | [Krajcovic, Demcak & Kuric, *Behavior Research Methods* (2026)](https://doi.org/10.3758/s13428-026-03091-0) |
| Semantics are a core source of inaccurate AI-agent behavior and wasted spending | Supports grounding the agent in website, product, policy, and journey context rather than relying on a generic prompt alone. | [Gartner, 11 May 2026](https://www.gartner.com/en/newsroom/press-releases/2026-05-11-gartner-says-lack-of-semantics-causes-inaccurate-artificial-intelligence-agents-and-wasted-spending) |

## Market sizing

The market slide uses a top-down category view and labels internal calculations as such.

| Layer | Value | Method |
| --- | ---: | --- |
| TAM | $41.4B | Published 2030 conversational-AI market forecast of $41.39B, rounded. [Grand View Research release](https://www.prnewswire.com/news-releases/conversational-ai-market-to-be-worth-41-39-billion-by-2030-at-cagr-23-7---grand-view-research-inc-302452404.html) |
| SAM | $1.04B | Avatar-based online customer service revenue of $267.9M in 2025 compounded for five years at the published 31.2% CAGR: $267.9M × 1.312^5 = $1.041B. [Grand View Research category data](https://www.grandviewresearch.com/horizon/statistics/ai-avatar-market/application/avatar-based-online-customer-service/global) |
| SOM objective | $10.4M | Internal five-year objective equal to 1% of the calculated 2030 SAM. This is neither current revenue nor a third-party forecast. |

The cited avatar-market source also identifies retail/e-commerce, real estate, hospitality, education, healthcare, BFSI, and IT/telecommunications as relevant verticals. Ruhana's initial wedge should remain website-based sales and customer success, where context and outcomes can be measured directly.

## Pricing recommendation

No free plan is included. Every paid tier contains the builder, website deployment, transcripts, and outcome analytics; higher tiers increase capacity, control, attribution, and support.

| Plan | Monthly price | Included connected minutes | Agents / websites | Overage | Analytics position |
| --- | ---: | ---: | --- | ---: | --- |
| Launch | $39 | 100 | 1 / 1 | $0.32/min | Lead, booking, resolution, and conversation outcomes |
| Growth | $129 | 400 | 3 / 3 | $0.29/min | Journey funnels, intent signals, and agent comparison |
| Scale | $349 | 1,200 | 10 / 10 | $0.27/min | Revenue attribution, conversion exports, and workspace reporting |
| Enterprise | From $999 | 3,500+ | Custom | From $0.26/min | Custom KPI model, governance, exports, and success reporting |

Competitive context was checked against [Anam's published pricing](https://anam.ai/pricing): $12/50 minutes, $49/250, $299/2,000, and $999/5,000, with published overage rates from $0.16 to $0.11 per minute. Ruhana is intentionally positioned as a complete context/action/analytics product rather than raw avatar capacity. Competitor pricing can change and should be rechecked before external circulation.

## Production cost model

The planning model uses a conservative pooled production COGS of **$0.13 per connected minute**:

| Cost component | Planning allowance per connected minute | Basis |
| --- | ---: | --- |
| Video-avatar delivery | $0.110 | Working vendor/capacity benchmark; replace with signed volume terms before approving pricing. |
| GPT-5.6 Terra | $0.006 | Assumes about 1,800 input tokens and 180 output tokens per connected minute. At $2.00/M input and $12.00/M output, cost is $0.0036 + $0.00216 = $0.00576, rounded to $0.006. [Official OpenAI model pricing](https://developers.openai.com/api/docs/models/gpt-5.6-terra) |
| Realtime infrastructure and headroom | $0.014 | Internal allowance for orchestration, storage, monitoring, and utilization variance. |
| **Total modeled COGS** | **$0.130** | Conservative planning benchmark. |

This model excludes payment-processing fees, taxes, exceptional support, implementation work, and unused reserved capacity. Early-stage realized margins may be lower until concurrency and capacity are pooled efficiently.

## Gross-margin checks

Gross margin is calculated as `(revenue − modeled COGS) / revenue`.

| Plan | Revenue at full included use | Modeled COGS | Gross profit | Gross margin |
| --- | ---: | ---: | ---: | ---: |
| Launch | $39 | $13 | $26 | 66.7% |
| Growth | $129 | $52 | $77 | 59.7% |
| Scale | $349 | $156 | $193 | 55.3% |
| Enterprise floor | $999 | $455 | $544 | 54.5% |

| Overage price | COGS | Contribution per minute | Gross margin |
| ---: | ---: | ---: | ---: |
| $0.32 | $0.13 | $0.19 | 59.4% |
| $0.29 | $0.13 | $0.16 | 55.2% |
| $0.27 | $0.13 | $0.14 | 51.9% |
| $0.26 | $0.13 | $0.13 | 50.0% |

The Enterprise price is a floor, not a promise for on-premise or unusually high-service deployments. Those should be quoted from required capacity, implementation, SLA, data residency, and support scope.

## Illustrative management base case

The refined financial slide uses a single one-year planning view. It is a management scenario for fundraising discussion, not current operating performance.

| Metric | Q1 | Q2 | Q3 | Q4 | Year 1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| New customers | 12 | 23 | 40 | 55 | 130 |
| Total active | 12 | 35 | 75 | 130 | 130 |
| Subscription revenue | $2.0k | $7.0k | $18.0k | $36.0k | $63.0k |
| Setup and services | $1.0k | $2.0k | $3.0k | $4.0k | $10.0k |
| Total revenue | $3.0k | $9.0k | $21.0k | $40.0k | $73.0k |
| Variable cost | $1.5k | $4.0k | $9.4k | $18.0k | $32.9k |
| Operating spend | $18.0k | $24.0k | $32.0k | $45.0k | $119.0k |
| Operating result | ($16.5k) | ($19.0k) | ($20.4k) | ($23.0k) | ($78.9k) |
| Gross margin | 50% | 56% | 55% | 55% | 55% |

The table is intentionally compact and editable in PowerPoint. The year-one figures use the same paid-only pricing and $0.13-per-minute planning cost described above. They should be replaced with actual cohort, usage, and operating data as the first deployments mature.

## Visual and claim guardrails

- The 14-slide information architecture, text density, and object placement follow the supplied Cervana reference, while all wording, figures, artwork, and branding are Ruhana-specific.
- Faces appear only on the cover and Solution slides. The remaining deck uses editable diagrams, editorial type, and restrained faceless artwork.
- The visuals are original Ruhana assets or Ruhana product captures; competitor media is not reused.
- Every slide carries the Ruhana R mark at bottom-right.
- The visual system is white, black, and gray. Muted blue and orange appear only as small navigational cues.
- The deck does not claim that video agents produce a universal percentage improvement over chatbots because the cited evidence does not support one defensible cross-industry number.
- Private-cloud and on-premise support is presented as an enterprise pathway, not as a currently certified deployment claim.
- Contributor labels describe present areas of work. Confirm legal officer titles before distributing the deck externally.
