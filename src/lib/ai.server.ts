import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

/**
 * Generates text with an OpenAI-compatible chat completions API.
 * Configure OPENAI_API_KEY, and optionally OPENAI_BASE_URL / OPENAI_MODEL.
 */
export async function generateTextWithAI(opts: { system: string; prompt: string }) {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured. Set OPENAI_API_KEY.");

  const provider = createOpenAI({
    apiKey,
    baseURL: process.env["OPENAI_BASE_URL"] ?? "https://api.openai.com/v1",
  });

  const { text } = await generateText({
    model: provider.chat(process.env["OPENAI_MODEL"] ?? "gpt-4o-mini"),
    system: opts.system,
    prompt: opts.prompt,
  });

  return text;
}
