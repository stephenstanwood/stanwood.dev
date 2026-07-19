import { getLinkedInSql } from "./db";
import {
  LINKEDIN_DAILY_BATCH_SIZE,
  nextLinkedInDailyBatch,
  summarizeLinkedInOutreach,
} from "./queue";
import type {
  LinkedInDailyBatch,
  LinkedInOutreachKind,
  LinkedInOutreachPerson,
  LinkedInOutreachTier,
} from "./types";

interface OutreachRow {
  stable_id: string;
  kind: LinkedInOutreachKind;
  name: string;
  organization: string;
  title: string;
  category: string;
  category_label: string;
  reason: string;
  note_draft: string | null;
  note_needs_edit: boolean;
  linkedin_url: string;
  profile_url_found: boolean;
  email: string | null;
  source: string;
  source_order: number;
  batch: number | null;
  tier: LinkedInOutreachTier | null;
  flags: unknown;
  actioned: boolean;
  actioned_at: Date | string | null;
  dismissed: boolean;
  dismissed_at: Date | string | null;
  updated_at: Date | string;
}

function iso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function rowToPerson(row: OutreachRow): LinkedInOutreachPerson {
  return {
    stableId: row.stable_id,
    kind: row.kind,
    name: row.name,
    organization: row.organization,
    title: row.title,
    category: row.category,
    categoryLabel: row.category_label,
    reason: row.reason,
    noteDraft: row.note_draft,
    noteNeedsEdit: row.note_needs_edit,
    linkedinUrl: row.linkedin_url,
    profileUrlFound: row.profile_url_found,
    email: row.email,
    source: row.source,
    sourceOrder: row.source_order,
    batch: row.batch,
    tier: row.tier,
    flags: Array.isArray(row.flags)
      ? row.flags.filter((flag): flag is string => typeof flag === "string")
      : [],
    actioned: row.actioned,
    actionedAt: iso(row.actioned_at),
    dismissed: row.dismissed,
    dismissedAt: iso(row.dismissed_at),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString(),
  };
}

interface DailyBatchRow {
  stable_id: string;
  position: number;
}

const PEOPLE_REFILL_AT = 100;
const PEOPLE_TARGET = 200;
const ORGANIZATION_REFILL_AT = 50;
const ORGANIZATION_TARGET = 100;

async function refillLinkedInDiscoveryPiles(trigger: string): Promise<void> {
  const sql = getLinkedInSql();
  const [{ people_remaining: peopleRemaining, organizations_remaining: organizationsRemaining }] =
    (await sql`
      SELECT
        count(*) FILTER (
          WHERE kind IN ('connect', 'follow')
            AND (kind <> 'connect' OR category <> 'unknown')
            AND source_active = true
            AND initial_dismissed = false
            AND actioned = false
            AND dismissed = false
        )::int AS people_remaining,
        count(*) FILTER (
          WHERE kind = 'organization'
            AND source_active = true
            AND initial_dismissed = false
            AND actioned = false
            AND dismissed = false
        )::int AS organizations_remaining
      FROM linkedin_outreach_people
    `) as Array<{ people_remaining: number; organizations_remaining: number }>;

  const peopleLimit = peopleRemaining < PEOPLE_REFILL_AT
    ? PEOPLE_TARGET - peopleRemaining
    : 0;
  const organizationLimit = organizationsRemaining < ORGANIZATION_REFILL_AT
    ? ORGANIZATION_TARGET - organizationsRemaining
    : 0;
  if (peopleLimit === 0 && organizationLimit === 0) return;

  async function promote(kinds: Array<"follow" | "organization">, limit: number) {
    if (limit === 0) return [] as Array<{ stable_id: string }>;
    return (await sql`
      WITH category_feedback AS (
        SELECT
          category,
          count(*) FILTER (WHERE actioned = true AND dismissed = false)::int AS actioned,
          count(*) FILTER (WHERE dismissed = true)::int AS dismissed
        FROM linkedin_outreach_people
        WHERE kind = ANY(${kinds})
        GROUP BY category
      ), ranked AS (
        SELECT
          candidate.*,
          candidate.base_score
            + LEAST(30, COALESCE(feedback.actioned, 0) * 5)
            - LEAST(30, COALESCE(feedback.dismissed, 0) * 4)
            + CASE WHEN EXISTS (
                SELECT 1 FROM linkedin_outreach_people AS connection
                WHERE connection.kind = 'connect'
                  AND connection.actioned = true
                  AND connection.dismissed = false
                  AND lower(connection.organization) = lower(candidate.name)
              ) THEN 24 ELSE 0 END AS learned_score
        FROM linkedin_outreach_discovery_candidates AS candidate
        LEFT JOIN category_feedback AS feedback USING (category)
        WHERE candidate.source_active = true
          AND candidate.kind = ANY(${kinds})
          AND NOT EXISTS (
            SELECT 1 FROM linkedin_outreach_people AS person
            WHERE person.kind = candidate.kind
              AND person.normalized_name = candidate.normalized_name
          )
        ORDER BY learned_score DESC, candidate.source_order ASC, candidate.name ASC
        LIMIT ${limit}
      )
      INSERT INTO linkedin_outreach_people (
        stable_id, kind, normalized_name, name, organization, title,
        category, category_label, reason, note_prompt, note_draft,
        note_needs_edit, linkedin_url, profile_url_found, email, source,
        source_order, batch, tier, flags, initial_dismissed, source_digest,
        source_active, actioned, dismissed, updated_at
      )
      SELECT
        ranked.stable_id, ranked.kind, ranked.normalized_name, ranked.name,
        ranked.organization, ranked.title, ranked.category,
        ranked.category_label, ranked.reason, NULL, NULL, false,
        ranked.linkedin_url, ranked.profile_url_found, NULL, ranked.source,
        ranked.source_order, NULL, NULL, ranked.flags, false,
        ranked.source_digest, true, false, false, now()
      FROM ranked
      ON CONFLICT DO NOTHING
      RETURNING stable_id
    `) as Array<{ stable_id: string }>;
  }

  const peopleInserted = await promote(["follow"], peopleLimit);
  const organizationsInserted = await promote(["organization"], organizationLimit);
  const peopleAfter = peopleRemaining + peopleInserted.length;
  const organizationsAfter = organizationsRemaining + organizationsInserted.length;
  const [{ available }] = (await sql`
    SELECT count(*)::int AS available
    FROM linkedin_outreach_discovery_candidates AS candidate
    WHERE candidate.source_active = true
      AND NOT EXISTS (
        SELECT 1 FROM linkedin_outreach_people AS person
        WHERE person.kind = candidate.kind
          AND person.normalized_name = candidate.normalized_name
      )
  `) as Array<{ available: number }>;
  await sql`
    INSERT INTO linkedin_outreach_refresh_runs (
      trigger, remaining_before, candidates_available, inserted,
      remaining_after, details
    ) VALUES (
      ${trigger}, ${peopleRemaining}, ${available},
      ${peopleInserted.length + organizationsInserted.length}, ${peopleAfter},
      ${JSON.stringify({
        peopleInserted: peopleInserted.length,
        peopleThreshold: PEOPLE_REFILL_AT,
        peopleTarget: PEOPLE_TARGET,
        organizationsBefore: organizationsRemaining,
        organizationsInserted: organizationsInserted.length,
        organizationsAfter,
        organizationThreshold: ORGANIZATION_REFILL_AT,
        organizationTarget: ORGANIZATION_TARGET,
      })}::jsonb
    )
  `;
}

async function getOrCreateLinkedInDailyBatch(
  people: LinkedInOutreachPerson[],
): Promise<LinkedInDailyBatch> {
  const sql = getLinkedInSql();
  await sql`
    CREATE TABLE IF NOT EXISTS linkedin_outreach_daily_batch (
      batch_date date NOT NULL,
      stable_id text NOT NULL,
      position integer NOT NULL CHECK (position > 0),
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (batch_date, stable_id),
      UNIQUE (batch_date, position)
    )
  `;

  const [{ batch_date: batchDate }] = (await sql`
    SELECT ((now() AT TIME ZONE 'America/Los_Angeles')::date)::text AS batch_date
  `) as Array<{ batch_date: string }>;

  let rows = (await sql`
    SELECT stable_id, position
    FROM linkedin_outreach_daily_batch
    WHERE batch_date = CAST(${batchDate} AS date)
    ORDER BY position ASC
  `) as DailyBatchRow[];

  if (rows.length === 0) {
    const candidates = nextLinkedInDailyBatch(people);
    if (candidates.length > 0) {
      const payload = JSON.stringify(candidates.map((person, index) => ({
        stable_id: person.stableId,
        position: index + 1,
      })));
      await sql`
        INSERT INTO linkedin_outreach_daily_batch (batch_date, stable_id, position)
        SELECT CAST(${batchDate} AS date), item.stable_id, item.position
        FROM json_to_recordset(CAST(${payload} AS json))
          AS item(stable_id text, position integer)
        WHERE NOT EXISTS (
          SELECT 1
          FROM linkedin_outreach_daily_batch
          WHERE batch_date = CAST(${batchDate} AS date)
        )
        ON CONFLICT DO NOTHING
      `;
      rows = (await sql`
        SELECT stable_id, position
        FROM linkedin_outreach_daily_batch
        WHERE batch_date = CAST(${batchDate} AS date)
        ORDER BY position ASC
      `) as DailyBatchRow[];
    }
  }

  return {
    date: batchDate,
    stableIds: rows.map((row) => row.stable_id),
    targetSize: LINKEDIN_DAILY_BATCH_SIZE,
  };
}

export async function getLinkedInTracker() {
  const sql = getLinkedInSql();
  await refillLinkedInDiscoveryPiles("tracker-load");
  const rows = (await sql`
    SELECT
      stable_id, kind, name, organization, title, category, category_label,
      reason, note_draft, note_needs_edit, linkedin_url, profile_url_found,
      email, source, source_order, batch, tier, flags, actioned,
      actioned_at, dismissed, dismissed_at, updated_at
    FROM linkedin_outreach_people
    WHERE source_active = true
      AND initial_dismissed = false
    ORDER BY
      CASE kind WHEN 'connect' THEN 0 WHEN 'follow' THEN 1 ELSE 2 END,
      batch ASC NULLS LAST,
      CASE tier WHEN 'A' THEN 0 WHEN 'B' THEN 1 WHEN 'C' THEN 2 ELSE 3 END,
      source_order ASC
  `) as OutreachRow[];
  const people = rows.map(rowToPerson);
  const dailyBatch = await getOrCreateLinkedInDailyBatch(people);
  return { people, dailyBatch, summary: summarizeLinkedInOutreach(people) };
}

interface MutationResult {
  updated: boolean;
  previousValue?: boolean;
}

export async function setLinkedInActioned(
  stableId: string,
  actioned: boolean,
): Promise<MutationResult> {
  const sql = getLinkedInSql();
  const rows = (await sql`
    WITH old AS (
      SELECT actioned FROM linkedin_outreach_people
      WHERE stable_id = ${stableId} AND source_active = true AND initial_dismissed = false
    )
    UPDATE linkedin_outreach_people AS person
    SET actioned = ${actioned},
        actioned_at = CASE WHEN ${actioned} THEN now() ELSE NULL END,
        updated_at = now()
    FROM old
    WHERE person.stable_id = ${stableId}
      AND person.source_active = true
      AND person.initial_dismissed = false
    RETURNING old.actioned AS previous_value
  `) as Array<{ previous_value: boolean }>;
  if (rows.length === 0) return { updated: false };
  const previousValue = rows[0].previous_value;
  if (previousValue !== actioned) {
    await sql`
      INSERT INTO linkedin_outreach_audit (stable_id, action, previous_value, new_value)
      VALUES (${stableId}, ${actioned ? "actioned" : "unactioned"}, ${previousValue}, ${actioned})
    `;
  }
  await refillLinkedInDiscoveryPiles("action-mutation");
  return { updated: true, previousValue };
}

export async function setLinkedInDismissed(
  stableId: string,
  dismissed: boolean,
): Promise<MutationResult> {
  const sql = getLinkedInSql();
  const rows = (await sql`
    WITH old AS (
      SELECT dismissed FROM linkedin_outreach_people
      WHERE stable_id = ${stableId} AND source_active = true AND initial_dismissed = false
    )
    UPDATE linkedin_outreach_people AS person
    SET dismissed = ${dismissed},
        dismissed_at = CASE WHEN ${dismissed} THEN now() ELSE NULL END,
        updated_at = now()
    FROM old
    WHERE person.stable_id = ${stableId}
      AND person.source_active = true
      AND person.initial_dismissed = false
    RETURNING old.dismissed AS previous_value
  `) as Array<{ previous_value: boolean }>;
  if (rows.length === 0) return { updated: false };
  const previousValue = rows[0].previous_value;
  if (previousValue !== dismissed) {
    await sql`
      INSERT INTO linkedin_outreach_audit (stable_id, action, previous_value, new_value)
      VALUES (${stableId}, ${dismissed ? "dismissed" : "restored"}, ${previousValue}, ${dismissed})
    `;
  }
  await refillLinkedInDiscoveryPiles("dismiss-mutation");
  return { updated: true, previousValue };
}
