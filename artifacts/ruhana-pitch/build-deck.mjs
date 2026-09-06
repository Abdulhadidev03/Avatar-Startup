import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "D:/Claude/Ruhana AI/agaentic_bot";
const deckDir = path.join(workspaceDir, "artifacts", "ruhana-pitch");
const assetDir = path.join(deckDir, "assets");
const buildDir = path.join(deckDir, ".build");
const outputDir = path.join(deckDir, "output");
const SKILL_DIR = "D:/CodexData/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
const RUNTIME_PYTHON = "C:/Users/abdul/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
process.env.RUNTIME_NODE_MODULES ??= "C:/Users/abdul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const revision = process.env.DECK_REV ?? "final";
const FINAL_PPTX = path.join(outputDir, `Ruhana-AI-Pitch-Deck${revision === "final" ? "" : `-v${revision}`}.pptx`);

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const { finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools", "artifact_tool_utils.mjs")).href,
);

const W = 1440;
const H = 810;
const C = {
  bg: "#F7F5F0",
  paper: "#FCFBF8",
  ink: "#171A18",
  muted: "#666D68",
  faint: "#9AA09B",
  line: "#D9D8D2",
  teal: "#527A73",
  tealSoft: "#DCE7E2",
  sage: "#B8C6B1",
  sageSoft: "#E7ECE4",
  clay: "#C77E5D",
  claySoft: "#F1E1D8",
  lavender: "#A99DB2",
  lavenderSoft: "#E8E2EA",
  sky: "#9EB4BC",
  skySoft: "#E1E9EB",
  dark: "#101412",
  white: "#FFFFFF",
  green: "#376B5F",
  red: "#985B52",
};

const BODY = "Arial";
const DISPLAY = "Arial";
const SERIF = "Georgia";

const presentation = Presentation.create({ slideSize: { width: W, height: H } });
presentation.theme.colorScheme = {
  name: "Ruhana Editorial",
  themeColors: {
    accent1: C.teal,
    accent2: C.clay,
    accent3: C.lavender,
    accent4: C.sky,
    accent5: C.sage,
    accent6: C.green,
    bg1: C.bg,
    bg2: C.paper,
    tx1: C.ink,
    tx2: C.muted,
    dk1: C.dark,
    dk2: C.ink,
    lt1: C.white,
    lt2: C.paper,
    hlink: C.teal,
    folHlink: C.lavender,
  },
};

const imageBytes = {
  cover: await fs.readFile(path.join(assetDir, "cover-concierge.png")),
  problem: await fs.readFile(path.join(assetDir, "problem-maze.png")),
  solution: await fs.readFile(path.join(assetDir, "solution-context.png")),
  analytics: await fs.readFile(path.join(assetDir, "ruhana-analytics.png")),
  mark: await fs.readFile(path.join(assetDir, "ruhana-mark.svg")),
};

function rect(slide, x, y, w, h, fill = C.paper, radius = 16, line = "none", lineWidth = 0) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: lineWidth },
    borderRadius: radius,
  });
}

function ellipse(slide, x, y, w, h, fill = "none", line = C.line, lineWidth = 1.2) {
  return slide.shapes.add({
    geometry: "ellipse",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: lineWidth },
  });
}

function line(slide, x1, y1, x2, y2, color = C.line, width = 1.2, dash = "solid") {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return slide.shapes.add({
    geometry: "line",
    position: {
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      width: Math.abs(dx),
      height: Math.abs(dy),
      horizontalFlip: dx * dy < 0,
    },
    fill: "none",
    line: { style: dash, fill: color, width },
  });
}

function text(slide, value, x, y, w, h, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  box.text = value;
  box.text.style = {
    typeface: opts.font ?? BODY,
    fontSize: opts.size ?? 18,
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    lineSpacing: opts.lineSpacing ?? 1.06,
    autoFit: opts.autoFit ?? "shrinkText",
    wrap: "square",
    insets: opts.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return box;
}

function richText(slide, runs, x, y, w, h, opts = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  box.text.set([runs]);
  box.text.style = {
    typeface: opts.font ?? DISPLAY,
    fontSize: opts.size ?? 48,
    bold: opts.bold ?? true,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    lineSpacing: opts.lineSpacing ?? 0.98,
    autoFit: opts.autoFit ?? "shrinkText",
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return box;
}

function addImage(slide, bytes, alt, x, y, w, h, opts = {}) {
  return slide.images.add({
    blob: bytes,
    contentType: opts.contentType ?? "image/png",
    alt,
    fit: opts.fit ?? "cover",
    crop: opts.crop,
    geometry: opts.geometry ?? "rect",
    borderRadius: opts.radius,
    position: { left: x, top: y, width: w, height: h },
  });
}

function addMark(slide, x, y, size = 34) {
  return addImage(slide, imageBytes.mark, "Ruhana AI mark", x, y, size, size, {
    contentType: "image/svg+xml",
    fit: "contain",
  });
}

function label(slide, value, x, y, w, color = C.teal) {
  return text(slide, value.toUpperCase(), x, y, w, 20, {
    size: 11,
    bold: true,
    color,
    lineSpacing: 1,
  });
}

function slideTitle(slide, number, title, subtitle = "") {
  label(slide, `${String(number).padStart(2, "0")} · ${title}`, 74, 46, 440, C.teal);
  text(slide, title, 74, 75, 900, 58, { size: 42, bold: true, font: DISPLAY, lineSpacing: 0.96 });
  if (subtitle) text(slide, subtitle, 76, 134, 900, 40, { size: 17, color: C.muted, lineSpacing: 1.1 });
}

function footer(slide, number) {
  line(slide, 74, 775, 1366, 775, C.line, 0.9);
  addMark(slide, 74, 783, 18);
  text(slide, "RUHANA AI", 98, 786, 170, 15, { size: 9, bold: true, color: C.muted, lineSpacing: 1 });
  text(slide, `${String(number).padStart(2, "0")} / 14`, 1270, 786, 96, 15, { size: 9, bold: true, color: C.faint, align: "right", lineSpacing: 1 });
}

function newSlide(number, title, subtitle = "", withTitle = true) {
  const slide = presentation.slides.add();
  slide.background.fill = C.bg;
  if (withTitle) slideTitle(slide, number, title, subtitle);
  footer(slide, number);
  return slide;
}

function pill(slide, value, x, y, w, fill = C.tealSoft, color = C.teal) {
  const shape = rect(slide, x, y, w, 28, fill, 14);
  shape.text = value;
  shape.text.style = {
    typeface: BODY,
    fontSize: 11,
    bold: true,
    color,
    alignment: "center",
    verticalAlignment: "middle",
    autoFit: "shrinkText",
    insets: { top: 0, right: 8, bottom: 0, left: 8 },
  };
  return shape;
}

function metricCard(slide, x, y, w, h, value, title, body, accent = C.teal, tint = C.tealSoft) {
  rect(slide, x, y, w, h, C.paper, 18, C.line, 1);
  rect(slide, x + 16, y + 16, 9, h - 32, accent, 5);
  text(slide, value, x + 42, y + 20, w - 58, 42, { size: 30, bold: true, color: C.ink, lineSpacing: 0.92 });
  text(slide, title, x + 42, y + 65, w - 58, 28, { size: 14, bold: true, color: accent });
  text(slide, body, x + 42, y + 96, w - 58, h - 108, { size: 12, color: C.muted, lineSpacing: 1.1 });
  ellipse(slide, x + w - 42, y + 18, 18, 18, tint, "none", 0);
}

function sourceNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
}

// 01 — Cover
{
  const slide = newSlide(1, "", "", false);
  addImage(slide, imageBytes.cover, "Editorial illustration of a digital concierge helping a website visitor", 0, 0, 820, 810, {
    fit: "cover",
  });
  rect(slide, 785, 0, 655, 810, C.bg, 0);
  addMark(slide, 862, 104, 48);
  text(slide, "Ruhana AI", 920, 108, 330, 42, { size: 28, bold: true });
  label(slide, "Product & market deck · September 2026", 862, 188, 420, C.teal);
  richText(slide, [
    { run: "The AI video agent\n", textStyle: { bold: true, fontSize: "48px", typeface: DISPLAY, color: C.ink } },
    { run: "for customer success.", textStyle: { italic: true, bold: false, fontSize: "50px", typeface: SERIF, color: C.ink } },
  ], 862, 234, 470, 154, { size: 48, bold: true, lineSpacing: 0.94 });
  text(slide, "A face, a voice, and the context to move every website visit forward.", 864, 420, 440, 76, {
    size: 20,
    color: C.muted,
    lineSpacing: 1.18,
  });
  line(slide, 864, 548, 1298, 548, C.ink, 1);
  text(slide, "Built for sales, support, and measurable outcomes.", 864, 568, 440, 28, { size: 13, bold: true, color: C.ink });
  text(slide, "ruhanaai.com", 864, 622, 220, 24, { size: 13, color: C.teal, bold: true });
  text(slide, "01 / 14", 1270, 786, 96, 15, { size: 9, bold: true, color: C.faint, align: "right", lineSpacing: 1 });
  sourceNotes(slide, [
    "Ruhana AI positioning deck. Visual is original Ruhana artwork created for this presentation.",
    "No accelerator or acceptance claims are made.",
  ]);
}

// 02 — Problem
{
  const slide = newSlide(2, "Problem", "Customers do not want another barrier between intent and help.");
  metricCard(slide, 74, 190, 280, 150, "$3.8T", "Sales at risk", "Global sales exposed to bad customer experiences in 2025.", C.clay, C.claySoft);
  metricCard(slide, 372, 190, 280, 150, "71%", "The empathy gap", "Consumers prefer human agents over bots when empathy matters.", C.lavender, C.lavenderSoft);
  metricCard(slide, 74, 360, 280, 150, "55%", "Loyalty breaks", "Would leave a brand after poor service—even when the product is good.", C.teal, C.tealSoft);
  metricCard(slide, 372, 360, 280, 150, "87%", "Human access", "Say AI service must preserve a path to a human agent.", C.sky, C.skySoft);
  rect(slide, 74, 538, 578, 178, C.dark, 18);
  text(slide, "THE STRUCTURAL FAILURE", 98, 560, 250, 20, { size: 10, bold: true, color: C.sage });
  text(slide, "Old bots know a script—not the page, the visitor’s intent, or the outcome the business needs.", 98, 594, 510, 68, {
    size: 21,
    bold: true,
    color: C.white,
    lineSpacing: 1.12,
  });
  text(slide, "They report conversations and minutes while revenue, resolution, and customer effort remain invisible.", 98, 676, 510, 30, { size: 12, color: "#C9CECA" });
  addImage(slide, imageBytes.problem, "Non-facial editorial illustration of a visitor lost in a maze of old chatbots", 692, 168, 674, 548, {
    crop: { left: 0.03, top: 0.04, right: 0.04, bottom: 0.04 },
    radius: 18,
  });
  sourceNotes(slide, [
    "Sources:",
    "Qualtrics XM Institute (2024), $3.8 trillion global sales at risk in 2025: https://www.qualtrics.com/articles/customer-experience/trillion-sales-at-risk-2025/",
    "Capgemini Research Institute (2025), Unleashing the value of customer service; 55% brand-leaving intent and 71% human preference for empathy: https://www.capgemini.com/wp-content/uploads/2025/03/Final-Web-Version-Report-Customer-Service-Transformation.pdf",
    "Gartner (2026), 87% say GenAI customer service must provide access to a human agent: https://www.gartner.com/en/newsroom/press-releases/2026-08-04-gartner-survey-finds-87-percent-of-customers-say-companies-using-genai-for-customer-service-must-provide-access-to-a-human-agent0",
    "The final two statements are Ruhana's product thesis, not third-party measured statistics.",
  ]);
}

// 03 — Solution
{
  const slide = newSlide(3, "Solution", "A high-IQ video agent inside the exact moment a visitor is deciding.");
  addImage(slide, imageBytes.solution, "Editorial illustration of website context turning into customer outcomes", 720, 166, 646, 382, {
    crop: { left: 0.13, top: 0.04, right: 0.02, bottom: 0.05 },
    radius: 18,
  });
  richText(slide, [
    { run: "Ruhana does not wait for the visitor to explain the page.\n", textStyle: { bold: true, fontSize: "31px", typeface: DISPLAY, color: C.ink } },
    { run: "It arrives with context.", textStyle: { italic: true, bold: false, fontSize: "34px", typeface: SERIF, color: C.teal } },
  ], 74, 196, 590, 124, { size: 31, lineSpacing: 1.02 });
  text(slide, "The agent sees what the visitor is viewing and doing, holds a natural face-to-face conversation, takes the next best action, and records the business result.", 76, 344, 570, 112, {
    size: 18,
    color: C.muted,
    lineSpacing: 1.2,
  });
  const benefits = [
    ["01", "See", "Page, product, click and journey context", C.teal, C.tealSoft],
    ["02", "Understand", "Question, intent, readiness and risk", C.lavender, C.lavenderSoft],
    ["03", "Act", "Qualify, recommend, book, capture or hand off", C.clay, C.claySoft],
    ["04", "Prove", "Revenue, resolution and outcome analytics", C.sky, C.skySoft],
  ];
  benefits.forEach(([n, t, b, accent, tint], i) => {
    const x = 74 + i * 323;
    rect(slide, x, 585, 302, 132, C.paper, 16, C.line, 1);
    pill(slide, n, x + 18, 602, 44, tint, accent);
    text(slide, t, x + 18, 642, 260, 26, { size: 17, bold: true, color: accent });
    text(slide, b, x + 18, 676, 264, 28, { size: 12, color: C.muted, lineSpacing: 1.12 });
  });
  sourceNotes(slide, [
    "Ruhana product definition based on the current codebase: visitor context, goal-directed conversations, actions, transcripts and outcome analytics.",
    "Visual is original Ruhana artwork created for this presentation.",
  ]);
}

// 04 — Why Now
{
  const slide = newSlide(4, "Why Now", "Four technology curves and one buyer shift are converging.");
  const items = [
    ["01", "Expressive in real time", "Video and voice models now sustain live, interruptible, emotionally legible conversation."],
    ["02", "Intelligence is affordable", "Language models can reason over products, policies and objections within SaaS unit economics."],
    ["03", "The browser is observable", "First-party page, click and journey signals can shape the conversation while it happens."],
    ["04", "Customers expect action", "58% of GenAI users have used it to complete a task; the figure reaches 74% in B2B."],
    ["05", "The category is opening", "Avatar-based online customer service is forecast to grow at 31.2% CAGR through 2033."],
  ];
  items.forEach(([n, t, b], i) => {
    const y = 188 + i * 103;
    text(slide, n, 76, y + 2, 42, 24, { size: 11, bold: true, color: C.teal });
    text(slide, t, 130, y, 350, 26, { size: 18, bold: true });
    text(slide, b, 130, y + 34, 475, 54, { size: 13, color: C.muted, lineSpacing: 1.15 });
    if (i < 4) line(slide, 130, y + 91, 610, y + 91, C.line, 0.9);
  });

  // Non-facial threshold infographic.
  rect(slide, 710, 190, 656, 520, C.paper, 24, C.line, 1);
  label(slide, "THE THRESHOLD", 742, 220, 220, C.clay);
  text(slide, "From interface\nto presence", 742, 250, 260, 92, { size: 31, bold: true, lineSpacing: 0.95 });
  const cx = 1100;
  const cy = 450;
  ellipse(slide, cx - 102, cy - 102, 204, 204, C.dark, C.dark, 0);
  addMark(slide, cx - 27, cy - 45, 54);
  text(slide, "LIVE AGENT", cx - 72, cy + 22, 144, 20, { size: 11, bold: true, color: C.white, align: "center" });
  const orbit = [
    ["FACE", "Expression", 806, 358, C.tealSoft, C.teal],
    ["VOICE", "Natural turn-taking", 1136, 266, C.sageSoft, C.green],
    ["MIND", "Goal reasoning", 1176, 550, C.lavenderSoft, C.lavender],
    ["CONTEXT", "Page + intent", 784, 565, C.claySoft, C.clay],
  ];
  orbit.forEach(([k, b, x, y, fill, color]) => {
    ellipse(slide, x, y, 150, 92, fill, "none", 0);
    text(slide, k, x + 14, y + 18, 122, 18, { size: 10, bold: true, color, align: "center" });
    text(slide, b, x + 14, y + 44, 122, 30, { size: 11, bold: true, color: C.ink, align: "center" });
    line(slide, x + 75, y + 46, cx, cy, color, 1.3, "dashed");
  });
  pill(slide, "NOW", 1038, 656, 124, C.clay, C.white);
  sourceNotes(slide, [
    "Sources:",
    "Gartner (2026): 58% of GenAI users used it to complete a task; 74% in B2B: https://www.gartner.com/en/newsroom/press-releases/2026-08-04-gartner-survey-finds-87-percent-of-customers-say-companies-using-genai-for-customer-service-must-provide-access-to-a-human-agent0",
    "Grand View Research (2026): avatar-based online customer service market CAGR 31.2% from 2026 to 2033: https://www.grandviewresearch.com/horizon/statistics/ai-avatar-market/application/avatar-based-online-customer-service/global",
    "Krajcovic, Demcak & Kuric (2026) found embodied conversational agents produced significantly more informative, detailed responses and higher, more time-efficient engagement than a text chatbot in a randomized study; satisfaction did not significantly change: https://doi.org/10.3758/s13428-026-03091-0",
  ]);
}

// 05 — Market Size
{
  const slide = newSlide(5, "Market Size", "A focused wedge inside a fast-expanding conversational interface market.");
  const centerX = 975;
  const centerY = 456;
  ellipse(slide, centerX - 292, centerY - 292, 584, 584, C.skySoft, "none", 0);
  ellipse(slide, centerX - 216, centerY - 216, 432, 432, C.tealSoft, C.bg, 5);
  ellipse(slide, centerX - 132, centerY - 132, 264, 264, C.claySoft, C.bg, 5);
  text(slide, "TAM · $41.4B", centerX - 132, centerY - 264, 264, 24, { size: 15, bold: true, color: C.sky, align: "center" });
  text(slide, "2030 conversational AI", centerX - 142, centerY - 235, 284, 20, { size: 11, color: C.muted, align: "center" });
  text(slide, "SAM · $1.04B", centerX - 118, centerY - 182, 236, 24, { size: 14, bold: true, color: C.teal, align: "center" });
  text(slide, "2030 avatar-led online CX", centerX - 136, centerY - 154, 272, 20, { size: 11, color: C.muted, align: "center" });
  text(slide, "SOM", centerX - 42, centerY - 62, 84, 18, { size: 10, bold: true, color: C.clay, align: "center" });
  text(slide, "$10.4M", centerX - 88, centerY - 34, 176, 48, { size: 35, bold: true, align: "center" });
  text(slide, "1% of SAM objective", centerX - 100, centerY + 22, 200, 28, { size: 12, color: C.muted, align: "center" });

  richText(slide, [
    { run: "Land in the decision.\n", textStyle: { bold: true, fontSize: "34px", typeface: DISPLAY, color: C.ink } },
    { run: "Expand across the journey.", textStyle: { italic: true, bold: false, fontSize: "35px", typeface: SERIF, color: C.teal } },
  ], 74, 204, 480, 100, { size: 34, lineSpacing: 1.0 });
  text(slide, "Ruhana starts with sales and support conversations on high-intent website pages, then expands into onboarding, retention, service navigation, and enterprise knowledge work.", 76, 330, 475, 118, { size: 17, color: C.muted, lineSpacing: 1.2 });
  const marketNotes = [
    ["31.2%", "Avatar customer service CAGR"],
    ["$267.9M", "Category revenue in 2025"],
    ["$2.37B", "Category forecast for 2033"],
  ];
  marketNotes.forEach(([v, b], i) => {
    const y = 492 + i * 74;
    text(slide, v, 76, y, 122, 32, { size: 23, bold: true, color: i === 0 ? C.clay : C.ink });
    text(slide, b, 212, y + 5, 290, 24, { size: 12, color: C.muted });
    if (i < 2) line(slide, 76, y + 55, 520, y + 55, C.line, 0.9);
  });
  sourceNotes(slide, [
    "Sources and calculations:",
    "Grand View Research (2025): conversational AI market projected to $41.39B in 2030: https://www.prnewswire.com/news-releases/conversational-ai-market-to-be-worth-41-39-billion-by-2030-at-cagr-23-7---grand-view-research-inc-302452404.html",
    "Grand View Research (2026): avatar-based online customer service was $267.9M in 2025 and is forecast to $2,372.8M in 2033 at 31.2% CAGR: https://www.grandviewresearch.com/horizon/statistics/ai-avatar-market/application/avatar-based-online-customer-service/global",
    "SAM is Ruhana's calculation of the category's 2030 value by compounding the published 2025 base at the published CAGR: approximately $1.04B.",
    "SOM is an internal five-year objective equal to 1% of the 2030 SAM, not current revenue or a third-party forecast.",
  ]);
}

// 06 — Target Market
{
  const slide = newSlide(6, "Target Market", "Start where the visitor's intent is visible and the result can be measured.");
  rect(slide, 74, 190, 1292, 510, C.paper, 24, C.line, 1);
  ellipse(slide, 564, 314, 310, 310, C.dark, "none", 0);
  addMark(slide, 683, 390, 72);
  text(slide, "HIGH-INTENT\nWEB JOURNEYS", 624, 478, 190, 48, { size: 15, bold: true, color: C.white, align: "center", lineSpacing: 1.08 });

  const segments = [
    ["01", "Retail & e-commerce", "Discovery · comparison · cart recovery", 124, 246, C.claySoft, C.clay],
    ["02", "B2B SaaS", "Qualification · demos · onboarding", 956, 246, C.tealSoft, C.teal],
    ["03", "Financial & public services", "Guidance · multilingual access · private deployment", 124, 536, C.skySoft, C.sky],
    ["04", "Education & services", "Advisor · intake · scheduling", 956, 536, C.lavenderSoft, C.lavender],
  ];
  segments.forEach(([n, t, b, x, y, fill, accent]) => {
    rect(slide, x, y, 352, 122, fill, 18);
    ellipse(slide, x + 18, y + 20, 44, 44, C.paper, "none", 0);
    text(slide, n, x + 18, y + 33, 44, 18, { size: 11, bold: true, color: accent, align: "center" });
    text(slide, t, x + 78, y + 21, 250, 28, { size: 17, bold: true });
    text(slide, b, x + 78, y + 58, 246, 46, { size: 12, color: C.muted, lineSpacing: 1.12 });
    line(slide, x < 500 ? x + 352 : 874, y + 61, x < 500 ? 564 : x, y + 61, accent, 1.3, "dashed");
  });
  const criteria = ["Visible intent", "Repeat questions", "Clear next action", "Measurable value"];
  criteria.forEach((item, i) => pill(slide, item, 175 + i * 278, 720, 220, i % 2 === 0 ? C.sageSoft : C.skySoft, C.ink));
  sourceNotes(slide, [
    "Target segments are Ruhana's go-to-market thesis, chosen for high-intent web journeys and measurable outcomes.",
    "Grand View Research identifies retail/e-commerce, real estate, hospitality, education, healthcare, BFSI, and IT/telecommunications as verticals in the AI avatar market: https://www.grandviewresearch.com/horizon/statistics/ai-avatar-market/application/avatar-based-online-customer-service/global",
    "Private or on-premise deployment is positioned as an enterprise pathway, not a claim of current general availability.",
  ]);
}

// 07 — Competitive Landscape
{
  const slide = newSlide(7, "Competitive Landscape", "The category is strong at embodiment or orchestration. Ruhana joins both around outcomes.");
  rect(slide, 74, 188, 860, 522, C.paper, 22, C.line, 1);
  line(slide, 160, 650, 854, 650, C.ink, 1.4);
  line(slide, 160, 650, 160, 250, C.ink, 1.4);
  text(slide, "Business orchestration →", 560, 670, 246, 20, { size: 10, bold: true, color: C.muted, align: "right" });
  text(slide, "Embodiment quality →", 90, 240, 220, 20, { size: 11, bold: true, color: C.muted, align: "center" });
  const dots = [
    ["Chatbot\nplatforms", 700, 560, C.sky, 78],
    ["Avatar\nAPIs", 300, 338, C.lavender, 76],
    ["LemonSlice", 430, 332, C.clay, 78],
    ["Anam", 560, 358, C.sage, 70],
    ["Tavus /\nLiveAvatar", 664, 300, C.sky, 86],
    ["RUHANA", 784, 250, C.dark, 104],
  ];
  dots.forEach(([name, x, y, fill, size]) => {
    ellipse(slide, x - size / 2, y - size / 2, size, size, fill, C.bg, name === "RUHANA" ? 5 : 2);
    text(slide, name, x - size / 2 + 6, y - 18, size - 12, 40, { size: name === "RUHANA" ? 11 : 10, bold: true, color: name === "RUHANA" ? C.white : C.ink, align: "center", valign: "middle", lineSpacing: 1.02 });
  });
  pill(slide, "LOW", 112, 662, 52, C.bg, C.faint);
  pill(slide, "HIGH", 826, 662, 58, C.bg, C.faint);

  rect(slide, 970, 188, 396, 522, C.dark, 22);
  label(slide, "RUHANA'S WEDGE", 1000, 220, 240, C.sage);
  text(slide, "A customer-success system with a face—not a face waiting for a system.", 1000, 258, 326, 94, { size: 25, bold: true, color: C.white, lineSpacing: 1.08 });
  const wedge = [
    ["01", "Live page + journey context"],
    ["02", "Goal-directed sales and support actions"],
    ["03", "Revenue, resolution and intent analytics"],
    ["04", "Four-step no-code deployment"],
    ["05", "Private enterprise pathway"],
  ];
  wedge.forEach(([n, t], i) => {
    const y = 388 + i * 56;
    text(slide, n, 1000, y, 34, 20, { size: 10, bold: true, color: C.clay });
    text(slide, t, 1044, y - 1, 280, 34, { size: 13, bold: true, color: C.white, lineSpacing: 1.05 });
  });
  sourceNotes(slide, [
    "Directional positioning based on public product pages reviewed September 2026; this is not an audited feature matrix.",
    "Anam public product and pricing: https://anam.ai/ and https://anam.ai/pricing",
    "LemonSlice public product page: https://lemonslice.com/",
    "Tavus conversational video: https://www.tavus.io/cvi",
    "LiveAvatar public product page: https://www.liveavatar.com/",
    "Ruhana positioning reflects the current product's page-context, actions and analytics architecture.",
  ]);
}

// 08 — Product
{
  const slide = newSlide(8, "Product", "A closed loop from observable intent to measurable customer outcome.");
  const stages = [
    ["01", "Observe", "Page · clicks · scroll · product", C.skySoft, C.sky],
    ["02", "Understand", "Intent · question · readiness", C.tealSoft, C.teal],
    ["03", "Converse", "Video · voice · text · language", C.sageSoft, C.green],
    ["04", "Act", "Qualify · recommend · book · handoff", C.claySoft, C.clay],
    ["05", "Measure", "Revenue · outcome · resolution · journey", C.lavenderSoft, C.lavender],
  ];
  stages.forEach(([n, t, b, fill, accent], i) => {
    const x = 74 + i * 258;
    rect(slide, x, 192, 236, 156, fill, 18);
    pill(slide, n, x + 18, 210, 42, C.paper, accent);
    text(slide, t, x + 18, 254, 200, 30, { size: 19, bold: true, color: accent });
    text(slide, b, x + 18, 294, 198, 42, { size: 11, color: C.muted, lineSpacing: 1.12 });
    if (i < 4) {
      line(slide, x + 236, 270, x + 258, 270, C.ink, 1.2);
      ellipse(slide, x + 244, 266, 8, 8, C.ink, "none", 0);
    }
  });
  rect(slide, 74, 378, 1292, 330, C.dark, 22);
  text(slide, "The product already connects the loop.", 104, 406, 460, 36, { size: 24, bold: true, color: C.white });
  text(slide, "Four-step agent builder · embeddable website widget · live transcripts · action capture · business-impact analytics", 104, 452, 510, 70, { size: 15, color: "#C9CECA", lineSpacing: 1.18 });
  const outcomes = [
    ["Page context", "Current page, visible section, last click"],
    ["Journey memory", "Views, time, scroll depth, interactions"],
    ["Outcome layer", "Lead, booking, purchase, resolution, handoff"],
  ];
  outcomes.forEach(([t, b], i) => {
    const y = 548 + i * 47;
    ellipse(slide, 106, y + 3, 12, 12, i === 2 ? C.clay : C.teal, "none", 0);
    text(slide, t, 134, y, 145, 22, { size: 12, bold: true, color: C.white });
    text(slide, b, 280, y, 300, 22, { size: 11, color: "#AAB2AD" });
  });
  addImage(slide, imageBytes.analytics, "Ruhana business-impact analytics dashboard", 640, 400, 700, 280, {
    crop: { left: 0.115, top: 0.06, right: 0.005, bottom: 0.05 },
    radius: 14,
  });
  text(slide, "Actual Ruhana analytics interface", 1116, 687, 220, 16, { size: 9, color: C.faint, align: "right" });
  sourceNotes(slide, [
    "Product architecture and screenshot are based on the current Ruhana codebase and dashboard.",
    "The embedded screenshot contains illustrative dashboard data, as labeled in the live interface.",
  ]);
}

// 09 — Business Model
{
  const slide = newSlide(9, "Business Model", "Recurring platform revenue, connected usage, and enterprise deployment.");
  rect(slide, 74, 188, 594, 330, C.paper, 22, C.line, 1);
  label(slide, "01 · RECURRING", 104, 218, 230, C.teal);
  text(slide, "Platform subscription", 104, 252, 480, 42, { size: 29, bold: true });
  text(slide, "Pays for the business system around the agent—not just the face.", 104, 304, 470, 52, { size: 16, color: C.muted, lineSpacing: 1.15 });
  const recurring = ["Agents + websites", "Builder + deployment", "Conversations + transcripts", "Outcome analytics"];
  recurring.forEach((item, i) => {
    const x = 104 + (i % 2) * 250;
    const y = 388 + Math.floor(i / 2) * 58;
    ellipse(slide, x, y + 2, 16, 16, C.tealSoft, "none", 0);
    text(slide, "✓", x + 1, y + 1, 14, 16, { size: 10, bold: true, color: C.teal, align: "center" });
    text(slide, item, x + 28, y, 205, 24, { size: 13, bold: true });
  });

  rect(slide, 688, 188, 678, 330, C.dark, 22);
  label(slide, "02 · VARIABLE", 718, 218, 230, C.clay);
  text(slide, "Connected usage", 718, 252, 500, 42, { size: 29, bold: true, color: C.white });
  text(slide, "Included minutes create predictability. Overage lets successful agents scale without plan friction.", 718, 304, 560, 52, { size: 16, color: "#C8CFCA", lineSpacing: 1.15 });
  const usage = [
    ["$0.13", "Estimated all-in connected-minute cost at pooled production utilization"],
    ["$0.26–0.32", "Published Ruhana overage range"],
    ["50–59%", "Gross margin on incremental usage"],
  ];
  usage.forEach(([v, b], i) => {
    const x = 718 + i * 206;
    text(slide, v, x, 392, 190, 34, { size: 23, bold: true, color: i === 1 ? C.clay : C.white });
    text(slide, b, x, 436, 182, 58, { size: 10, color: "#AAB2AD", lineSpacing: 1.1 });
  });

  rect(slide, 74, 548, 1292, 158, C.sageSoft, 20);
  label(slide, "ENTERPRISE EXPANSION", 104, 572, 250, C.green);
  text(slide, "Private cloud / on-premise · SSO and governance · custom integrations · success engineering", 104, 610, 870, 60, { size: 19, bold: true, color: C.ink, lineSpacing: 1.15 });
  pill(slide, "HIGHER ACV", 1112, 597, 190, C.dark, C.white);
  sourceNotes(slide, [
    "Unit economics benchmark (September 2026):",
    "The visible deck intentionally describes model categories rather than infrastructure vendors.",
    "Avatar-layer benchmark uses a $0.11 per extra minute professional overage from Anam's public pricing: https://anam.ai/pricing",
    "Language-model estimate uses GPT-5.6 Terra at $2.00/M input tokens and $12.00/M output tokens, assuming roughly 1,800 input and 180 output tokens per connected minute: about $0.006/min: https://developers.openai.com/api/docs/models/gpt-5.6-terra",
    "An additional ~$0.014/min is reserved for hosting, storage, observability and variability. Total estimated COGS is rounded to $0.13/min at pooled production utilization. Early-stage margins can be lower before capacity is efficiently pooled.",
  ]);
}

// 10 — Plans & Pricing
{
  const slide = newSlide(10, "Plans & Pricing", "Simple paid tiers. Business analytics are included from day one.");
  const plans = [
    { name: "Launch", price: "$39", mins: "100 min", agents: "1 agent · 1 website", overage: "$0.32 / min", tint: C.skySoft, accent: C.sky, analytics: "Lead, booking and resolution outcomes", features: ["1 concurrent session", "Ruhana avatar or own photo", "Transcripts + email support"] },
    { name: "Growth", price: "$129", mins: "400 min", agents: "3 agents · 3 websites", overage: "$0.29 / min", tint: C.tealSoft, accent: C.teal, analytics: "Journey funnels + agent comparison", features: ["3 concurrent sessions", "Integrations + custom actions", "Priority support"] },
    { name: "Scale", price: "$349", mins: "1,200 min", agents: "10 agents · 10 websites", overage: "$0.27 / min", tint: C.claySoft, accent: C.clay, analytics: "Revenue attribution + exports", features: ["6 concurrent sessions", "Webhooks + team controls", "Launch review"] },
    { name: "Enterprise", price: "From $999", mins: "3,500+ min", agents: "Custom agents + websites", overage: "From $0.26 / min", tint: C.lavenderSoft, accent: C.lavender, analytics: "Custom KPI model + governance", features: ["Private cloud / on-premise", "SSO, SLA + custom concurrency", "Success engineering"] },
  ];
  plans.forEach((plan, i) => {
    const x = 74 + i * 323;
    const cardFill = i === 1 ? C.dark : C.paper;
    const cardText = i === 1 ? C.white : C.ink;
    rect(slide, x, 186, 302, 520, cardFill, 22, i === 1 ? C.dark : C.line, 1);
    rect(slide, x, 186, 302, 9, plan.accent, 5);
    text(slide, plan.name, x + 22, 216, 238, 30, { size: 19, bold: true, color: cardText });
    if (i === 1) pill(slide, "MOST USEFUL", x + 174, 214, 104, C.clay, C.white);
    text(slide, plan.price, x + 22, 266, 250, 48, { size: plan.name === "Enterprise" ? 29 : 35, bold: true, color: cardText });
    text(slide, "/ month", x + 22, 318, 90, 20, { size: 11, color: i === 1 ? "#AAB2AD" : C.muted });
    pill(slide, plan.mins, x + 22, 357, 116, plan.tint, C.ink);
    text(slide, plan.agents, x + 22, 402, 250, 24, { size: 12, bold: true, color: cardText });
    line(slide, x + 22, 444, x + 280, 444, i === 1 ? "#343A36" : C.line, 0.9);
    label(slide, "ANALYTICS", x + 22, 466, 110, plan.accent);
    text(slide, plan.analytics, x + 22, 491, 250, 42, { size: 13, bold: true, color: cardText, lineSpacing: 1.08 });
    plan.features.forEach((feature, j) => {
      ellipse(slide, x + 22, 553 + j * 38, 14, 14, plan.tint, "none", 0);
      text(slide, "✓", x + 22, 552 + j * 38, 14, 14, { size: 9, bold: true, color: plan.accent, align: "center" });
      text(slide, feature, x + 46, 550 + j * 38, 226, 26, { size: 11, color: i === 1 ? "#D7DCD8" : C.muted, lineSpacing: 1.05 });
    });
    text(slide, plan.overage, x + 22, 674, 250, 20, { size: 10, bold: true, color: plan.accent });
  });
  text(slide, "USD · Monthly billing · Connected minutes are billed by actual session time · No free plan", 76, 724, 840, 18, { size: 10, color: C.faint });
  sourceNotes(slide, [
    "Ruhana pricing recommendation, September 2026. No free tier is included by design.",
    "At the $0.13/min pooled production COGS estimate, gross margins on fully used included allowances are approximately: Launch 66.7%, Growth 59.7%, Scale 55.3%, Enterprise floor 54.5%.",
    "Incremental usage gross margins are approximately: $0.32 59.4%, $0.29 55.2%, $0.27 51.9%, $0.26 50.0%.",
    "Competitive context: Anam paid plans currently list $12/50 minutes, $49/250, $299/2,000 and $999/5,000, with $0.16–$0.11/min overages. Ruhana prices a complete context, action and analytics product rather than raw avatar infrastructure: https://anam.ai/pricing",
  ]);
}

// 11 — Projected Financials
{
  const slide = newSlide(11, "Projected Financials", "A disciplined base case, driven by paid accounts and improving pooled utilization.");
  const headers = ["Metric", "Q4 ’26", "Q1 ’27", "Q2 ’27", "Q3 ’27", "Q4 ’27", "Q1 ’28", "Q2 ’28", "Q3 ’28"];
  const rows = [
    ["End customers", "12", "35", "75", "130", "220", "330", "470", "650"],
    ["Quarter revenue", "$2k", "$7k", "$18k", "$36k", "$67k", "$113k", "$175k", "$260k"],
    ["Gross margin", "50%", "52%", "54%", "55%", "56%", "57%", "58%", "59%"],
    ["Gross profit", "$1k", "$4k", "$10k", "$20k", "$37k", "$64k", "$102k", "$154k"],
    ["Operating spend", "$18k", "$24k", "$32k", "$45k", "$60k", "$75k", "$95k", "$120k"],
    ["Operating result", "($17k)", "($20k)", "($22k)", "($25k)", "($23k)", "($11k)", "$7k", "$34k"],
  ];
  const values = [headers, ...rows];
  const table = slide.tables.add({
    rows: values.length,
    columns: headers.length,
    left: 74,
    top: 198,
    width: 1292,
    height: 394,
    columnWidths: [196, 137, 137, 137, 137, 137, 137, 137, 137],
    values,
  });
  table.borders.assign({ style: "solid", fill: C.line, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: 9 }).assign({
    fill: C.dark,
    textStyle: { typeface: BODY, fontSize: 12, bold: true, color: C.white, alignment: "center" },
    margins: { top: 10, right: 8, bottom: 10, left: 8 },
    anchor: "middle",
  });
  table.cells.block({ row: 1, column: 0, rowCount: 6, columnCount: 1 }).assign({
    fill: C.paper,
    textStyle: { typeface: BODY, fontSize: 12, bold: true, color: C.ink, alignment: "left" },
    margins: { top: 10, right: 10, bottom: 10, left: 14 },
    anchor: "middle",
  });
  table.cells.block({ row: 1, column: 1, rowCount: 6, columnCount: 8 }).assign({
    fill: C.paper,
    textStyle: { typeface: BODY, fontSize: 12, color: C.ink, alignment: "center" },
    margins: { top: 10, right: 6, bottom: 10, left: 6 },
    anchor: "middle",
  });
  table.cells.block({ row: 3, column: 1, rowCount: 1, columnCount: 8 }).assign({ fill: C.tealSoft, textStyle: { typeface: BODY, fontSize: 12, bold: true, color: C.teal, alignment: "center" } });
  table.cells.block({ row: 6, column: 1, rowCount: 1, columnCount: 6 }).assign({ fill: C.claySoft, textStyle: { typeface: BODY, fontSize: 12, bold: true, color: C.red, alignment: "center" } });
  table.cells.block({ row: 6, column: 7, rowCount: 1, columnCount: 2 }).assign({ fill: C.sageSoft, textStyle: { typeface: BODY, fontSize: 12, bold: true, color: C.green, alignment: "center" } });

  rect(slide, 74, 620, 404, 88, C.dark, 16);
  text(slide, "$1.21M", 96, 638, 150, 34, { size: 27, bold: true, color: C.white });
  text(slide, "Exit ARR by Q3 ’28", 250, 646, 200, 24, { size: 12, color: "#C9CECA" });
  rect(slide, 498, 620, 404, 88, C.tealSoft, 16);
  text(slide, "Q2 ’28", 520, 638, 150, 34, { size: 27, bold: true, color: C.teal });
  text(slide, "Operating breakeven", 674, 646, 200, 24, { size: 12, color: C.muted });
  rect(slide, 922, 620, 444, 88, C.claySoft, 16);
  text(slide, "59%", 944, 638, 108, 34, { size: 27, bold: true, color: C.clay });
  text(slide, "Gross margin at Q3 ’28", 1060, 646, 260, 24, { size: 12, color: C.muted });
  text(slide, "Illustrative management base case—not current results. Values rounded.", 76, 724, 720, 18, { size: 10, color: C.faint });
  sourceNotes(slide, [
    "Forward-looking management assumptions; no current customer or revenue claims are made.",
    "Model assumptions: ending paid accounts grow from 12 in Q4 2026 to 650 in Q3 2028; blended monthly ARPA grows from roughly $96 to $155 as the plan mix shifts upward; quarter revenue uses average accounts within the quarter; gross margin improves as vendor capacity is pooled more efficiently.",
    "Operating spend includes product, engineering, go-to-market and general operations. It is illustrative and excludes fundraising proceeds.",
    "Exit ARR is Q3 2028 ending MRR (650 customers × $155) × 12 = approximately $1.21M.",
  ]);
}

// 12 — Why Ruhana Will Win
{
  const slide = newSlide(12, "Why Ruhana Will Win", "The moat is the customer journey around the avatar—not the avatar alone.");
  const cx = 720;
  const cy = 452;
  ellipse(slide, cx - 116, cy - 116, 232, 232, C.dark, "none", 0);
  addMark(slide, cx - 34, cy - 62, 68);
  text(slide, "RUHANA", cx - 74, cy + 20, 148, 30, { size: 17, bold: true, color: C.white, align: "center" });
  text(slide, "context → action → outcome", cx - 102, cy + 58, 204, 24, { size: 10, color: "#C9CECA", align: "center" });

  const wins = [
    ["01", "Observant by design", "Page, product, clicks and visitor journey shape every turn.", 74, 202, C.skySoft, C.sky],
    ["02", "Goal-directed", "Sales and support playbooks move toward a useful next action.", 958, 202, C.tealSoft, C.teal],
    ["03", "Measured in outcomes", "Revenue, qualification, booking, resolution and handoff are visible.", 74, 532, C.claySoft, C.clay],
    ["04", "Simple to deploy", "Four clear steps and one widget snippet keep the product accessible.", 958, 532, C.lavenderSoft, C.lavender],
  ];
  wins.forEach(([n, t, b, x, y, fill, accent]) => {
    rect(slide, x, y, 408, 154, fill, 20);
    pill(slide, n, x + 20, y + 20, 44, C.paper, accent);
    text(slide, t, x + 80, y + 18, 300, 32, { size: 20, bold: true, color: accent });
    text(slide, b, x + 80, y + 60, 292, 62, { size: 13, color: C.muted, lineSpacing: 1.16 });
    const fromX = x < 500 ? x + 408 : x;
    const toX = x < 500 ? cx - 116 : cx + 116;
    line(slide, fromX, y + 77, toX, cy, accent, 1.4, "dashed");
  });
  pill(slide, "ENTERPRISE PATH: PRIVATE DEPLOYMENT + GOVERNANCE", 490, 654, 460, C.sageSoft, C.green);
  sourceNotes(slide, [
    "Ruhana differentiation reflects the current product architecture and planned enterprise pathway.",
    "Private deployment and advanced governance should be presented externally as an enterprise option/pathway until production availability is contractually confirmed.",
    "Gartner (2026) argues that agent outcomes depend on organizational context and semantic foundations: https://www.gartner.com/en/newsroom/press-releases/2026-05-11-gartner-says-lack-of-semantics-causes-inaccurate-artificial-intelligence-agents-and-wasted-spending",
  ]);
}

// 13 — Timeline & Traction
{
  const slide = newSlide(13, "Timeline & Traction", "Built first. Validate outcomes next. Scale only after the loop is proven.");
  line(slide, 114, 438, 1326, 438, C.ink, 2);
  const milestones = [
    { x: 150, date: "AUG ’26", title: "Product system", body: "Premium dashboard, agent model and four-step creation flow designed.", status: "BUILT", color: C.sky },
    { x: 375, date: "SEP ’26", title: "Live foundation", body: "Public site, passwordless sign-in, embeddable widget and analytics backend.", status: "LIVE", color: C.teal },
    { x: 610, date: "Q4 ’26", title: "Design partners", body: "5–10 focused pilots; instrument revenue, resolution and handoff quality.", status: "NEXT", color: C.clay },
    { x: 850, date: "Q1 ’27", title: "Repeatable launch", body: "Billing, priority integrations and first regulated deployment pilot.", status: "PLAN", color: C.lavender },
    { x: 1086, date: "Q2–Q4 ’27", title: "Scale the wedge", body: "Multilingual playbooks, vertical templates and partner distribution.", status: "PLAN", color: C.sage },
  ];
  milestones.forEach((m, i) => {
    ellipse(slide, m.x - 9, 429, 18, 18, m.color, C.bg, 3);
    const above = i % 2 === 0;
    const cardY = above ? 198 : 500;
    line(slide, m.x, above ? 350 : 447, m.x, above ? 429 : 500, m.color, 1.3, "dashed");
    rect(slide, m.x - 94, cardY, 188, 152, C.paper, 16, C.line, 1);
    pill(slide, m.status, m.x - 76, cardY + 15, 66, i < 2 ? C.tealSoft : C.claySoft, i < 2 ? C.teal : C.clay);
    text(slide, m.date, m.x + 4, cardY + 20, 76, 18, { size: 9, bold: true, color: C.faint, align: "right" });
    text(slide, m.title, m.x - 76, cardY + 54, 152, 28, { size: 15, bold: true });
    text(slide, m.body, m.x - 76, cardY + 88, 152, 48, { size: 10, color: C.muted, lineSpacing: 1.1 });
  });
  rect(slide, 1010, 680, 316, 46, C.dark, 23);
  text(slide, "LIVE NOW · RUHANAAI.COM", 1032, 695, 272, 16, { size: 10, bold: true, color: C.white, align: "center" });
  sourceNotes(slide, [
    "Built/live milestones are supported by the current repository and the public site at https://www.ruhanaai.com/.",
    "Future pilot, integration and scale milestones are plans, not completed traction.",
    "The next proof point should be customer-level attributed outcomes from design partners, not vanity engagement metrics.",
  ]);
}

// 14 — Team
{
  const slide = newSlide(14, "Team", "Current contributors across product, platform, and analytics.");
  // Redraw the title block explicitly so the short word remains stable across
  // both Artifact Tool and PowerPoint renderers.
  rect(slide, 58, 38, 920, 132, C.bg, 0);
  label(slide, "14 · Team", 74, 46, 440, C.teal);
  text(slide, "Team", 74, 75, 900, 58, { size: 42, bold: true, font: DISPLAY, lineSpacing: 0.96 });
  text(slide, "Current contributors across product, platform, and analytics.", 76, 134, 900, 40, { size: 17, color: C.muted, lineSpacing: 1.1 });
  const members = [
    { initials: "AH", name: "Abdul Hadi Asif", role: "Product & experience", detail: "Brand, dashboard, landing experience and deployment UX", fill: C.tealSoft, accent: C.teal },
    { initials: "H", name: "Huzaifa", role: "AI & platform engineering", detail: "Agent services, model integration and backend systems", fill: C.skySoft, accent: C.sky },
    { initials: "RA", name: "Rabi Ahmed", role: "Analytics engineering", detail: "Session, conversion and business-impact analytics", fill: C.claySoft, accent: C.clay },
    { initials: "+", name: "Next partner", role: "Customer success & GTM", detail: "Design partnerships, onboarding and repeatable distribution", fill: C.lavenderSoft, accent: C.lavender },
  ];
  members.forEach((m, i) => {
    const x = 74 + i * 323;
    rect(slide, x, 194, 302, 332, C.paper, 22, C.line, 1);
    ellipse(slide, x + 78, 232, 146, 146, m.fill, "none", 0);
    text(slide, m.initials, x + 78, 274, 146, 58, { size: 34, bold: true, color: m.accent, align: "center", valign: "middle" });
    text(slide, m.name, x + 24, 406, 254, 30, { size: 19, bold: true, align: "center" });
    text(slide, m.role, x + 24, 446, 254, 24, { size: 12, bold: true, color: m.accent, align: "center" });
    text(slide, m.detail, x + 28, 482, 246, 42, { size: 11, color: C.muted, align: "center", lineSpacing: 1.1 });
  });
  rect(slide, 74, 562, 1292, 144, C.dark, 22);
  text(slide, "We are building the human interface", 104, 592, 720, 36, {
    size: 27,
    bold: true,
    color: C.white,
    lineSpacing: 1,
  });
  text(slide, "for agentic customer journeys.", 104, 632, 720, 38, {
    size: 29,
    italic: true,
    font: SERIF,
    color: C.sage,
    lineSpacing: 1,
  });
  pill(slide, "RUHANAAI.COM", 1072, 611, 224, C.clay, C.white);
  sourceNotes(slide, [
    "Contributor names and areas are based on the current repository history and the user's stated ownership of product UI.",
    "These are contribution labels rather than legal officer titles. Confirm formal titles before sending the deck externally.",
    "Repository contributors include Abdul Hadi / Abdulhadidev03, Huzaifa134 and Rabi Ahmed.",
  ]);
}

const stagingDir = path.join(buildDir, `.codex-finalizer-v${revision}`);
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

// Private visual previews for the mandatory slide-by-slide QA pass.
const previewDir = path.join(buildDir, `previews-v${revision}`);
await fs.mkdir(previewDir, { recursive: true });
for (let i = 0; i < presentation.slides.items.length; i += 1) {
  const slide = presentation.slides.getItem(i);
  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(previewDir, `slide-${String(i + 1).padStart(2, "0")}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const montage = await presentation.export({
  format: "png",
  montage: { format: "png", columns: 4, slideWidth: 360, padding: 20, gap: 14, background: "#EDECE8" },
});
await fs.writeFile(path.join(previewDir, "montage.png"), new Uint8Array(await montage.arrayBuffer()));

const requirements = {
  explicitTotalSlideCount: 14,
  requiredNativeTableOwnerSlides: [11],
  requiredNativeChartOwnerSlides: [],
  requiredEmbeddedWorkbookChartOwnerSlides: [],
};
const fontPolicy = { basis: "design", families: [BODY, SERIF] };
const expectedSlideSizeEmu = "13716000,7715250";
const finalResult = await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", expectedSlideSizeEmu,
    "--validate-bullet-geometry",
    "--validate-heading-fit",
    "--require-native-table-slide", "11",
  ],
  requiredNativeTableOwnerSlides: [11],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, `${path.basename(FINAL_PPTX)}.validation.json`),
});

console.log(JSON.stringify({
  finalPath: FINAL_PPTX,
  candidatePath,
  previewDir,
  finalResult,
}, null, 2));
