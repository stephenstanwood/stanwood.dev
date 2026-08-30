import type { APIRoute } from "astro";
import { createLinkedInMutationRoute } from "../../../lib/linkedin/api";
import { setLinkedInActioned } from "../../../lib/linkedin/tracker";

export const prerender = false;

export const POST: APIRoute = createLinkedInMutationRoute(setLinkedInActioned);
