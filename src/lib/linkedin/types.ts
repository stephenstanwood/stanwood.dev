export type LinkedInOutreachKind = "connect" | "follow";
export type LinkedInOutreachTier = "A" | "B" | "C";

export interface LinkedInOutreachPerson {
  stableId: string;
  kind: LinkedInOutreachKind;
  name: string;
  organization: string;
  title: string;
  category: string;
  categoryLabel: string;
  reason: string;
  noteDraft: string | null;
  noteNeedsEdit: boolean;
  linkedinUrl: string;
  profileUrlFound: boolean;
  email: string | null;
  source: string;
  sourceOrder: number;
  batch: number | null;
  tier: LinkedInOutreachTier | null;
  flags: string[];
  actioned: boolean;
  actionedAt: string | null;
  dismissed: boolean;
  dismissedAt: string | null;
  updatedAt: string;
}

export interface LinkedInDailyBatch {
  date: string;
  stableIds: string[];
  targetSize: number;
}

export interface LinkedInOutreachSummary {
  total: number;
  active: number;
  actioned: number;
  dismissed: number;
  reviewed: number;
  remaining: number;
  connects: number;
  follows: number;
}
