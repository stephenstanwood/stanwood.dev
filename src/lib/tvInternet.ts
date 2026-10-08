import { isEnglishVideo } from "./tvLanguage";
import { MS_PER_DAY } from "./time";

export interface InternetVideo {
  id: string;
  title: string;
  published_at: string;
  channel_id?: string;
  channel_handle?: string;
  channel_title: string;
  topic?: string;
  theme?: string;
  duration?: number;
  categories?: string[];
  title_categories?: string[];
  rank_score?: number;
  score?: number;
  language?: string;
  default_audio_language?: string;
  default_language?: string;
}

export const INTERNET_MAX_AGE_DAYS = 14;
export const INTERNET_MAX_PER_SOURCE = 1;
export const INTERNET_MAX_PER_TOPIC = 3;
export const INTERNET_TOPIC_CAPS: Record<string, number> = { ai_practice: 4 };
export const INTERNET_LONG_SECONDS = 60 * 60;
export const INTERNET_MAX_LONG = 3;
const INTERNET_MIN_RANK = 3;

// The nightly builder (scripts/tv-queue/selection.py) applies these same
// editorial rules; tvInternet.test.ts fails if the topic lists drift apart.
export const TOPIC_LABELS: [string, string][] = [
  ["ai_practice", "AI in practice"], ["dev_world", "dev world"], ["war_stories", "war stories"],
  ["how_it_works", "how it works"], ["software_craft", "software craft"], ["design", "design"],
  ["product", "product & startups"], ["visual_computing", "visual computing"],
  ["tech_history", "tech history"], ["public_tech", "public tech"], ["making", "builds"],
];
// Keyword categories from older editions and the builder's fallback path.
const LEGACY_TOPICS: Record<string, string> = {
  applied_ai: "ai_practice", hci: "design", war_stories: "war_stories", systems_db: "how_it_works",
  swe_craft: "software_craft", algorithms: "how_it_works", math_viz: "visual_computing",
  civic_open: "public_tech", product_craft: "product", solo_builder: "product",
  working_method: "software_craft", dev_culture: "dev_world", explainers: "how_it_works",
  tech_history: "tech_history", creative_code: "visual_computing", making: "making",
};
const DEFAULT_TOPIC = "software_craft";

const AI_TITLE_PATTERN = /\b(?:AI|LLM|GPT|Claude|Codex|Gemini|Opus|Jev|OpenJevs?|agentic|agents?)\b/i;
const TITLE_STOP_WORDS = new Set(
  "the a an to of in on for with and or how why what is are was i my your this that it we you from new build use using".split(" "),
);
const KNOWN_TOPICS = new Set(TOPIC_LABELS.map(([key]) => key));

export function sourceKey(video: InternetVideo): string {
  return (video.channel_id || video.channel_handle || video.channel_title || video.id).toLowerCase();
}

export function topicKey(video: InternetVideo): string {
  // The title leads, so an AI setup video can't dodge the AI cap by
  // masquerading as design or SaaS.
  if (AI_TITLE_PATTERN.test(video.title)) return "ai_practice";
  const topic = video.topic ? LEGACY_TOPICS[video.topic] ?? video.topic : "";
  if (KNOWN_TOPICS.has(topic)) return topic;
  const legacy = (video.title_categories ?? video.categories ?? []).find((category) => category in LEGACY_TOPICS);
  return legacy ? LEGACY_TOPICS[legacy] : DEFAULT_TOPIC;
}

export function topicLabel(video: InternetVideo): string {
  const topic = topicKey(video);
  return TOPIC_LABELS.find(([key]) => key === topic)?.[1] ?? topic;
}

/** Editor's subject tag, normalized so "Code Review" and "code-review" collide. */
export function themeKey(video: InternetVideo): string {
  return (String(video.theme ?? "").toLowerCase().match(/[a-z0-9+#]+/g) ?? []).join(" ");
}

function titleTokens(title: string): Set<string> {
  const words = title.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return new Set(words.filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word)));
}

export function similarTitles(firstTitle: string, secondTitle: string): boolean {
  const firstTokens = titleTokens(firstTitle);
  const secondTokens = titleTokens(secondTitle);
  if (firstTokens.size === 0 || secondTokens.size === 0) return false;

  const sharedTokenCount = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return sharedTokenCount / Math.min(firstTokens.size, secondTokens.size) >= 0.7;
}

export function eligibleInternetVideo(video: InternetVideo, now = Date.now()): boolean {
  const ageDays = (now - Date.parse(video.published_at)) / MS_PER_DAY;
  if (!isEnglishVideo(video)) return false;
  if (!Number.isFinite(ageDays) || ageDays < -1 || ageDays > INTERNET_MAX_AGE_DAYS) {
    return false;
  }
  return (video.rank_score ?? video.score ?? 0) >= INTERNET_MIN_RANK;
}

export function canAddInternetVideo(video: InternetVideo, selected: InternetVideo[], now = Date.now()): boolean {
  if (!eligibleInternetVideo(video, now)) return false;

  const theme = themeKey(video);
  const repeatsSelection = selected.some((pick) => {
    if (pick.id === video.id) return true;
    if (sourceKey(pick) === sourceKey(video)) return true;
    if (theme && themeKey(pick) === theme) return true;
    return similarTitles(pick.title, video.title);
  });
  if (repeatsSelection) return false;

  if ((video.duration ?? 0) >= INTERNET_LONG_SECONDS) {
    const longCount = selected.filter((pick) => (pick.duration ?? 0) >= INTERNET_LONG_SECONDS).length;
    if (longCount >= INTERNET_MAX_LONG) return false;
  }

  const topic = topicKey(video);
  const topicCount = selected.filter((pick) => topicKey(pick) === topic).length;
  return topicCount < (INTERNET_TOPIC_CAPS[topic] ?? INTERNET_MAX_PER_TOPIC);
}

/** Preserve the pipeline's cooldown-aware order; refills obey identical hard caps. */
export function chooseInternetPicks<T extends InternetVideo>(items: T[], count: number, now = Date.now()): T[] {
  const selected: T[] = [];
  for (const video of items) {
    if (!canAddInternetVideo(video, selected, now)) continue;
    selected.push(video);
    if (selected.length >= count) break;
  }
  return selected;
}
