#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
const url = process.env.SCATOS_DATABASE_URL;
if (!url) throw new Error('SCATOS_DATABASE_URL is required');
const sql = neon(url);
const args = process.argv.slice(2);
if (args[0] === '--init') {
  const statements = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8').split(';').map(s => s.trim()).filter(Boolean);
  await sql.transaction(statements.map(statement => sql.query(statement)));
  console.log('ScatosSwip schema ready.');
} else if (args[0] === '--failure') {
  await sql`UPDATE scatosswip.meta SET data=data || ${JSON.stringify({ lastAttemptAt: new Date().toISOString(), lastError: 'The morning refresh failed. Showing the last verified homes.' })}::jsonb WHERE id='feed'`;
  console.log('Refresh failure recorded; verified data retained.');
} else {
  const feed = JSON.parse(readFileSync(args[0], 'utf8'));
  if (feed.version !== 1 || !Array.isArray(feed.listings) || !feed.listings.length
      || !Number.isFinite(Date.parse(feed.generatedAt)) || Math.abs(Date.now() - Date.parse(feed.generatedAt)) > 24 * 3600_000) throw new Error('Invalid or stale feed');
  const ids = new Set();
  for (const home of feed.listings) {
    if (!/^[A-Z0-9-]{4,35}$/.test(home.id) || ids.has(home.id) || home.city !== 'Los Gatos'
        || home.status !== 'Active' || home.propertyType !== 'Single Family Residence'
        || !Number.isFinite(home.price) || home.price <= 0 || home.price > 4_000_000
        || home.beds < 4 || home.baths < 2 || home.schools?.high !== 'Los Gatos High School'
        || !home.schools?.highSource?.startsWith('https://los-gatos-saratoga-union-high.schoolexplorerapp.com/GeoData/AnalyzeLocation?')
        || !/^[a-f0-9]{64}$/.test(home.schools?.boundaryHash || '')
        || home.checkedAt !== feed.generatedAt || home.schools.verifiedAt !== feed.generatedAt) throw new Error('Ineligible home: ' + home.id);
    ids.add(home.id);
  }
  const queries = [];
  for (const home of feed.listings) {
    queries.push(sql`INSERT INTO scatosswip.listings(id,data,last_seen) VALUES (${home.id},${JSON.stringify(home)}::jsonb,${feed.generatedAt})
      ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data,active=true,last_seen=EXCLUDED.last_seen,
      previous_price=CASE WHEN (scatosswip.listings.data->>'price')::numeric <> (EXCLUDED.data->>'price')::numeric
        THEN (scatosswip.listings.data->>'price')::numeric ELSE scatosswip.listings.previous_price END`);
    queries.push(sql`INSERT INTO scatosswip.price_history(listing_id,price,observed_at)
      SELECT ${home.id},${home.price},${feed.generatedAt} WHERE NOT EXISTS
      (SELECT 1 FROM scatosswip.price_history WHERE listing_id=${home.id} AND price=${home.price}
       AND observed_at=(SELECT max(observed_at) FROM scatosswip.price_history WHERE listing_id=${home.id}))
      ON CONFLICT DO NOTHING`);
  }
  // Partial source failures never archive homes. Stale records age out of the
  // active deck after 72h while saved examples remain in the private collection.
  if (feed.complete) queries.push(sql`UPDATE scatosswip.listings SET active=false WHERE NOT (id=ANY(${[...ids]}::text[]))`);
  const meta = { ...feed, listings: undefined, errors: undefined, lastAttemptAt: new Date().toISOString(),
    lastError: feed.complete ? null : 'Some sources could not be checked. The last verified homes are preserved.' };
  queries.push(sql`INSERT INTO scatosswip.meta(id,data) VALUES ('feed',${JSON.stringify(meta)}::jsonb)
    ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data`);
  await sql.transaction(queries);
  const receipt = { publishedAt: new Date().toISOString(), generatedAt: feed.generatedAt, count: ids.size, complete: feed.complete };
  if (args[1]) writeFileSync(args[1], JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt));
}
