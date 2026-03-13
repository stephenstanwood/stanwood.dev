import type { Activity } from "../data/kidwindow-activities";

export type WeatherFilter = "shine" | "rain";
export type CostFilter = "free" | "paid" | "either";
export type EnergyFilter = "easy" | "normal" | "adventure";
export type TimingFilter = "now" | "90min" | "morning" | "afternoon";
export type StrollerFilter = "yes" | "any";

export interface Filters {
  weather: WeatherFilter;
  cost: CostFilter;
  energy: EnergyFilter;
  timing: TimingFilter;
  stroller: StrollerFilter;
}

export const DEFAULT_FILTERS: Filters = {
  weather: "shine",
  cost: "either",
  energy: "normal",
  timing: "now",
  stroller: "any",
};

interface ScoredActivity {
  activity: Activity;
  score: number;
  reason: string;
}

function getTimingTags(timing: TimingFilter): string[] {
  switch (timing) {
    case "now":
      return ["anytime", "quick"];
    case "90min":
      return ["anytime", "quick", "morning", "afternoon"];
    case "morning":
      return ["morning", "anytime"];
    case "afternoon":
      return ["afternoon", "anytime"];
  }
}

export function scoreActivities(
  activities: Activity[],
  filters: Filters,
): ScoredActivity[] {
  const timingTags = getTimingTags(filters.timing);

  const scored: ScoredActivity[] = activities.map((activity) => {
    let score = 50; // base score
    const reasons: string[] = [];

    // Weather match (strong signal)
    if (activity.rainOrShine === "both") {
      score += 15;
    } else if (
      (filters.weather === "rain" && activity.rainOrShine === "rain") ||
      (filters.weather === "shine" && activity.rainOrShine === "shine")
    ) {
      score += 20;
    } else {
      // Wrong weather — heavy penalty
      score -= 40;
    }

    // Cost match
    if (filters.cost !== "either") {
      if (activity.cost === filters.cost) {
        score += 10;
        reasons.push(filters.cost === "free" ? "Free" : "Worth the cost");
      } else {
        score -= 15;
      }
    }

    // Energy match
    if (activity.energy === filters.energy) {
      score += 15;
      if (filters.energy === "easy") reasons.push("low-lift");
      if (filters.energy === "adventure") reasons.push("good energy burn");
    } else {
      // Adjacent energy levels get a small penalty, opposite gets more
      const energyLevels = ["easy", "normal", "adventure"];
      const diff = Math.abs(
        energyLevels.indexOf(activity.energy) -
          energyLevels.indexOf(filters.energy),
      );
      score -= diff * 8;
    }

    // Timing match
    const timingOverlap = activity.timing.filter((t) =>
      timingTags.includes(t),
    );
    if (timingOverlap.length > 0) {
      score += 10 + timingOverlap.length * 3;
    } else {
      score -= 10;
    }

    // Quick activities get a boost for "now" and "90min"
    if (
      (filters.timing === "now" || filters.timing === "90min") &&
      activity.timing.includes("quick")
    ) {
      score += 5;
    }

    // Duration fit for 90-min window
    if (filters.timing === "90min" || filters.timing === "now") {
      if (activity.durationMinutes && activity.durationMinutes <= 60) {
        score += 5;
      } else if (activity.durationMinutes && activity.durationMinutes > 90) {
        score -= 5;
      }
    }

    // Stroller match
    if (filters.stroller === "yes") {
      if (activity.strollerFriendly) {
        score += 10;
        reasons.push("stroller-friendly");
      } else {
        score -= 20;
      }
    }

    // Indoor/outdoor alignment with weather
    if (filters.weather === "rain" && activity.indoorOutdoor === "indoor") {
      score += 8;
      reasons.push("indoor");
    }
    if (filters.weather === "shine" && activity.indoorOutdoor === "outdoor") {
      score += 5;
    }

    // Low-lift bonus for easy energy
    if (filters.energy === "easy" && activity.lowLift) {
      score += 8;
    }

    // Toddler focus slight boost
    if (activity.ageRange === "toddler" || activity.ageRange === "both") {
      score += 3;
    }

    // Build reason string
    let reason = "";
    if (score >= 80) {
      reason = buildStrongReason(activity, filters, reasons);
    } else if (score >= 60) {
      reason = buildDecentReason(activity, filters, reasons);
    } else {
      reason = buildFallbackReason(activity, reasons);
    }

    return { activity, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function buildStrongReason(
  activity: Activity,
  filters: Filters,
  tags: string[],
): string {
  const parts: string[] = [];

  if (activity.indoorOutdoor === "indoor" && filters.weather === "rain") {
    parts.push("Indoor");
  }

  if (activity.energy === "easy") parts.push("easy");
  else if (activity.energy === "adventure") parts.push("active");

  if (activity.cost === "free") parts.push("free");

  if (tags.includes("stroller-friendly")) parts.push("stroller-friendly");

  if (activity.lowLift) parts.push("low-lift");

  if (parts.length === 0) {
    return pickGenericReason(activity, filters);
  }

  const joined = parts.slice(0, 3).join(", ");
  return `${capitalize(joined)}${pickReasonTail(activity, filters)}`;
}

function buildDecentReason(
  activity: Activity,
  filters: Filters,
  tags: string[],
): string {
  if (activity.cost === "free" && activity.strollerFriendly) {
    return `Free and stroller-friendly${pickReasonTail(activity, filters)}`;
  }
  if (activity.lowLift) {
    return `Low-lift option${pickReasonTail(activity, filters)}`;
  }
  if (tags.length > 0) {
    return `${capitalize(tags[0])}${pickReasonTail(activity, filters)}`;
  }
  return pickGenericReason(activity, filters);
}

function buildFallbackReason(activity: Activity, tags: string[]): string {
  if (activity.backupOption) return "A solid backup if nothing else clicks.";
  if (tags.length > 0) return capitalize(tags[0]) + " — not a perfect match but still doable.";
  return "Not an exact match but still worth considering.";
}

function pickReasonTail(activity: Activity, filters: Filters): string {
  if (filters.weather === "rain" && activity.indoorOutdoor === "indoor") {
    return " if the weather is gross.";
  }
  if (filters.energy === "easy") {
    return " if you want something low-key.";
  }
  if (filters.energy === "adventure") {
    return " — good way to burn some energy.";
  }
  if (
    filters.timing === "now" ||
    (filters.timing === "90min" &&
      activity.durationMinutes &&
      activity.durationMinutes <= 60)
  ) {
    return " if you only have a short window.";
  }
  return ".";
}

function pickGenericReason(activity: Activity, filters: Filters): string {
  if (filters.weather === "rain") {
    return "A solid option when it's raining.";
  }
  if (activity.energy === "adventure") {
    return "Good energy burn for a bigger outing.";
  }
  if (activity.bestWithSnack) {
    return "Better with snacks packed.";
  }
  return "A solid toddler-hour move.";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getRandomActivity(
  activities: Activity[],
  filters: Filters,
): ScoredActivity | null {
  const scored = scoreActivities(activities, filters);
  const viable = scored.filter((s) => s.score >= 50);
  if (viable.length === 0) return scored[0] ?? null;
  return viable[Math.floor(Math.random() * viable.length)];
}
