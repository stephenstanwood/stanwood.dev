import { describe, expect, it } from 'vitest';
import { isEnglishVideo, normalizeLanguageCode } from './tvLanguage';

describe('normalizeLanguageCode', () => {
  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    ['ES_419', 'es'],
    [' pt-BR ', 'pt'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeLanguageCode(input)).toBe(expected);
  });

  it.each([null, undefined, '', '   ', 42])('returns null for %p', (input) => {
    expect(normalizeLanguageCode(input)).toBeNull();
  });
});

describe('isEnglishVideo', () => {
  it.each(['en', 'en-US', 'en_GB'])('accepts %s', (language) => {
    expect(isEnglishVideo({ language })).toBe(true);
  });

  it.each(['ja', 'ru', 'pt-BR', 'es-419', 'tr', 'it', 'fr'])('rejects %s', (language) => {
    expect(isEnglishVideo({ language })).toBe(false);
  });

  it('falls back to raw YouTube language fields', () => {
    expect(isEnglishVideo({ default_audio_language: 'en-US' })).toBe(true);
    expect(isEnglishVideo({ default_language: 'ja' })).toBe(false);
  });

  it('fails closed when language metadata is missing', () => {
    expect(isEnglishVideo({})).toBe(false);
  });
});
