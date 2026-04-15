export const prerender = false;
export const config = { maxDuration: 60 };

import type { APIRoute } from "astro";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";
import { CLAUDE_SONNET, extractText, stripFences } from "../../../lib/models";
import { errJson, okJson, devErrJson, toErrMsg } from "../../../lib/apiHelpers";
import { buildMorePrompt } from "../../../lib/redesignRolodex/prompt";
import { VALID_MODES } from "../../../lib/redesignRolodex/types";
import type {
  WeirdnessMode,
  DesignDirection,
  MoreModifier,
} from "../../../lib/redesignRolodex/types";

const client = new Anthropic({
  apiKey: import.meta.env.ANTHROPIC_API_KEY,
});
const VALID_MODIFIERS: MoreModifier[] = ["more", "weirder", "calmer"];

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, 10)) return rateLimitResponse();

  try {
    const body = await request.json();
    const url = body?.url;
    const mode: WeirdnessMode = VALID_MODES.includes(body?.mode)
      ? body.mode
      : "designer";
    const modifier: MoreModifier = VALID_MODIFIERS.includes(body?.modifier)
      ? body.modifier
      : "more";
    const previousNames: string[] = Array.isArray(body?.previousNames)
      ? body.previousNames
      : [];
    const nextId: number =
      typeof body?.nextId === "number" ? body.nextId : previousNames.length + 2;

    if (!url || typeof url !== "string")
      return errJson("No URL provided", 400);

    const prompt = buildMorePrompt(url, mode, modifier, previousNames);

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
