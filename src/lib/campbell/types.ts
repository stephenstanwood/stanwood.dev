export interface DigestSummary {
  meetingDate: string;
  title: string;
  summary: string;
  keyTopics: string[];
  nextMeeting: string | null;
  sourceUrl: string;
  generatedAt: string;
}

export type Section =
  | "links"
  | "history"
  | "digest"
  | "safety"
  | "events"
  | "businesses"
  | "homes"
  | "data";
