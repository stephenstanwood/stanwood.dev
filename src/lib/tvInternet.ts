import { isEnglishVideo } from "./tvLanguage";
export interface InternetVideo {
  id: string; title: string; published_at: string;
  channel_id?: string; channel_handle?: string; channel_title: string;
  topic?: string; categories?: string[]; title_categories?: string[];
  rank_score?: number; score?: number; language?: string;
  default_audio_language?: string; default_language?: string;
}
export const INTERNET_MAX_AGE_DAYS = 21;
export const INTERNET_MAX_PER_SOURCE = 1;
export const INTERNET_MAX_PER_TOPIC = 3;
export const TOPIC_LABELS: [string, string][] = [
  ["hci", "design"], ["war_stories", "how it went"], ["systems_db", "systems"],
  ["swe_craft", "software craft"], ["algorithms", "computer science"], ["math_viz", "visual computing"],
  ["civic_open", "public tech"], ["product_craft", "product craft"], ["solo_builder", "independent products"],
  ["working_method", "working method"], ["applied_ai", "AI in practice"],
];
export function sourceKey(video: InternetVideo): string {
  return (video.channel_id || video.channel_handle || video.channel_title || video.id).toLowerCase();
}
export function topicKey(video: InternetVideo): string {
  if (/\b(?:AI|LLM|GPT|Claude|Codex|Gemini|Opus|Jev|OpenJevs?|agentic|agents?)\b/i.test(video.title) || video.title_categories?.includes("applied_ai")) return "applied_ai";
  if (video.topic) return video.topic;
  const categories = video.title_categories ?? video.categories;
  return TOPIC_LABELS.find(([category]) => categories?.includes(category))?.[0] ?? "working_method";
}
export function topicLabel(video: InternetVideo): string {
  return TOPIC_LABELS.find(([key]) => key === topicKey(video))?.[1] ?? "working method";
}
const STOP = new Set("the a an to of in on for with and or how why what is are was i my your this that it we you from new build use using".split(" "));
export function similarTitles(firstTitle: string, secondTitle: string): boolean {
  const tokens = (title: string) => new Set((title.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(s => s.length > 2 && !STOP.has(s)));
  const firstTokens = tokens(firstTitle), secondTokens = tokens(secondTitle);
  return firstTokens.size > 0 && secondTokens.size > 0 &&
    [...firstTokens].filter(token => secondTokens.has(token)).length / Math.min(firstTokens.size, secondTokens.size) >= 0.7;
}
export function eligibleInternetVideo(video: InternetVideo, now = Date.now()): boolean {
  const age = (now - Date.parse(video.published_at)) / 86_400_000;
  return isEnglishVideo(video) && Number.isFinite(age) && age >= -1 && age <= INTERNET_MAX_AGE_DAYS &&
    (video.rank_score ?? video.score ?? 0) >= 3;
}
export function canAddInternetVideo(video: InternetVideo, selected: InternetVideo[], now = Date.now()): boolean {
  if (!eligibleInternetVideo(video, now)) return false;
  if (selected.some(pick => pick.id === video.id || sourceKey(pick) === sourceKey(video) || similarTitles(pick.title, video.title))) {
    return false;
  }
  return selected.filter(pick => topicKey(pick) === topicKey(video)).length < INTERNET_MAX_PER_TOPIC;
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
