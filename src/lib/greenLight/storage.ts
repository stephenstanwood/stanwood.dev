import type { StoredProfile, DietaryConstraints, QuizAnswer, TasteProfile } from "./types";

const LS_KEY = "green-light:v1";
const MAX_RECENT = 5;

// CLEANUP-FLAG: safeSet() here is functionally identical to the inline save() in showSwipe/storage.ts —
// both are try-catch wrappers around localStorage.setItem(key, JSON.stringify(value)).
// Worth extracting a shared localStorage utility if a third module needs the same pattern.
function safeSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const defaultConstraints: DietaryConstraints = {
  dietary: [],
  disliked: [],
  mealSize: "filling",
};

export function loadProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredProfile;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveProfile(
  profile: TasteProfile,
  constraints: DietaryConstraints,
  quizAnswers: QuizAnswer[],
  recentRestaurants: string[] = [],
): void {
  const existing = loadProfile();
  const now = new Date().toISOString();
  const data: StoredProfile = {
    version: 1,
    profile,
    constraints,
    quizAnswers,
    recentRestaurants: existing?.recentRestaurants ?? recentRestaurants,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  safeSet(LS_KEY, data);
}

export function addRecentRestaurant(name: string): void {
  const stored = loadProfile();
  if (!stored) return;
  const normalized = name.trim();
  if (!normalized) return;
  const recent = [
    normalized,
    ...stored.recentRestaurants.filter(
      (r) => r.toLowerCase() !== normalized.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT);
  stored.recentRestaurants = recent;
  stored.updatedAt = new Date().toISOString();
  safeSet(LS_KEY, stored);
}

export function updateTasteProfile(profile: TasteProfile): void {
  const stored = loadProfile();
  if (!stored) return;
  stored.profile = profile;
  stored.updatedAt = new Date().toISOString();
  safeSet(LS_KEY, stored);
}

export function clearProfile(): void {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

const CITY_KEY = "green-light:city";

export function loadCity(): string {
  try { return localStorage.getItem(CITY_KEY) ?? ""; } catch { return ""; }
}

export function saveCity(city: string): void {
  try { localStorage.setItem(CITY_KEY, city); } catch {}
}
