export type WeirdnessMode = "client-safe" | "designer" | "alternate-timeline";
export const VALID_MODES: WeirdnessMode[] = [
  "client-safe",
  "designer",
  "alternate-timeline",
];

export interface SiteAnalysis {
  siteType: string;
  currentAesthetic: string;
  fontVibe: string;
  colorVibe: string;
  toneTag: string;
  title: string;
  description: string;
}

export interface DesignDirection {
  id: number;
  name: string;
  tagline: string;
  palette: string[];
  fontDirection: string;
  layoutNotes: string;
  artDirection: string;
  conceptHtml: string;
}

export interface MoreResponse {
  directions: DesignDirection[];
}

export type MoreModifier = "more" | "weirder" | "calmer";
