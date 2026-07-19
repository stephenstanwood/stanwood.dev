import type { APIRoute } from "astro";
import { readLinkedInMutation, linkedInMutationResponse } from "../../../lib/linkedin/api";
import { setLinkedInActioned } from "../../../lib/linkedin/tracker";
import { rateLimit, rateLimitResponse } from "../../../lib/rateLimit";

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!rateLimit(clientAddress)) return rateLimitResponse();
  const parsed = await readLinkedInMutation(request);
  if (parsed instanceof Response) return parsed;
  const result = await setLinkedInActioned(parsed.id, parsed.value);
  return linkedInMutationResponse(result.updated);
};
