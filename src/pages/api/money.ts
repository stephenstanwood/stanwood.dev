import type { APIRoute } from 'astro';
import money from '../../data/money.json';

// This route is protected by middleware (basic auth).
// Middleware runs before this, so if we get here, auth passed.
export const prerender = false;

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(money), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
};
