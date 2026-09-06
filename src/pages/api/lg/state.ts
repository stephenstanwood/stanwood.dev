import type { APIRoute } from 'astro';
import { getSession, isSameOrigin } from '../../../lib/scatos/auth';
import { getState, scatosSql } from '../../../lib/scatos/db';

export const prerender = false;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});
export const GET: APIRoute = async ({ request }) => {
  const profile = await getSession(request);
  if (!profile) return json({ error: 'Please sign in again.' }, 401);
  try { return json(await getState(profile)); }
  catch (error) { console.error('ScatosSwip load failed', error instanceof Error ? error.name : 'error');
    return json({ error: 'Your homes could not load. Try again in a moment.' }, 503); }
};
export const POST: APIRoute = async ({ request }) => {
  const profile = await getSession(request);
  if (!profile) return json({ error: 'Please sign in again.' }, 401);
  if (!isSameOrigin(request)) return json({ error: 'Open ScatosSwip to make changes.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Expected JSON.' }, 415);
  let body;
  try {
    const text = await request.text();
    if (text.length > 4000) return json({ error: 'That note is too long.' }, 413);
    body = JSON.parse(text);
  } catch { return json({ error: 'That change could not be read.' }, 400); }
  if (!body || typeof body.id !== 'string' || !/^[A-Z0-9-]{4,35}$/.test(body.id)
      || !['save', 'pass', null].includes(body.decision)
      || (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 1000))) {
    return json({ error: 'Check the house and try again.' }, 400);
  }
  try {
    const sql = scatosSql();
    const rows = await sql`SELECT id FROM scatosswip.listings WHERE id=${body.id}`;
    if (!rows.length) return json({ error: 'This home is no longer in your collection.' }, 404);
    if (body.decision === null) {
      await sql`DELETE FROM scatosswip.choices WHERE profile=${profile} AND listing_id=${body.id}`;
    } else {
      const note = body.note === undefined ? null : body.note.trim();
      await sql`INSERT INTO scatosswip.choices(profile, listing_id, decision, note)
        VALUES (${profile}, ${body.id}, ${body.decision}, COALESCE(${note}, ''))
        ON CONFLICT (profile, listing_id) DO UPDATE SET decision=EXCLUDED.decision,
        note=COALESCE(${note}, scatosswip.choices.note), updated_at=now()`;
    }
    return json(await getState(profile));
  } catch (error) {
    console.error('ScatosSwip save failed', error instanceof Error ? error.name : 'error');
    return json({ error: 'That change wasn’t saved. Please try again.' }, 503);
  }
};
