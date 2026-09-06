import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Fast default for voice replies + analytics */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
