import type { APIRoute } from 'astro';
import { sessionCookie } from '../../lib/auth';
import { COOKIE, isSameOrigin } from '../../lib/scatos/auth';
export const prerender = false;
export const POST: APIRoute = ({ request }) => {
  if (!isSameOrigin(request)) return new Response('Open ScatosSwipe to sign out.', { status: 403 });
  return new Response(null, { status: 303, headers: { Location: '/lg/login',
    'Set-Cookie': sessionCookie(COOKIE, '', new URL(request.url), 0),
    'Cache-Control': 'private, no-store' } });
};
