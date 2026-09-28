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
export function sourceKey(v: InternetVideo): string { return (v.channel_id || v.channel_handle || v.channel_title || v.id).toLowerCase(); }
export function topicKey(v: InternetVideo): string {
  if (/\b(?:AI|LLM|GPT|Claude|Codex|Gemini|Opus|Jev|OpenJevs?|agentic|agents?)\b/i.test(v.title) || v.title_categories?.includes("applied_ai")) return "applied_ai";
  if (v.topic) return v.topic;
  const cats = v.title_categories ?? v.categories;
  return TOPIC_LABELS.find(([cat]) => cats?.includes(cat))?.[0] ?? "working_method";
}
export function topicLabel(v: InternetVideo): string { return TOPIC_LABELS.find(([key]) => key === topicKey(v))?.[1] ?? "working method"; }
const STOP = new Set("the a an to of in on for with and or how why what is are was i my your this that it we you from new build use using".split(" "));
export function similarTitles(a: string, b: string): boolean {
  const tokens = (title: string) => new Set((title.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(s => s.length > 2 && !STOP.has(s)));
  const aa = tokens(a), bb = tokens(b);
  return aa.size > 0 && bb.size > 0 && [...aa].filter(t => bb.has(t)).length / Math.min(aa.size, bb.size) >= 0.7;
}
export function eligibleInternetVideo(v: InternetVideo, now = Date.now()): boolean {
  const age = (now - Date.parse(v.published_at)) / 86_400_000;
  return isEnglishVideo(v) && Number.isFinite(age) && age >= -1 && age <= INTERNET_MAX_AGE_DAYS && (v.rank_score ?? v.score ?? 0) >= 3;
}
export function canAddInternetVideo(v: InternetVideo, selected: InternetVideo[], now = Date.now()): boolean {
  return eligibleInternetVideo(v, now) && !selected.some(p => p.id === v.id || sourceKey(p) === sourceKey(v) || similarTitles(p.title, v.title)) &&
    selected.filter(p => topicKey(p) === topicKey(v)).length < INTERNET_MAX_PER_TOPIC;
}
/** Preserve the pipeline's cooldown-aware order; refills obey identical hard caps. */
export function chooseInternetPicks<T extends InternetVideo>(items: T[], count: number, now = Date.now()): T[] {
  const selected: T[] = [];
  for (const v of items) {
    if (!canAddInternetVideo(v, selected, now)) continue;
    selected.push(v);
    if (selected.length >= count) break;
  }
  return selected;
}
