import { getLinkedInSql } from "./db";
import { summarizeLinkedInOutreach } from "./queue";
import type {
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

export async function getLinkedInTracker() {
  const sql = getLinkedInSql();
  const rows = (await sql`
    SELECT
      stable_id, kind, name, organization, title, category, category_label,
      reason, note_draft, note_needs_edit, linkedin_url, profile_url_found,
      email, source, source_order, batch, tier, flags, actioned,
      actioned_at, dismissed, dismissed_at, updated_at
    FROM linkedin_outreach_people
    WHERE source_active = true
    ORDER BY
      CASE kind WHEN 'connect' THEN 0 ELSE 1 END,
      batch ASC NULLS LAST,
      CASE tier WHEN 'A' THEN 0 WHEN 'B' THEN 1 WHEN 'C' THEN 2 ELSE 3 END,
      source_order ASC
  `) as OutreachRow[];
  const people = rows.map(rowToPerson);
  return { people, summary: summarizeLinkedInOutreach(people) };
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
      WHERE stable_id = ${stableId} AND source_active = true
    )
    UPDATE linkedin_outreach_people AS person
    SET actioned = ${actioned},
        actioned_at = CASE WHEN ${actioned} THEN now() ELSE NULL END,
        updated_at = now()
    FROM old
    WHERE person.stable_id = ${stableId} AND person.source_active = true
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
      WHERE stable_id = ${stableId} AND source_active = true
    )
    UPDATE linkedin_outreach_people AS person
    SET dismissed = ${dismissed},
        dismissed_at = CASE WHEN ${dismissed} THEN now() ELSE NULL END,
        updated_at = now()
    FROM old
    WHERE person.stable_id = ${stableId} AND person.source_active = true
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
  return { updated: true, previousValue };
}
