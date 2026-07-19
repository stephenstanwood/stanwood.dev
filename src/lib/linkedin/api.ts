import { errJson, okJson } from "../apiHelpers";

export async function readLinkedInMutation(
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

export function linkedInMutationResponse(updated: boolean): Response {
  return updated ? okJson({ ok: true }) : errJson("Person not found.", 404);
}
