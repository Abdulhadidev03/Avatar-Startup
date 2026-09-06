import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** GPT-5.6 Terra = balanced quality/cost. Use gpt-5.6-luna for cheaper/faster voice. */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";

/** Keep voice turns snappy — none/low recommended for live avatar */
export const OPENAI_REASONING_EFFORT = (process.env.OPENAI_REASONING_EFFORT ??
  "low") as "none" | "low" | "medium" | "high" | "xhigh" | "max";
