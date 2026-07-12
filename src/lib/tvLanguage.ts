export interface LanguageTaggedVideo {
  language?: string | null;
  default_audio_language?: string | null;
  default_language?: string | null;
}

export function normalizeLanguageCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized.split(/[-_]/, 1)[0] || null;
}

/**
 * Discovery is fail-closed: the nightly builder must attach an explicit
 * language tag, and only English inventory can reach /tv.
 */
export function isEnglishVideo(video: LanguageTaggedVideo): boolean {
  const language = normalizeLanguageCode(
    video.language ?? video.default_audio_language ?? video.default_language,
  );
  return language === 'en';
}
