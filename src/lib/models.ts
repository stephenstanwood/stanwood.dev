/** Centralized Claude model ID constants */

import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_SONNET = "claude-sonnet-5";

/** Anthropic SDK client wired to the project's ANTHROPIC_API_KEY. Server-side only. */
export function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: import.meta.env.ANTHROPIC_API_KEY });
}

/** Extract trimmed text from the first content block of a Claude response. */
export function extractText(content: Array<{ type: string; text?: string }>): string {
  const block = content[0];
  return block?.type === "text" ? (block.text ?? "").trim() : "";
}

/** Strip markdown code fences (```json ... ``` or ``` ... ```) from a string. */
export function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}
