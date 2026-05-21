export const prerender = false;

import type { APIRoute } from "astro";
import { rateLimit, rateLimitResponse } from "../../lib/rateLimit";
import { errJson, devErrJson, okJson, fetchWithTimeout, toErrMsg } from "../../lib/apiHelpers";

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;
const CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/translations/client_secrets";

const SUPPORTED_OUTPUT_LANGUAGES = new Set([
  "es", "zh", "vi", "tl", "ru", "ar", "ko", "fr", "pt", "hi", "ja", "de", "it", "en",
]);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress, 30)) return rateLimitResponse();
  if (!OPENAI_API_KEY) return errJson("OPENAI_API_KEY not configured", 500);

  try {
    const body = await request.json();
    const targetLanguage = typeof body?.targetLanguage === "string" ? body.targetLanguage : null;

    if (!targetLanguage || !SUPPORTED_OUTPUT_LANGUAGES.has(targetLanguage)) {
      return errJson("Invalid or unsupported targetLanguage", 400);
    }

    const openaiRes = await fetchWithTimeout(CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          model: "gpt-realtime-translate",
          audio: {
            input: {
              transcription: { model: "gpt-realtime-whisper" },
              noise_reduction: { type: "near_field" },
            },
            output: { language: targetLanguage },
          },
        },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI client_secrets error:", openaiRes.status, errText);
      return errJson("Failed to mint session token", 502);
    }

    const data = await openaiRes.json();
    return okJson(data);
  } catch (err) {
    console.error("handoff session API error:", err);
    return devErrJson("Something went wrong", toErrMsg(err));
  }
};
