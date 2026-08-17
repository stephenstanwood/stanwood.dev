export const prerender = false;
export const config = { maxDuration: 60 };

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences, getAnthropicClient } from "../../../lib/models";
import { okJson, devErrJson, parseRequestUrl, toErrMsg } from "../../../lib/apiHelpers";
import { buildMorePrompt } from "../../../lib/redesignRolodex/prompt";
import { parseMode } from "../../../lib/redesignRolodex/types";
import type {
  DesignDirection,
  MoreModifier,
} from "../../../lib/redesignRolodex/types";

const client = getAnthropicClient();
const VALID_MODIFIERS: MoreModifier[] = ["more", "weirder", "calmer"];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, 10)) return rateLimitResponse();

  try {
    const body = await request.json();
    const mode = parseMode(body?.mode);
    const modifier: MoreModifier = VALID_MODIFIERS.includes(body?.modifier)
      ? body.modifier
      : "more";
    // Bound the prompt input: keep only strings, cap count and per-item length
    const previousNames: string[] = Array.isArray(body?.previousNames)
      ? body.previousNames
          .filter((n: unknown): n is string => typeof n === "string")
          .slice(0, 50)
          .map((n: string) => n.slice(0, 100))
      : [];
    // `typeof === "number"` alone lets NaN/Infinity/fractions through, and each
    // one lands in a React `key` on the client. Require a plain counter value.
    const nextId: number =
      Number.isInteger(body?.nextId) && body.nextId >= 0
        ? body.nextId
        : previousNames.length + 2;

    const parsed = parseRequestUrl(body?.url);
    if (parsed instanceof Response) return parsed;

    const prompt = buildMorePrompt(parsed.toString(), mode, modifier, previousNames);

    const message = await client.messages.create({
      model: CLAUDE_SONNET,
      max_tokens: 12000,
      messages: [{ role: "user", content: prompt }],
    });

    const jsonText = stripFences(extractText(message.content));
    if (!jsonText) throw new Error("Unexpected response format");

    const result = JSON.parse(jsonText) as {
      directions: Omit<DesignDirection, "id">[];
    };

    const directions: DesignDirection[] = result.directions.map((direction, idx) => ({
      ...direction,
      id: nextId + idx,
    }));

    return okJson({ directions });
  } catch (err) {
    console.error("redesign-rolodex more error:", err);
    const errMsg = toErrMsg(err);
    const message = errMsg.includes("JSON")
      ? "AI returned an unexpected format. Try again."
      : "Couldn't generate more directions. Try again.";

    return devErrJson(message, errMsg);
  }
};
