export interface DigestSummary {
  meetingDate: string;
  title: string;
  summary: string;
  keyTopics: string[];
  nextMeeting: string | null;
  sourceUrl: string;
  generatedAt: string;
}

export interface CampbellCouncilRecord {
  date: string;
  title: string;
  body?: string;
  agendaUrl: string;
  agendaHtmlUrl?: string;
  minutesUrl?: string;
  mediaUrl?: string;
  meetingUrl?: string;
}

export function isRegularCouncilSession(record: Pick<CampbellCouncilRecord, "title">) {
  return /\bregular session\b/i.test(record.title);
}

export function preferredCouncilRecord<T extends Pick<CampbellCouncilRecord, "title">>(records: T[]) {
  return records.find(isRegularCouncilSession) ?? records[0];
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
