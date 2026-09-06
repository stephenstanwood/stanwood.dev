import type { APIRoute } from 'astro';
import { COOKIE, isSameOrigin } from '../../lib/scatos/auth';
export const prerender = false;
export const POST: APIRoute = ({ request }) => {
  if (!isSameOrigin(request)) return new Response('Open ScatosSwip to sign out.', { status: 403 });
  return new Response(null, { status: 303, headers: { Location: '/lg/login',
    'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    'Cache-Control': 'private, no-store' } });
};
