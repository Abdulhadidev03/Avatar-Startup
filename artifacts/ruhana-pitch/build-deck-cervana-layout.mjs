import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "D:/Claude/Ruhana AI/agaentic_bot";
const deckDir = path.join(workspaceDir, "artifacts", "ruhana-pitch");
const assetDir = path.join(deckDir, "assets");
const buildDir = path.join(deckDir, ".build", "cervana-layout");
const outputDir = path.join(deckDir, "output");
const skillDir = "D:/CodexData/.codex/plugins/cache/openai-primary-runtime/presentations/26.904.11930/skills/presentations";
const runtimePython = "C:/Users/abdul/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const sourcePdf = "C:/Users/abdul/Downloads/Cervana AI  (3).pdf";
const sourceSha256 = "3a482c30fb687fb38e88fd97188b0798009cf1f8242e73177832b3ddeb16f2c0";
const finalPptx = path.join(outputDir, "Ruhana-AI-Pitch-Deck-Refined.pptx");

process.env.RUNTIME_NODE_MODULES ??= "C:/Users/abdul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const { finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href
);

const W = 1440;
const H = 810;
const FONT = "Arial";
const C = {
  white: "#FFFFFF",
  ink: "#0B0C0C",
  dark: "#17191A",
  gray: "#666A6C",
  mid: "#A8ACAE",
  line: "#D9DCDE",
  pale: "#F2F3F3",
  pale2: "#E7E9EA",
  blue: "#7D9EAA",
  bluePale: "#E9F0F2",
  orange: "#D8895A",
  orangePale: "#F7EEE9"
};

const imageBytes = {
  mark: await fs.readFile(path.join(assetDir, "ruhana-mark.svg")),
  cover: await fs.readFile(path.join(assetDir, "cover-sketch-v2.png")),
  solution: await fs.readFile(path.join(assetDir, "solution-sketch-v2.png")),
  whyNow: await fs.readFile(path.join(assetDir, "why-now-sketch-v2.png")),
  target: await fs.readFile(path.join(assetDir, "target-market-sketch-v2.png")),
  business: await fs.readFile(path.join(assetDir, "business-model-sketch-no-face-v2.png")),
  win: await fs.readFile(path.join(assetDir, "win-sketch-no-face-v2.png")),
  footprints: await fs.readFile(path.join(assetDir, "footprints-sketch-v2.png")),
  lamp: await fs.readFile(path.join(assetDir, "team-lamp-sketch-v2.png"))
};

const presentation = Presentation.create({ slideSize: { width: W, height: H } });
presentation.theme.colorScheme = {
  name: "Ruhana Monochrome",
  themeColors: {
    accent1: C.ink,
    accent2: C.gray,
    accent3: C.blue,
    accent4: C.orange,
    accent5: C.pale2,
    accent6: C.mid,
    bg1: C.white,
    bg2: C.pale,
    tx1: C.ink,
    tx2: C.gray,
    dk1: C.ink,
    dk2: C.dark,
    lt1: C.white,
    lt2: C.pale,
    hlink: C.blue,
    folHlink: C.gray
  }
};

let activeSlideNumber = 0;
const wordCounts = Array.from({ length: 14 }, () => 0);
const targetWordCounts = [11, 91, 80, 57, 25, 84, 55, 26, 38, 116, 103, 103, 89, 23];

function countWords(value) {
  const matches = String(value).replace(/[→×+—–·/]/gu, " ").match(/[\p{L}\p{N}$%’'.-]+/gu);
  return matches ? matches.length : 0;
}

function registerWords(value) {
  if (activeSlideNumber > 0) wordCounts[activeSlideNumber - 1] += countWords(value);
}

function rect(slide, x, y, w, h, fill = C.white, radius = 0, stroke = "none", strokeWidth = 0) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: stroke, width: strokeWidth },
    borderRadius: radius
  });
}

function ellipse(slide, x, y, w, h, fill = "none", stroke = C.line, strokeWidth = 1) {
  return slide.shapes.add({
    geometry: "ellipse",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: stroke, width: strokeWidth }
  });
}

function line(slide, x1, y1, x2, y2, color = C.line, width = 1, dash = "solid") {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return slide.shapes.add({
    geometry: "line",
    position: {
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      width: Math.max(1, Math.abs(dx)),
      height: Math.max(1, Math.abs(dy)),
      horizontalFlip: dx * dy < 0
    },
    fill: "none",
    line: { style: dash, fill: color, width }
  });
}

function text(slide, value, x, y, w, h, opts = {}) {
  registerWords(value);
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 }
  });
  box.text = value;
  box.text.style = {
    typeface: FONT,
    fontSize: opts.size ?? 20,
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    lineSpacing: opts.lineSpacing ?? 1.05,
    autoFit: opts.autoFit ?? "shrinkText",
    wrap: "square",
    insets: opts.insets ?? { top: 0, right: 0, bottom: 0, left: 0 }
  };
  return box;
}

function richText(slide, runs, x, y, w, h, opts = {}) {
  runs.forEach((item) => registerWords(item.run));
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 }
  });
  box.text.set([runs]);
  box.text.style = {
    typeface: FONT,
    fontSize: opts.size ?? 20,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    lineSpacing: opts.lineSpacing ?? 1,
    autoFit: opts.autoFit ?? "shrinkText",
    insets: { top: 0, right: 0, bottom: 0, left: 0 }
  };
  return box;
}

function addImage(slide, bytes, alt, x, y, w, h, opts = {}) {
  return slide.images.add({
    blob: bytes,
    contentType: opts.contentType ?? "image/png",
    alt,
    fit: opts.fit ?? "contain",
    crop: opts.crop,
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h }
  });
}

function addR(slide) {
  addImage(slide, imageBytes.mark, "Ruhana R mark", 1360, 739, 48, 48, {
    contentType: "image/svg+xml",
    fit: "contain"
  });
}

function newSlide(number, title = "") {
  activeSlideNumber = number;
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  if (title) text(slide, title, 68, 42, 920, 80, { size: 58, bold: true, lineSpacing: 0.95 });
  addR(slide);
  return slide;
}

function note(slide, lines) {
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
}

function numberedPoint(slide, n, body, x, y, w) {
  ellipse(slide, x, y + 1, 34, 34, C.ink, "none", 0);
  text(slide, String(n).padStart(2, "0"), x, y + 8, 34, 18, {
    size: 10,
    bold: true,
    color: C.white,
    align: "center",
    valign: "middle"
  });
  text(slide, body, x + 54, y, w - 54, 78, { size: 20, lineSpacing: 1.15 });
}

function dashConnector(slide, x1, y1, x2, y2, color = C.mid) {
  line(slide, x1, y1, x2, y2, color, 1.5, "dashed");
}

// 01 — Cover
{
  const slide = newSlide(1);
  addImage(slide, imageBytes.cover, "Hand-drawn video agent conversation", 36, 52, 700, 670, { fit: "contain" });
  addImage(slide, imageBytes.mark, "Ruhana AI mark", 822, 214, 66, 66, {
    contentType: "image/svg+xml",
    fit: "contain"
  });
  text(slide, "Ruhana AI", 910, 223, 350, 54, { size: 38, bold: true });
  text(slide, "The AI Video Agent", 820, 332, 570, 60, { size: 48, bold: true, lineSpacing: 0.95 });
  text(slide, "for Customer Success.", 820, 407, 560, 58, { size: 42, color: C.gray, lineSpacing: 0.96 });
  text(slide, "Product deck", 823, 505, 180, 24, { size: 15, color: C.mid });
  note(slide, [
    "Ruhana AI positioning: a website-native video agent for sales and customer support.",
    "The cover follows the supplied Cervana composition while using original Ruhana artwork and branding."
  ]);
}

// 02 — Problem
{
  const slide = newSlide(2, "Problem");
  const points = [
    "Businesses lose $3.8T in sales to poor customer experiences, while digital visitors leave without help.",
    "Generic chatbots answer FAQs but cannot read the page, product or buying intent shaping each visit.",
    "Visitors abandon slow, repetitive support before they reach a useful answer or a qualified human.",
    "Teams connect separate avatar, voice, model and analytics tools, adding weeks of technical setup.",
    "Financial and public teams need private deployment, retention controls and a clear path to people.",
    "Conversation counts show activity, but not which agent changed revenue, resolution or conversion."
  ];
  const positions = [
    [74, 174], [750, 174],
    [74, 354], [750, 354],
    [74, 534], [750, 534]
  ];
  points.forEach((body, i) => {
    numberedPoint(slide, i + 1, body, positions[i][0], positions[i][1], 600);
    if (i < 4) line(slide, positions[i][0] + 54, positions[i][1] + 105, positions[i][0] + 590, positions[i][1] + 105, C.pale2, 1);
  });
  ellipse(slide, 1270, 20, 118, 118, "none", C.pale2, 15);
  ellipse(slide, 1313, 63, 44, 44, C.orangePale, "none", 0);
  note(slide, [
    "Qualtrics estimated $3.8 trillion in global sales at risk from poor customer experiences in 2025: https://www.qualtrics.com/articles/customer-experience/trillion-sales-at-risk-2025/",
    "Capgemini reports that 55% of consumers would leave a brand after poor service and 71% prefer human agents for empathy: https://www.capgemini.com/wp-content/uploads/2025/03/Final-Web-Version-Report-Customer-Service-Transformation.pdf",
    "No universal conversion uplift is claimed."
  ]);
}

// 03 — Solution
{
  const slide = newSlide(3, "Solution");
  text(
    slide,
    "Ruhana is a complete video agent for websites, built with voice, context, actions and analytics. No developer required.",
    188,
    148,
    970,
    78,
    { size: 28, bold: true, align: "center", lineSpacing: 1.06 }
  );
  line(slide, 648, 232, 790, 232, C.orange, 3);
  const points = [
    ["Answers in real time", "Sales and support by voice or text."],
    ["Understands the visit", "Reads the page, product and visitor journey."],
    ["Moves work forward", "Qualifies, recommends, books and completes approved actions."],
    ["Deploys simply", "One website snippet connects the existing stack."],
    ["Hands off cleanly", "Concurrent multilingual sessions retain full context."]
  ];
  const loc = [
    [94, 292], [94, 462], [510, 292], [510, 462], [930, 292]
  ];
  points.forEach((p, i) => {
    ellipse(slide, loc[i][0], loc[i][1] + 4, 28, 28, i === 4 ? C.bluePale : C.pale, "none", 0);
    text(slide, String(i + 1), loc[i][0], loc[i][1] + 10, 28, 14, {
      size: 9,
      bold: true,
      color: i === 4 ? C.blue : C.gray,
      align: "center"
    });
    text(slide, p[0], loc[i][0] + 42, loc[i][1], 300, 28, { size: 20, bold: true });
    text(slide, p[1], loc[i][0] + 42, loc[i][1] + 39, 310, 62, { size: 17, color: C.gray, lineSpacing: 1.14 });
  });
  addImage(slide, imageBytes.solution, "Hand-drawn website video agent lightbulb", 1035, 420, 340, 275, { fit: "contain" });
  note(slide, [
    "Capabilities reflect the product architecture and intended deployment experience.",
    "The solution artwork is original, generated for Ruhana, and not copied from a competitor."
  ]);
}

// 04 — Why Now
{
  const slide = newSlide(4, "Why Now");
  const points = [
    "Real-time video models now feel natural enough for live sales and support.",
    "Voice models deliver low-latency speech across the languages buyers already use.",
    "Website context supplies the product and journey details generic chatbots miss.",
    "Buyers increasingly expect immediate conversational help before deciding or leaving.",
    "Outcome analytics can connect each conversation to revenue, resolution or conversion."
  ];
  points.forEach((body, i) => {
    ellipse(slide, 82, 165 + i * 112, 28, 28, i === 4 ? C.orangePale : C.pale, "none", 0);
    text(slide, String(i + 1), 82, 172 + i * 112, 28, 15, {
      size: 9,
      bold: true,
      color: i === 4 ? C.orange : C.gray,
      align: "center"
    });
    text(slide, body, 130, 158 + i * 112, 570, 64, { size: 21, lineSpacing: 1.12 });
  });
  line(slide, 850, 165, 1100, 165, C.blue, 2);
  line(slide, 920, 195, 1210, 195, C.mid, 2);
  line(slide, 1010, 225, 1310, 225, C.pale2, 2);
  ellipse(slide, 1092, 158, 14, 14, C.blue, "none", 0);
  ellipse(slide, 1202, 188, 14, 14, C.mid, "none", 0);
  ellipse(slide, 1302, 218, 14, 14, C.pale2, "none", 0);
  addImage(slide, imageBytes.whyNow, "Faceless person entering a live agent experience", 736, 260, 610, 430, { fit: "contain" });
  note(slide, [
    "The timing argument is based on recent improvements in real-time video, voice and language models.",
    "The business claim is directional and intentionally avoids a fabricated uplift percentage."
  ]);
}

// 05 — Market Size
{
  const slide = newSlide(5, "Market Size");
  ellipse(slide, 650, 150, 520, 520, C.pale, "none", 0);
  ellipse(slide, 730, 230, 360, 360, C.pale2, "none", 0);
  ellipse(slide, 805, 305, 210, 210, C.dark, "none", 0);
  text(slide, "TAM", 768, 166, 110, 28, { size: 18, bold: true, color: C.gray });
  text(slide, "SAM", 775, 256, 110, 28, { size: 18, bold: true, color: C.gray });
  text(slide, "SOM", 852, 352, 116, 28, { size: 18, bold: true, color: C.white, align: "center" });
  richText(slide, [
    { run: "$", textStyle: { bold: true, fontSize: "24px", color: C.orange, typeface: FONT } },
    { run: "41.4B", textStyle: { bold: true, fontSize: "46px", color: C.ink, typeface: FONT } }
  ], 84, 232, 280, 58, { size: 46, bold: true });
  text(slide, "Global conversational AI by 2030", 86, 300, 360, 55, { size: 20, color: C.gray });
  richText(slide, [
    { run: "$", textStyle: { bold: true, fontSize: "22px", color: C.orange, typeface: FONT } },
    { run: "1.04B", textStyle: { bold: true, fontSize: "42px", color: C.ink, typeface: FONT } }
  ], 84, 440, 280, 55, { size: 42, bold: true });
  text(slide, "Avatar-led customer service by 2030", 86, 503, 360, 56, { size: 20, color: C.gray });
  text(slide, "$10.4M", 838, 395, 145, 38, { size: 28, bold: true, color: C.white, align: "center" });
  text(slide, "1% of SAM in five years", 1190, 415, 174, 52, { size: 18, color: C.gray });
  line(slide, 1017, 410, 1170, 438, C.orange, 2);
  note(slide, [
    "Grand View Research estimates the avatar-based online customer-service market at $267.9M in 2025 and $2.3728B in 2033, a 31.2% CAGR: https://www.grandviewresearch.com/horizon/statistics/ai-avatar-market/application/avatar-based-online-customer-service/global",
    "Grand View Research estimates the conversational AI market at $41.39B by 2030: https://www.prnewswire.com/news-releases/conversational-ai-market-to-be-worth-41-39-billion-by-2030-at-cagr-23-7---grand-view-research-inc-302452404.html",
    "SAM is the 2030 interpolation of the cited avatar customer-service market. SOM is an illustrative 1% objective, not a forecast."
  ]);
}

// 06 — Target Market
{
  const slide = newSlide(6, "Target Market");
  text(
    slide,
    "Website-first teams where every missed conversation means lost revenue, unresolved support or a customer leaving without confidence.",
    94,
    200,
    520,
    130,
    { size: 30, bold: true, lineSpacing: 1.08 }
  );
  line(slide, 96, 350, 250, 350, C.orange, 3);
  addImage(slide, imageBytes.target, "Five faceless customer groups", 42, 395, 600, 315, { fit: "contain" });

  const cx = 1000;
  const cy = 435;
  ellipse(slide, cx - 102, cy - 102, 204, 204, C.dark, "none", 0);
  text(slide, "RUHANA", cx - 75, cy - 12, 150, 28, { size: 20, bold: true, color: C.white, align: "center" });
  const segments = [
    ["E-commerce", 1000, 194],
    ["SaaS & support", 1230, 302],
    ["Finance", 1246, 545],
    ["Healthcare", 1000, 650],
    ["Hospitality", 760, 545]
  ];
  segments.forEach((item, i) => {
    const x = item[1] - 72;
    const y = item[2] - 36;
    ellipse(slide, x, y, 144, 72, i === 1 ? C.bluePale : C.pale, "none", 0);
    text(slide, item[0], x + 10, y + 24, 124, 24, {
      size: 15,
      bold: true,
      color: i === 1 ? C.blue : C.gray,
      align: "center"
    });
    dashConnector(slide, cx, cy, item[1], item[2], i === 1 ? C.blue : C.mid);
  });
  text(slide, "Warm interests", 1190, 154, 156, 24, { size: 14, bold: true, color: C.blue, align: "center" });
  line(slide, 1224, 181, 1308, 206, C.blue, 2);
  note(slide, [
    "Target segments are an initial go-to-market focus, not claimed customers.",
    "Regulated deployment is positioned as an enterprise pathway subject to implementation and contractual confirmation."
  ]);
}

// 07 — Competitive Landscape
{
  const slide = newSlide(7, "Competitive Landscape");
  rect(slide, 72, 194, 440, 440, C.pale, 108);
  text(slide, "Competitors", 112, 232, 250, 34, { size: 24, bold: true });
  text(slide, "Anam\nLemonSlice\nTavus", 114, 292, 260, 168, { size: 30, color: C.gray, lineSpacing: 1.35 });

  ellipse(slide, 550, 286, 270, 270, C.white, C.ink, 2);
  text(slide, "Their focus", 598, 324, 174, 28, { size: 22, bold: true, align: "center" });
  text(slide, "Real-time avatars\nPersona creation\nDeveloper infrastructure", 590, 380, 190, 112, {
    size: 17,
    color: C.gray,
    align: "center",
    lineSpacing: 1.28
  });

  rect(slide, 910, 150, 410, 245, C.dark, 86);
  text(slide, "Open gaps", 960, 190, 250, 30, { size: 23, bold: true, color: C.white });
  text(slide, "Limited page intent\nActions need engineering\nUsage metrics, not outcomes", 962, 244, 290, 112, {
    size: 18,
    color: C.pale2,
    lineSpacing: 1.3
  });

  rect(slide, 900, 470, 430, 220, C.bluePale, 80);
  text(slide, "Ruhana advantage", 950, 506, 310, 30, { size: 23, bold: true });
  text(slide, "Website context\nSales and support actions\nOutcome analytics", 952, 558, 300, 106, {
    size: 18,
    color: C.gray,
    lineSpacing: 1.28
  });
  dashConnector(slide, 500, 410, 550, 421);
  dashConnector(slide, 820, 394, 910, 275, C.orange);
  dashConnector(slide, 818, 490, 900, 580, C.blue);
  note(slide, [
    "Competitor framing is based on public product positioning and pricing pages reviewed in September 2026.",
    "Anam: https://anam.ai/ and https://anam.ai/pricing",
    "LemonSlice: https://lemonslice.com/",
    "Tavus: https://www.tavus.io/",
    "The slide describes product focus, not a claim that competitors cannot add similar capabilities."
  ]);
}

// 08 — Product
{
  const slide = newSlide(8, "Product");
  const topLabels = [
    "Website event",
    "Page + visitor context",
    "Live video conversation",
    "Approved action",
    "Outcome recorded"
  ];
  const bottomLabels = [
    "Embed layer",
    "Context layer",
    "Agent layer",
    "Integration layer",
    "Analytics layer"
  ];
  const centers = [160, 438, 716, 994, 1272];
  line(slide, centers[0], 395, centers[4], 395, C.mid, 2, "dashed");
  centers.forEach((cx, i) => {
    text(slide, topLabels[i], cx - 104, 232, 208, 56, { size: 19, bold: true, align: "center" });
    ellipse(slide, cx - 52, 343, 104, 104, i === 2 ? C.dark : C.pale, "none", 0);
    text(slide, String(i + 1).padStart(2, "0"), cx - 52, 374, 104, 32, {
      size: 20,
      bold: true,
      color: i === 2 ? C.white : C.gray,
      align: "center",
      valign: "middle"
    });
    text(slide, bottomLabels[i], cx - 104, 494, 208, 34, { size: 17, color: C.gray, align: "center" });
  });
  note(slide, [
    "The five native stages summarize Ruhana's website-to-outcome architecture.",
    "The diagram is intentionally simple and editable."
  ]);
}

// 09 — Business Model
{
  const slide = newSlide(9, "Business Model");
  addImage(slide, imageBytes.business, "Faceless operator configuring an agent", 10, 320, 555, 380, { fit: "contain" });
  line(slide, 625, 165, 1250, 165, C.blue, 2);
  ellipse(slide, 617, 158, 14, 14, C.blue, "none", 0);
  ellipse(slide, 1243, 158, 14, 14, C.blue, "none", 0);

  rect(slide, 540, 244, 330, 350, C.pale, 110);
  text(slide, "One-time setup", 596, 292, 220, 30, { size: 25, bold: true, align: "center" });
  richText(slide, [
    { run: "$", textStyle: { bold: true, fontSize: "22px", color: C.orange, typeface: FONT } },
    { run: "250+", textStyle: { bold: true, fontSize: "48px", color: C.ink, typeface: FONT } }
  ], 602, 350, 205, 58, { size: 48, bold: true, align: "center" });
  text(slide, "Private deployment\nor custom integration", 592, 442, 225, 76, {
    size: 18,
    color: C.gray,
    align: "center",
    lineSpacing: 1.22
  });

  rect(slide, 900, 194, 410, 440, C.dark, 130);
  text(slide, "Monthly subscription", 970, 244, 270, 30, { size: 25, bold: true, color: C.white, align: "center" });
  text(slide, "Launch $39\nGrowth $129\nScale $349\nEnterprise $999+", 982, 310, 250, 164, {
    size: 27,
    bold: true,
    color: C.white,
    align: "center",
    lineSpacing: 1.35
  });
  text(slide, "Minutes included\nOverage only when used\nNo free tier", 1000, 500, 214, 96, {
    size: 17,
    color: C.pale2,
    align: "center",
    lineSpacing: 1.3
  });
  note(slide, [
    "Recommended business model: paid subscriptions plus optional setup or private-deployment work.",
    "Prices are product recommendations, not current revenue."
  ]);
}

// 10 — Plans & Pricing
{
  const slide = newSlide(10, "Plans & Pricing");
  const plans = [
    {
      name: "Launch",
      price: "39",
      minutes: "100 min / month",
      bullets: ["1 agent", "1 website", "Transcripts", "Outcome analytics"],
      overage: "$0.32 / extra min",
      fill: C.white
    },
    {
      name: "Growth",
      price: "129",
      minutes: "400 min / month",
      bullets: ["3 agents", "3 websites", "Integrations", "Journey funnels", "Priority support"],
      overage: "$0.29 / extra min",
      fill: C.pale
    },
    {
      name: "Scale",
      price: "349",
      minutes: "1,200 min / month",
      bullets: ["10 agents", "10 websites", "Webhooks", "Revenue attribution", "Launch review"],
      overage: "$0.27 / extra min",
      fill: C.white
    },
    {
      name: "Enterprise",
      price: "999+",
      minutes: "3,500+ min / month",
      bullets: ["Custom capacity", "Private deployment", "SSO + SLA", "Success engineering"],
      overage: "From $0.26 / extra min",
      fill: C.pale
    }
  ];
  plans.forEach((plan, i) => {
    const x = 56 + i * 334;
    rect(slide, x, 158, 306, 570, plan.fill, 24);
    if (i > 0) line(slide, x - 14, 180, x - 14, 704, C.pale2, 1);
    if (i === 1) rect(slide, x, 158, 306, 7, C.blue, 4);
    text(slide, plan.name, x + 26, 198, 254, 38, { size: 27, bold: true });
    richText(slide, [
      { run: "$", textStyle: { bold: true, fontSize: "25px", color: C.orange, typeface: FONT } },
      { run: plan.price, textStyle: { bold: true, fontSize: "56px", color: C.ink, typeface: FONT } }
    ], x + 26, 270, 254, 68, { size: 56, bold: true });
    text(slide, plan.minutes, x + 27, 355, 250, 28, { size: 17, bold: true, color: C.gray });
    line(slide, x + 27, 402, x + 275, 402, C.line, 1);
    text(slide, plan.bullets.map((item) => "— " + item).join("\n"), x + 27, 430, 250, 165, {
      size: 17,
      color: C.gray,
      lineSpacing: 1.32
    });
    text(slide, plan.overage, x + 27, 654, 250, 24, { size: 14, bold: true, color: i === 1 ? C.blue : C.gray });
  });
  note(slide, [
    "Pricing is a recommended launch structure and has not been presented as historical sales.",
    "Modeled pooled production cost is $0.13 per connected minute.",
    "At full included usage, modeled gross margins are approximately 66.7%, 59.7%, 55.3% and 54.5%.",
    "OpenAI GPT-5.6 Terra pricing used in the model is $2/M input tokens, $0.20/M cached input and $12/M output: https://developers.openai.com/api/docs/models/gpt-5.6-terra",
    "Competitive context: https://anam.ai/pricing"
  ]);
}

// 11 — Projected Financials
{
  const slide = newSlide(11, "Projected Financials");
  const values = [
    ["Metric", "Q1", "Q2", "Q3", "Q4", "Year 1"],
    ["New customers", "12", "23", "40", "55", "130"],
    ["Total active", "12", "35", "75", "130", "130"],
    ["SUBSCRIPTION REVENUE", "$2.0k", "$7.0k", "$18.0k", "$36.0k", "$63.0k"],
    ["Setup and services", "$1.0k", "$2.0k", "$3.0k", "$4.0k", "$10.0k"],
    ["Total revenue", "$3.0k", "$9.0k", "$21.0k", "$40.0k", "$73.0k"],
    ["Variable cost", "$1.5k", "$4.0k", "$9.4k", "$18.0k", "$32.9k"],
    ["Operating spend", "$18.0k", "$24.0k", "$32.0k", "$45.0k", "$119.0k"],
    ["Operating result", "($16.5k)", "($19.0k)", "($20.4k)", "($23.0k)", "($78.9k)"],
    ["Gross margin", "50%", "56%", "55%", "55%", "55%"]
  ];
  values.flat().forEach(registerWords);
  const table = slide.tables.add({
    rows: values.length,
    columns: values[0].length,
    left: 62,
    top: 154,
    width: 1316,
    height: 550,
    columnWidths: [350, 190, 190, 190, 190, 206],
    values
  });
  table.borders.assign({ style: "solid", fill: C.line, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: 6 }).assign({
    fill: C.dark,
    textStyle: { typeface: FONT, fontSize: 15, bold: true, color: C.white, alignment: "center" },
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    anchor: "middle"
  });
  table.cells.block({ row: 1, column: 0, rowCount: 9, columnCount: 1 }).assign({
    fill: C.white,
    textStyle: { typeface: FONT, fontSize: 15, bold: true, color: C.ink, alignment: "left" },
    margins: { top: 9, right: 12, bottom: 9, left: 16 },
    anchor: "middle"
  });
  table.cells.block({ row: 1, column: 1, rowCount: 9, columnCount: 5 }).assign({
    fill: C.white,
    textStyle: { typeface: FONT, fontSize: 15, color: C.ink, alignment: "center" },
    margins: { top: 9, right: 8, bottom: 9, left: 8 },
    anchor: "middle"
  });
  table.cells.block({ row: 3, column: 0, rowCount: 1, columnCount: 6 }).assign({
    fill: C.pale,
    textStyle: { typeface: FONT, fontSize: 15, bold: true, color: C.ink, alignment: "center" }
  });
  table.cells.block({ row: 5, column: 0, rowCount: 1, columnCount: 6 }).assign({
    fill: C.bluePale,
    textStyle: { typeface: FONT, fontSize: 15, bold: true, color: C.ink, alignment: "center" }
  });
  table.cells.block({ row: 8, column: 0, rowCount: 1, columnCount: 6 }).assign({
    fill: C.orangePale,
    textStyle: { typeface: FONT, fontSize: 15, bold: true, color: C.ink, alignment: "center" }
  });
  text(slide, "Illustrative management base case. Not current results.", 64, 722, 560, 22, { size: 12, color: C.mid });
  note(slide, [
    "All financial figures are an illustrative one-year management base case, not actual results.",
    "The model assumes a paid-only mix, pooled unit cost near $0.13 per connected minute and gross margin maintained at or above 50%.",
    "Operating spend is illustrative and includes product, engineering, go-to-market and general operations."
  ]);
}

// 12 — Why Ruhana Will Win
{
  const slide = newSlide(12);
  text(slide, "Why Ruhana\nWill Win", 68, 42, 760, 148, { size: 68, bold: true, lineSpacing: 0.92 });
  text(
    slide,
    "Ruhana adapts across industries while the website keeps each agent specific.",
    930,
    66,
    400,
    72,
    { size: 20, bold: true, lineSpacing: 1.12 }
  );
  line(slide, 930, 150, 1078, 150, C.orange, 3);

  const blocks = [
    [
      "Website-first, not generic",
      "We start from the page, visitor intent and business outcome—not a blank conversation.",
      78,
      250
    ],
    [
      "Execution-led go-to-market",
      "We launch with design partners, prove one KPI and expand where the agent works.",
      500,
      250
    ],
    [
      "Brand as trust",
      "A premium human interface sits beside clear controls, handoff and measurable accountability.",
      78,
      485
    ],
    [
      "Compounding product data",
      "Each deployment improves intents, actions and outcome models that generic avatar APIs do not own.",
      500,
      485
    ]
  ];
  blocks.forEach((block, i) => {
    ellipse(slide, block[2], block[3] + 2, 30, 30, i === 3 ? C.bluePale : C.pale, "none", 0);
    text(slide, String(i + 1), block[2], block[3] + 9, 30, 15, {
      size: 9,
      bold: true,
      color: i === 3 ? C.blue : C.gray,
      align: "center"
    });
    text(slide, block[0], block[2] + 48, block[3], 338, 34, { size: 23, bold: true });
    text(slide, block[1], block[2] + 48, block[3] + 54, 350, 92, {
      size: 18,
      color: C.gray,
      lineSpacing: 1.22
    });
  });
  addImage(slide, imageBytes.win, "Hands using an outcome-aware video agent", 960, 300, 388, 395, { fit: "contain" });
  note(slide, [
    "The differentiation is Ruhana's product thesis, not a patent or permanent exclusivity claim.",
    "Gartner notes that agents need organizational semantics and context to deliver reliable outcomes: https://www.gartner.com/en/newsroom/press-releases/2026-05-11-gartner-says-lack-of-semantics-causes-inaccurate-artificial-intelligence-agents-and-wasted-spending"
  ]);
}

// 13 — Timeline & Traction
{
  const slide = newSlide(13, "Timeline & Traction");
  const milestones = [
    ["Jul 2026", "Product architecture", "BUILT"],
    ["Aug 2026", "Dashboard + analytics", "BUILT"],
    ["Early Sep", "Builder + auth", "BUILT"],
    ["Late Sep", "Live widget pilot", "NEXT"],
    ["Oct 2026", "Design partners", "PLAN"],
    ["Nov 2026", "First paid deployment", "PLAN"],
    ["Q1 2027", "Vertical playbook", "PLAN"]
  ];
  const centers = [120, 318, 516, 714, 912, 1110, 1308];
  line(slide, 90, 397, 1340, 397, C.ink, 2);
  milestones.forEach((m, i) => {
    const above = i % 2 === 0;
    const nodeY = 385;
    ellipse(slide, centers[i] - 12, nodeY, 24, 24, i < 3 ? C.ink : C.white, i < 3 ? C.ink : C.mid, 2);
    dashConnector(slide, centers[i], above ? 280 : 421, centers[i], above ? 385 : 520, i === 3 ? C.orange : C.mid);
    const y = above ? 198 : 530;
    text(slide, m[0], centers[i] - 82, y, 164, 22, { size: 13, bold: true, color: C.gray, align: "center" });
    text(slide, m[1], centers[i] - 90, y + 35, 180, 54, { size: 17, bold: true, align: "center", lineSpacing: 1.1 });
    text(slide, m[2], centers[i] - 47, y + 98, 94, 20, {
      size: 10,
      bold: true,
      color: i === 3 ? C.orange : C.mid,
      align: "center"
    });
  });
  addImage(slide, imageBytes.footprints, "Three hand-drawn footsteps", 1160, 55, 180, 120, { fit: "contain" });
  line(slide, 76, 716, 204, 716, C.blue, 3);
  text(slide, "Ongoing: website integrations and enterprise deployment path", 222, 704, 650, 26, { size: 16, color: C.gray });
  note(slide, [
    "Built milestones reflect the current repository and public product state.",
    "Pilot, partner and paid-deployment milestones are plans, not completed traction.",
    "Formal dates should be refreshed before external circulation."
  ]);
}

// 14 — Team
{
  const slide = newSlide(14);
  rect(slide, 50, 30, 480, 100, C.white, 0);
  text(slide, " Team", 48, 42, 430, 80, { size: 58, bold: true, lineSpacing: 0.95 });
  addImage(slide, imageBytes.lamp, "Hand-drawn hanging lamp", 790, 35, 310, 245, { fit: "contain" });
  const members = [
    ["AH", "Abdul Hadi Asif", "Product & Experience"],
    ["H", "Huzaifa", "AI & Platform"],
    ["RA", "Rabi Ahmed", "Analytics Engineering"],
    ["+", "Customer Success Lead", "Next hire"]
  ];
  const centers = [175, 535, 895, 1255];
  line(slide, centers[0], 418, centers[3], 418, C.mid, 2, "dashed");
  members.forEach((member, i) => {
    ellipse(slide, centers[i] - 92, 326, 184, 184, i === 3 ? C.pale : C.white, i === 0 ? C.ink : C.line, i === 0 ? 2 : 1.5);
    text(slide, member[0], centers[i] - 92, 385, 184, 55, {
      size: 36,
      bold: true,
      color: i === 3 ? C.mid : C.ink,
      align: "center",
      valign: "middle"
    });
    text(slide, member[1], centers[i] - 130, 544, 260, 36, { size: 20, bold: true, align: "center" });
    text(slide, member[2], centers[i] - 130, 590, 260, 34, { size: 16, color: C.gray, align: "center" });
  });
  note(slide, [
    "Contributor names reflect current repository history and user-provided ownership.",
    "Contribution areas are working labels. Confirm formal titles before external circulation."
  ]);
}

const stagingDir = path.join(buildDir, "finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const previewDir = path.join(buildDir, "previews");
await fs.mkdir(previewDir, { recursive: true });
for (let i = 0; i < presentation.slides.items.length; i += 1) {
  const slide = presentation.slides.getItem(i);
  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(
    path.join(previewDir, "slide-" + String(i + 1).padStart(2, "0") + ".png"),
    new Uint8Array(await preview.arrayBuffer())
  );
}
const montage = await presentation.export({
  format: "png",
  montage: {
    format: "png",
    columns: 4,
    slideWidth: 360,
    padding: 20,
    gap: 14,
    background: "#ECEEEF"
  }
});
await fs.writeFile(path.join(previewDir, "montage.png"), new Uint8Array(await montage.arrayBuffer()));

const finalResult = await finalizePresentation({
  explicitTotalSlideCount: 14,
  requiredNativeTableOwnerSlides: [11],
  requiredNativeChartOwnerSlides: [],
  requiredEmbeddedWorkbookChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: finalPptx,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "13716000,7715250",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
    "--require-native-table-slide", "11"
  ],
  fontPolicy: {
    basis: "reference",
    families: [FONT],
    referencePath: sourcePdf,
    referenceSha256: sourceSha256
  },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "Ruhana-AI-Pitch-Deck-Refined-final.pptx.validation.json")
});

console.log(JSON.stringify({
  finalPath: finalPptx,
  candidatePath,
  previewDir,
  wordCounts: wordCounts.map((actual, index) => ({
    slide: index + 1,
    source: targetWordCounts[index],
    ruhana: actual,
    delta: actual - targetWordCounts[index]
  })),
  finalResult
}, null, 2));
