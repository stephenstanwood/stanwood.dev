import type { APIRoute } from "astro";
import { errJson, okJson } from "../apiHelpers";
import { rateLimit, rateLimitResponse } from "../rateLimit";

type LinkedInMutation = (
  id: string,
  value: boolean,
) => Promise<{ updated: boolean }>;

async function readLinkedInMutation(
  request: Request,
): Promise<{ id: string; value: boolean } | Response> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return errJson("Expected JSON.", 415);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errJson("Invalid JSON.", 400);
  }
  if (!body || typeof body !== "object") return errJson("Invalid request.", 400);
  const record = body as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length < 3 || record.id.length > 300) {
    return errJson("Invalid person id.", 400);
  }
  const value = record.actioned ?? record.dismissed;
  if (typeof value !== "boolean") return errJson("Expected a boolean state.", 400);
  return { id: record.id, value };
}

function linkedInMutationResponse(updated: boolean): Response {
  return updated ? okJson({ ok: true }) : errJson("Person not found.", 404);
}

export function createLinkedInMutationRoute(mutate: LinkedInMutation): APIRoute {
  return async ({ request, clientAddress }) => {
    if (!rateLimit(clientAddress)) return rateLimitResponse();
    const parsed = await readLinkedInMutation(request);
    if (parsed instanceof Response) return parsed;
    const result = await mutate(parsed.id, parsed.value);
    return linkedInMutationResponse(result.updated);
  };
}
