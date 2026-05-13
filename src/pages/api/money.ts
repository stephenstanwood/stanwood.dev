import type { APIRoute } from "astro";
import money from "../../data/money.json";
import { okJson } from "../../lib/apiHelpers";

// Auth is enforced by middleware; if execution reaches here, the request is authorized.
export const prerender = false;

export const GET: APIRoute = () => {
  return okJson(money, { "Cache-Control": "private, no-store" });
};
