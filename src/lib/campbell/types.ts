export interface DigestSummary {
  meetingDate: string;
  title: string;
  summary: string;
  keyTopics: string[];
  nextMeeting: string | null;
  sourceUrl: string;
  generatedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  category: string;
  ageGroup: string;
  days: string;
  time: string;
  location: string;
  fee: string;
  registrationUrl: string | null;
  description: string;
}

export type Section = "links" | "digest" | "activities" | "eat" | "data";
