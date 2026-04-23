import type { StoredProfile, DietaryConstraints, QuizAnswer, TasteProfile } from "./types";
import { safeSet, safeGet, safeRemove, safeGetString, safeSetString } from "../localStorage";

const LS_KEY = "green-light:v1";
const MAX_RECENT = 5;

export const defaultConstraints: DietaryConstraints = {
  dietary: [],
  disliked: [],
  mealSize: "filling",
};

export function loadProfile(): StoredProfile | null {
  const data = safeGet<StoredProfile>(LS_KEY);
  if (!data || data.version !== 1) return null;
  return data;
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
  safeRemove(LS_KEY);
}

const CITY_KEY = "green-light:city";

export function loadCity(): string {
  return safeGetString(CITY_KEY);
}

export function saveCity(city: string): void {
  safeSetString(CITY_KEY, city);
}
