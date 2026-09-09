import type { APIRoute } from 'astro';
import { getSession, isSameOrigin } from '../../../lib/scatos/auth';
import { getState, scatosSql } from '../../../lib/scatos/db';

export const prerender = false;

/** ScatosSwip responses are per-household and must never be cached or indexed. */
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });

const MAX_BODY_CHARS = 4000;
const MAX_NOTE_CHARS = 1000;
const LISTING_ID = /^[A-Z0-9-]{4,35}$/;

interface ChoiceUpdate {
  id: string;
  decision: 'save' | 'pass' | null;
  note?: string;
}

/** Narrow an untrusted JSON body to a choice update, or null when it doesn't fit. */
function parseChoiceUpdate(body: unknown): ChoiceUpdate | null {
  if (!body || typeof body !== 'object') return null;
  const { id, decision, note } = body as Record<string, unknown>;
  if (typeof id !== 'string' || !LISTING_ID.test(id)) return null;
  if (decision !== 'save' && decision !== 'pass' && decision !== null) return null;
  if (note !== undefined && (typeof note !== 'string' || note.length > MAX_NOTE_CHARS)) return null;
  return { id, decision, note: note as string | undefined };
}

/** Log the error class only — listing rows and notes are private household data. */
function logFailure(what: string, error: unknown) {
  console.error(what, error instanceof Error ? error.name : 'error');
}

export const GET: APIRoute = async ({ request }) => {
  const profile = await getSession(request);
  if (!profile) return json({ error: 'Please sign in again.' }, 401);

  try {
    return json(await getState(profile));
  } catch (error) {
    logFailure('ScatosSwip load failed', error);
    return json({ error: 'Your homes could not load. Try again in a moment.' }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const profile = await getSession(request);
  if (!profile) return json({ error: 'Please sign in again.' }, 401);
  if (!isSameOrigin(request)) return json({ error: 'Open ScatosSwipe to make changes.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'Expected JSON.' }, 415);
  }

  let parsed: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return json({ error: 'That note is too long.' }, 413);
    parsed = JSON.parse(text);
  } catch {
    return json({ error: 'That change could not be read.' }, 400);
  }

  const update = parseChoiceUpdate(parsed);
  if (!update) return json({ error: 'Check the house and try again.' }, 400);

  try {
    const sql = scatosSql();
    const rows = await sql`SELECT id FROM scatosswip.listings WHERE id=${update.id}`;
    if (!rows.length) return json({ error: 'This home is no longer in your collection.' }, 404);

    if (update.decision === null) {
      await sql`DELETE FROM scatosswip.choices WHERE profile=${profile} AND listing_id=${update.id}`;
    } else {
      // An absent note leaves any existing one in place; an empty string clears it.
      const note = update.note === undefined ? null : update.note.trim();
      await sql`INSERT INTO scatosswip.choices(profile, listing_id, decision, note)
        VALUES (${profile}, ${update.id}, ${update.decision}, COALESCE(${note}, ''))
        ON CONFLICT (profile, listing_id) DO UPDATE SET decision=EXCLUDED.decision,
        note=COALESCE(${note}, scatosswip.choices.note), updated_at=now()`;
    }

    return json(await getState(profile));
  } catch (error) {
    logFailure('ScatosSwip save failed', error);
    return json({ error: 'That change wasn’t saved. Please try again.' }, 503);
  }
};
