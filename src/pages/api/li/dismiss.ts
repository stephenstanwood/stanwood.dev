import type { APIRoute } from "astro";
import { createLinkedInMutationRoute } from "../../../lib/linkedin/api";
import { setLinkedInDismissed } from "../../../lib/linkedin/tracker";

export const prerender = false;

export const POST: APIRoute = createLinkedInMutationRoute(setLinkedInDismissed);
