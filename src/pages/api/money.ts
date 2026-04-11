import type { APIRoute } from 'astro';
import money from '../../data/money.json';
import { okJson } from '../../lib/apiHelpers';

// This route is protected by middleware (basic auth).
// Middleware runs before this, so if we get here, auth passed.
export const prerender = false;

export const GET: APIRoute = () => {
  return okJson(money, { 'Cache-Control': 'private, no-store' });
};
