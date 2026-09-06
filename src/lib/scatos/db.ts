import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { Choice, FeedInfo, Home, Profile, ScatosState } from './types';
import { isInSearchArea } from './location';

let client: NeonQueryFunction<false, false> | undefined;
export function scatosSql() {
  const url = import.meta.env.SCATOS_DATABASE_URL || process.env.SCATOS_DATABASE_URL;
  if (!url) throw new Error('ScatosSwip storage is not configured');
  return client ??= neon(url);
}
export async function getState(profile: Profile): Promise<ScatosState> {
  const sql = scatosSql();
  const [homes, choices, matches, meta] = await sql.transaction([
    sql`SELECT l.data || jsonb_build_object('status', CASE WHEN l.active AND l.last_seen > now() - interval '72 hours' THEN 'active' ELSE 'archived' END, 'firstSeen', l.first_seen, 'previousPrice', l.previous_price) AS home
        FROM scatosswip.listings l
        WHERE (l.active AND l.last_seen > now() - interval '72 hours')
          OR EXISTS (SELECT 1 FROM scatosswip.choices c WHERE c.listing_id=l.id AND c.profile=${profile} AND c.decision='save')
        ORDER BY (l.data->>'score')::numeric DESC, (l.data->>'townMiles')::numeric, l.id`,
    sql`SELECT listing_id AS id, decision, note, updated_at AS "updatedAt" FROM scatosswip.choices WHERE profile=${profile}`,
    sql`SELECT listing_id AS id FROM scatosswip.choices WHERE decision='save' GROUP BY listing_id HAVING count(DISTINCT profile)=2`,
    sql`SELECT data FROM scatosswip.meta WHERE id='feed'`,
  ]);
  // Apply changed household boundaries immediately, even before the next
  // collector run. Stored saves and notes remain intact if preferences change.
  const visibleHomes = homes.map(row => row.home as Home).filter(isInSearchArea);
  const visibleIds = new Set(visibleHomes.map(home => home.id));
  return { profile, homes: visibleHomes, choices: choices as Choice[],
    matches: matches.map(row => String(row.id)).filter(id => visibleIds.has(id)), feed: (meta[0]?.data as FeedInfo) || null };
}
