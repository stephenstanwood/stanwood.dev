import type { StoredProfile, DietaryConstraints, QuizAnswer, TasteProfile } from "./types";

const LS_KEY = "green-light:v1";
const MAX_RECENT = 5;

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
  localStorage.setItem(LS_KEY, JSON.stringify(data));
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
  localStorage.setItem(LS_KEY, JSON.stringify(stored));
}

export function updateTasteProfile(profile: TasteProfile): void {
  const stored = loadProfile();
  if (!stored) return;
  stored.profile = profile;
  stored.updatedAt = new Date().toISOString();
  localStorage.setItem(LS_KEY, JSON.stringify(stored));
}

export function clearProfile(): void {
  localStorage.removeItem(LS_KEY);
}
