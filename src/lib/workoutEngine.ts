/**
 * Swim Workout Generator Engine
 *
 * Generates structured swim workouts based on:
 *  - Duration (30, 60, 90, 120 minutes)
 *  - Pace per 100 (user's comfortable pace)
 *  - Unit (meters or yards)
 *
 * Design principles:
 *  - Main set reps use round numbers (4, 5, 6, 8, 10, 12, etc.)
 *  - Warmup/cooldown pad to hit target time
 *  - Warmup/cooldown have NO rest intervals (continuous swim)
 *  - "Moderate" not "easy" throughout
 *  - Skew towards longer distances (100s–400s)
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

type Stroke = "free" | "back" | "breast" | "fly" | "IM" | "choice" | "mixed";
type Equipment = "pull" | "kickboard" | "fins";

export interface SetItem {
  reps: number;
  distance: number;
  interval?: number;
  intervalDisplay?: string | null;
  description: string;
  stroke: Stroke;
  equipment?: Equipment;
  isGroup?: boolean;
  items?: SetItem[];
}

export interface Section {
  name: string;
  items: SetItem[];
  distance: number;
}

export type WorkoutFocus = "any" | "endurance" | "speed" | "technique";

export interface WorkoutInput {
  duration: number;
  pace: string;
  unit: "meters" | "yards";
  seed?: number;
  focus?: WorkoutFocus;
}

export interface Workout {
  name: string;
  duration: number;
  pace: string;
  unit: string;
  totalDistance: number;
  estimatedMinutes: number;
  sections: Section[];
  seed?: number;
}

interface Rng {
  random: () => number;
  pick: <T>(arr: T[]) => T;
  shuffle: <T>(arr: T[]) => T[];
  int: (min: number, max: number) => number;
  chance: (p: number) => boolean;
}

// ─── Seeded RNG ────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  return {
    random: () => next(),
    pick: <T>(arr: T[]) => arr[Math.floor(next() * arr.length)],
    shuffle: <T>(arr: T[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    chance: (p: number) => next() < p,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parsePace(str: string): number {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function roundTo5(secs: number): number {
  return Math.round(secs / 5) * 5;
}

function calcInterval(distance: number, pacePer100: number, restAdder = 10): number {
  const swimTime = (distance / 100) * pacePer100;
  return roundTo5(swimTime + (distance / 100) * restAdder);
}

/** Pick the nearest "nice" rep count to a raw number */
function niceReps(raw: number): number {
  const nice = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20];
  let best = nice[0];
  let bestDiff = Infinity;
  for (const n of nice) {
    const diff = Math.abs(n - raw);
    if (diff < bestDiff) { bestDiff = diff; best = n; }
  }
  return best;
}

function calcSetDuration(set: SetItem, pacePer100: number): number {
  if (!set.reps || !set.distance) return 0;
  if (set.interval) return set.reps * set.interval;
  return set.reps * (set.distance / 100) * pacePer100;
}

function groupDistance(items: SetItem[]): number {
  return items.reduce((sum, item) => {
    if (item.items) return sum + item.reps * groupDistance(item.items);
    return sum + (item.reps || 1) * (item.distance || 0);
  }, 0);
}

function groupDuration(items: SetItem[], pacePer100: number): number {
  return items.reduce((sum, item) => {
    if (item.items) return sum + item.reps * groupDuration(item.items, pacePer100);
    return sum + calcSetDuration(item, pacePer100);
  }, 0);
}

function weightedPick<T>(items: T[], weights: number[], rng: Rng): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Target yardage by duration & pace ─────────────────────────────────────────

function calcTargetDistance(durationMin: number, paceSec: number): number {
  const utilization = durationMin <= 30 ? 0.72 : durationMin <= 60 ? 0.68 : 0.65;
  const rawDist = (durationMin * 60 * utilization) / (paceSec / 100);
  return Math.round(rawDist / 100) * 100;
}

// ─── WARMUP TEMPLATES ──────────────────────────────────────────────────────────
// NO rest intervals — warmup is continuous swimming

// Warmup always starts with 200+ plain free, then an optional second piece.
// Total warmup never exceeds 1000.

function buildWarmup(target: number, pace: number, rng: Rng): SetItem[] {
  target = Math.min(target, 1000); // cap warmup at 1000

  // Always lead with at least 200 plain free
  const freeLead = 200;
  const remaining = target - freeLead;

  // If not much room left, just do all free
  if (remaining < 200) {
    return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }

  const secondDist = Math.round(remaining / 50) * 50;

  // Pick a flavor for the second piece
  const flavor = rng.pick(["choice", "SKPS", "build", "IM", "kansas", "reverseIM", "kick", "pull", "drill"]);

  switch (flavor) {
    case "choice":
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 1, distance: secondDist, description: "Moderate choice stroke", stroke: "choice" },
      ];

    case "SKPS": {
      const leg = Math.round(secondDist / 4 / 50) * 50;
      if (leg < 50) {
        return [
          { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
          { reps: 1, distance: secondDist, description: "Moderate choice stroke", stroke: "choice" },
        ];
      }
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 1, distance: leg, description: "Swim free", stroke: "free" },
        { reps: 1, distance: leg, description: "Kick", stroke: "free", equipment: "kickboard" },
        { reps: 1, distance: leg, description: "Pull", stroke: "free", equipment: "pull" },
        { reps: 1, distance: leg, description: "Swim free", stroke: "free" },
      ];
    }

    case "build": {
      const reps = niceReps(secondDist / 100);
      const dist = Math.round(secondDist / reps / 50) * 50 || 100;
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps, distance: dist, description: "Build (moderate → fast)", stroke: "free" },
      ];
    }

    case "IM":
      if (secondDist < 200) {
        return [
          { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
          { reps: 1, distance: secondDist, description: "Moderate choice stroke", stroke: "choice" },
        ];
      }
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 4, distance: 50, description: "IM order (fly, back, breast, free)", stroke: "IM" },
      ];

    case "kansas":
      if (secondDist < 300) {
        return [
          { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
          { reps: 1, distance: secondDist, description: "Moderate choice stroke", stroke: "choice" },
        ];
      }
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 1, distance: 300, description: "Kansas (50 free, 50 back, 100 breast, 50 back, 50 free)", stroke: "mixed" },
      ];

    case "reverseIM":
      if (secondDist < 200) {
        return [
          { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
          { reps: 1, distance: secondDist, description: "Moderate choice stroke", stroke: "choice" },
        ];
      }
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 4, distance: 50, description: "Reverse IM order (free, breast, back, fly)", stroke: "IM" },
      ];

    case "kick": {
      const kickDist = Math.round(secondDist / 50) * 50;
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 1, distance: kickDist, description: "Kick — moderate, loosen up legs", stroke: "free", equipment: "kickboard" },
      ];
    }

    case "pull": {
      const pullDist = Math.round(secondDist / 50) * 50;
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps: 1, distance: pullDist, description: "Pull — easy, focus on catch", stroke: "free", equipment: "pull" },
      ];
    }

    case "drill": {
      const drillType = rng.pick(["Catch-up", "Fingertip drag", "Single-arm", "6-kick switch"]);
      const reps = niceReps(secondDist / 50);
      const dist = Math.round(secondDist / reps / 50) * 50 || 50;
      return [
        { reps: 1, distance: freeLead, description: "Moderate free", stroke: "free" },
        { reps, distance: dist, description: `${drillType} drill / swim by 25`, stroke: "free" },
      ];
    }

    default:
      return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }
}

// ─── MAIN SET TEMPLATES ────────────────────────────────────────────────────────

function mainStraight(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 200, 200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick(["Hold pace", "Steady effort", "Strong & consistent"]);
  return [{ reps, distance: dist, interval, description: `Free — ${desc}`, stroke: "free" }];
}

function mainDescend(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 150, 200]);
  const rawReps = Math.round(target / dist);
  const combos = [
    { reps: 3, group: 3 }, { reps: 4, group: 4 },
    { reps: 6, group: 3 }, { reps: 8, group: 4 },
    { reps: 9, group: 3 }, { reps: 12, group: 3 },
    { reps: 12, group: 4 }, { reps: 15, group: 3 },
    { reps: 16, group: 4 }, { reps: 20, group: 4 },
  ];
  let best = combos[0];
  let bestDiff = Infinity;
  for (const c of combos) {
    const diff = Math.abs(c.reps - rawReps);
    if (diff < bestDiff) { bestDiff = diff; best = c; }
  }
  const reps = best.reps;
  const descendGroup = best.group;
  const interval = calcInterval(dist, pace, 12);
  const rounds = reps / descendGroup;
  const desc = rounds > 1
    ? `Free — Descend 1-${descendGroup}, ${rounds}x through`
    : `Free — Descend 1-${descendGroup}`;
  return [{ reps, distance: dist, interval, description: desc, stroke: "free" }];
}

function mainLadder(target: number, pace: number, rng: Rng): SetItem[] {
  const patterns = [
    [100, 200, 300, 400],
    [100, 200, 300, 400, 500],
    [200, 300, 400, 500],
    [100, 200, 300, 200, 100],
  ];
  const pattern = rng.pick(patterns);

  let steps = [...pattern];
  while (steps.reduce((a, b) => a + b, 0) < target * 0.7) {
    steps = [...steps, ...pattern];
  }
  while (steps.reduce((a, b) => a + b, 0) > target * 1.15 && steps.length > 3) {
    steps.pop();
  }

  return steps.map((d, i) => ({
    reps: 1, distance: d,
    interval: calcInterval(d, pace, 10),
    description: i === 0 ? "Free — ease into it" : i === steps.length - 1 ? "Free — strong finish" : "Free — settle in",
    stroke: "free" as Stroke,
  }));
}

function mainPyramid(target: number, pace: number, rng: Rng): SetItem[] {
  const step = target >= 2000 ? 100 : 50;
  const peak = Math.max(step * 2, Math.min(Math.round(target * 0.2 / step) * step, 500));

  const ascending: number[] = [];
  for (let d = step; d <= peak; d += step) ascending.push(d);
  const descending = [...ascending].slice(0, -1).reverse();
  const pyramid = [...ascending, ...descending];
  const pyramidTotal = pyramid.reduce((a, b) => a + b, 0);

  if (pyramidTotal < target * 0.6) {
    const remaining = target - pyramidTotal;
    const repDist = rng.pick([100, 200]);
    const repCount = niceReps(remaining / repDist);
    const interval = calcInterval(repDist, pace, 10);
    const result: SetItem[] = pyramid.map((d, i) => ({
      reps: 1, distance: d,
      interval: calcInterval(d, pace, 10),
      description: i < pyramid.length / 2 ? "Free — build up" : "Free — bring it home",
      stroke: "free" as Stroke,
    }));
    result.push({ reps: repCount, distance: repDist, interval, description: "Free — hold best pace", stroke: "free" });
    return result;
  }

  return pyramid.map((d, i) => ({
    reps: 1, distance: d,
    interval: calcInterval(d, pace, 10),
    description: i < pyramid.length / 2 ? "Free — build up" : "Free — bring it home",
    stroke: "free" as Stroke,
  }));
}

function mainNegSplit(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([200, 200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 12);
  return [{ reps, distance: dist, interval, description: "Free — negative split each", stroke: "free" }];
}

function mainPullSet(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([200, 200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick(["Descend 1-4", "Negative split each", "Build within each", "Hold strong pace"]);
  return [{ reps, distance: dist, interval, description: `Pull — ${desc}`, stroke: "free", equipment: "pull" }];
}

function mainMixedGear(target: number, pace: number, rng: Rng): SetItem[] {
  const swimDist = rng.pick([200, 300]);
  const pullDist = rng.pick([200, 300]);
  const kickDist = rng.pick([100, 200]);
  const roundTotal = swimDist + pullDist + kickDist;
  const rounds = niceReps(target / roundTotal);

  const swimInterval = calcInterval(swimDist, pace, 10);
  const pullInterval = calcInterval(pullDist, pace, 10);
  const kickInterval = calcInterval(kickDist, pace, 20);

  return [{
    reps: rounds, distance: roundTotal,
    description: `${rounds}x through:`,
    stroke: "free",
    isGroup: true,
    items: [
      { reps: 1, distance: swimDist, interval: swimInterval, description: "Swim free — strong", stroke: "free" },
      { reps: 1, distance: pullDist, interval: pullInterval, description: "Pull free", stroke: "free", equipment: "pull" },
      { reps: 1, distance: kickDist, interval: kickInterval, description: "Kick choice", stroke: "choice", equipment: "kickboard" },
    ],
  }];
}

function mainIMSet(target: number, pace: number, rng: Rng): SetItem[] {
  const formats: Array<(td: number) => SetItem[]> = [
    (td) => {
      const dist = td >= 1500 ? rng.pick([100, 200]) : 100;
      const reps = niceReps(td / dist);
      const interval = calcInterval(dist, pace, 15);
      return [{ reps, distance: dist, interval, description: "IM", stroke: "IM" }];
    },
    (td) => {
      const dist = td >= 1200 ? rng.pick([50, 100]) : 50;
      const repsPerStroke = niceReps(td / (dist * 4));
      const interval = calcInterval(dist, pace, 15);
      return [
        { reps: repsPerStroke, distance: dist, interval, description: "Fly", stroke: "fly" },
        { reps: repsPerStroke, distance: dist, interval, description: "Back", stroke: "back" },
        { reps: repsPerStroke, distance: dist, interval, description: "Breast", stroke: "breast" },
        { reps: repsPerStroke, distance: dist, interval, description: "Free — fast", stroke: "free" },
      ];
    },
    (td) => {
      const imDist = rng.pick([100, 200]);
      const imReps = niceReps(td * 0.5 / imDist);
      const freeDist = rng.pick([100, 200]);
      const freeReps = niceReps(td * 0.5 / freeDist);
      const imInterval = calcInterval(imDist, pace, 15);
      const freeInterval = calcInterval(freeDist, pace, 10);
      return [
        { reps: imReps, distance: imDist, interval: imInterval, description: "IM", stroke: "IM" },
        { reps: freeReps, distance: freeDist, interval: freeInterval, description: "Free — pick it up", stroke: "free" },
      ];
    },
  ];
  return rng.pick(formats)(target);
}

function mainBrokenSwim(target: number, pace: number, rng: Rng): SetItem[] {
  const raceDist = target >= 1500 ? rng.pick([400, 500, 800]) : rng.pick([400, 500]);
  const breakDist = rng.pick([100, 50]);
  const pieces = raceDist / breakDist;
  const interval = calcInterval(breakDist, pace, 5);

  const remaining = target - raceDist;
  const result: SetItem[] = [
    { reps: pieces, distance: breakDist, interval, description: `Broken ${raceDist} free — race pace`, stroke: "free" },
  ];

  if (remaining >= 200) {
    const extraDist = rng.pick([100, 200]);
    const extraReps = niceReps(remaining / extraDist);
    const extraInterval = calcInterval(extraDist, pace, 10);
    result.push({ reps: extraReps, distance: extraDist, interval: extraInterval, description: "Free — moderate", stroke: "free" });
  }

  return result;
}

function mainCombo(target: number, pace: number, rng: Rng): SetItem[] {
  const patterns: Array<[number, number][]> = [
    [[400, 0.3], [200, 0.35], [100, 0.35]],
    [[400, 0.25], [200, 0.30], [100, 0.25], [50, 0.20]],
    [[300, 0.30], [200, 0.40], [100, 0.30]],
    [[500, 0.35], [200, 0.30], [100, 0.35]],
  ];
  const pattern = rng.pick(patterns);

  return pattern.map(([dist, frac], i) => {
    const reps = niceReps((target * frac) / dist);
    const interval = calcInterval(dist, pace, 10);
    const descriptions = ["Free — settle into pace", "Free — hold steady", "Free — pick it up", "Free — fast finish"];
    return { reps, distance: dist, interval, description: descriptions[Math.min(i, descriptions.length - 1)], stroke: "free" as Stroke };
  });
}

function mainFinsSet(target: number, pace: number, rng: Rng): SetItem[] {
  const swimDist = rng.pick([200, 300]);
  const finsDist = rng.pick([100, 200]);
  const swimReps = niceReps((target * 0.6) / swimDist);
  const finsReps = niceReps((target * 0.4) / finsDist);
  const swimInterval = calcInterval(swimDist, pace, 10);
  const finsInterval = calcInterval(finsDist, pace, 5);
  return [
    { reps: swimReps, distance: swimDist, interval: swimInterval, description: "Free — strong pace", stroke: "free" },
    { reps: finsReps, distance: finsDist, interval: finsInterval, description: "Free with fins — fast!", stroke: "free", equipment: "fins" },
  ];
}

function mainSprint(target: number, pace: number, rng: Rng): SetItem[] {
  const sprintDist = rng.pick([25, 50, 50]);
  const sprintReps = niceReps((target * 0.45) / sprintDist);
  const sprintInterval = calcInterval(sprintDist, pace, 30);
  const recoveryDist = rng.pick([100, 200]);
  const recoveryReps = niceReps((target * 0.55) / recoveryDist);
  const recoveryInterval = calcInterval(recoveryDist, pace, 10);
  const desc = rng.pick(["All-out sprint", "Max effort", "Race pace — go!"]);
  return [
    { reps: recoveryReps, distance: recoveryDist, interval: recoveryInterval, description: "Free — moderate, settle in", stroke: "free" },
    { reps: sprintReps, distance: sprintDist, interval: sprintInterval, description: `Free — ${desc}`, stroke: "free" },
  ];
}

function mainThreshold(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 5);
  const desc = rng.pick(["Threshold pace — hold it", "T-pace — no slowing down", "Red line — sustain it"]);
  return [{ reps, distance: dist, interval, description: `Free — ${desc}`, stroke: "free" }];
}

function mainWave(target: number, pace: number, rng: Rng): SetItem[] {
  const fastDist = rng.pick([200, 300]);
  const easyDist = rng.pick([100, 100, 200]);
  const roundTotal = fastDist + easyDist;
  const rounds = niceReps(target / roundTotal);
  const fastInterval = calcInterval(fastDist, pace, 8);
  const easyInterval = calcInterval(easyDist, pace, 15);
  return [{
    reps: rounds, distance: roundTotal,
    description: `${rounds}x through:`,
    stroke: "free",
    isGroup: true,
    items: [
      { reps: 1, distance: fastDist, interval: fastInterval, description: "Free — strong effort", stroke: "free" },
      { reps: 1, distance: easyDist, interval: easyInterval, description: "Free — easy recovery", stroke: "free" },
    ],
  }];
}

function mainOddsEvens(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 150, 200]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 12);
  const pattern = rng.pick([
    "Odds fast, evens moderate",
    "Odds build, evens easy",
    "Odds sprint, evens recovery",
  ]);
  return [{ reps, distance: dist, interval, description: `Free — ${pattern}`, stroke: "free" }];
}

function mainCountdown(target: number, pace: number, rng: Rng): SetItem[] {
  const patterns: Array<[number, number][]> = [
    [[100, 8], [200, 4], [400, 2]],
    [[100, 6], [150, 4], [200, 3]],
    [[50, 10], [100, 6], [200, 3]],
    [[100, 10], [200, 5], [300, 2]],
  ];
  const pattern = rng.pick(patterns);
  const patternTotal = pattern.reduce((s, [d, r]) => s + d * r, 0);
  const scale = target / patternTotal;

  return pattern.map(([dist, baseReps], i) => {
    const reps = niceReps(baseReps * scale);
    const interval = calcInterval(dist, pace, 10);
    const descs = ["Free — fast & sharp", "Free — settle into rhythm", "Free — long & strong"];
    return { reps, distance: dist, interval, description: descs[Math.min(i, descs.length - 1)], stroke: "free" as Stroke };
  });
}

function mainBackstroke(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 200, 200]);
  const reps = niceReps(target * 0.6 / dist);
  const interval = calcInterval(dist, pace, 15);
  const freeReps = niceReps(target * 0.4 / 200);
  const freeInterval = calcInterval(200, pace, 10);
  const desc = rng.pick(["Hold steady", "Descend 1-4", "Build each"]);
  return [
    { reps: freeReps, distance: 200, interval: freeInterval, description: "Free — settle in", stroke: "free" },
    { reps, distance: dist, interval, description: `Back — ${desc}`, stroke: "back" },
  ];
}

function mainBreaststroke(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 200]);
  const reps = niceReps(target * 0.55 / dist);
  const interval = calcInterval(dist, pace, 18);
  const freeReps = niceReps(target * 0.45 / 200);
  const freeInterval = calcInterval(200, pace, 10);
  const desc = rng.pick(["Focus on glide", "Strong pull, patient kick", "Hold tempo"]);
  return [
    { reps: freeReps, distance: 200, interval: freeInterval, description: "Free — moderate", stroke: "free" },
    { reps, distance: dist, interval, description: `Breast — ${desc}`, stroke: "breast" },
  ];
}

function mainStrokeMix(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 200]);
  const secondStroke = rng.pick(["back", "breast"]) as Stroke;
  const secondName = secondStroke === "back" ? "Back" : "Breast";
  const repsPerStroke = niceReps(target / 2 / dist);
  const interval = calcInterval(dist, pace, 12);
  const format = rng.pick(["alternating", "block"]);

  if (format === "alternating") {
    const totalReps = repsPerStroke * 2;
    return [{ reps: totalReps, distance: dist, interval, description: `Alternate free / ${secondName.toLowerCase()} by ${dist}`, stroke: "mixed" }];
  }
  return [
    { reps: repsPerStroke, distance: dist, interval, description: "Free — hold pace", stroke: "free" },
    { reps: repsPerStroke, distance: dist, interval, description: `${secondName} — steady`, stroke: secondStroke },
  ];
}

function mainRacePace(target: number, pace: number, rng: Rng): SetItem[] {
  const fastDist = rng.pick([50, 75, 100]);
  const recoveryDist = rng.pick([50, 100]);
  const roundTotal = fastDist + recoveryDist;
  const rounds = niceReps(target / roundTotal);
  const fastInterval = calcInterval(fastDist, pace, 5);
  const recoveryInterval = calcInterval(recoveryDist, pace, 20);
  return [{
    reps: rounds, distance: roundTotal,
    description: `${rounds}x through:`,
    stroke: "free",
    isGroup: true,
    items: [
      { reps: 1, distance: fastDist, interval: fastInterval, description: "Free — race pace", stroke: "free" },
      { reps: 1, distance: recoveryDist, interval: recoveryInterval, description: "Free — easy", stroke: "free" },
    ],
  }];
}

function mainBuildSet(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick([
    "Build each: easy → moderate → fast → sprint",
    "Build each rep: 25 easy, 25 mod, 25 fast, 25 all-out",
    "Progressive build — last 50 is fastest",
  ]);
  return [{ reps, distance: dist, interval, description: `Free — ${desc}`, stroke: "free" }];
}

function mainPaddlesSet(target: number, pace: number, rng: Rng): SetItem[] {
  const swimDist = rng.pick([200, 300]);
  const paddleDist = rng.pick([200, 300]);
  const swimReps = niceReps(target * 0.5 / swimDist);
  const paddleReps = niceReps(target * 0.5 / paddleDist);
  const swimInterval = calcInterval(swimDist, pace, 10);
  const paddleInterval = calcInterval(paddleDist, pace, 8);
  return [
    { reps: swimReps, distance: swimDist, interval: swimInterval, description: "Free — hold pace", stroke: "free" },
    { reps: paddleReps, distance: paddleDist, interval: paddleInterval, description: "Pull with paddles — power", stroke: "free", equipment: "pull" },
  ];
}

function mainBrokenIM(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 200]);
  const roundsPerStroke = niceReps(target / (dist * 4));
  const interval = calcInterval(dist, pace, 15);
  const strokes: Array<{ name: string; stroke: Stroke }> = [
    { name: "Fly", stroke: "fly" },
    { name: "Back", stroke: "back" },
    { name: "Breast", stroke: "breast" },
    { name: "Free — bring it home", stroke: "free" },
  ];
  return strokes.map(({ name, stroke }) => ({
    reps: roundsPerStroke, distance: dist, interval, description: name, stroke,
  }));
}

function mainEndurance(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([400, 500, 800]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 15);
  const desc = rng.pick(["Hold pace — long & steady", "Cruise — find your rhythm", "Consistent splits"]);
  return [{ reps, distance: dist, interval, description: `Free — ${desc}`, stroke: "free" }];
}

function mainKickMain(target: number, pace: number, rng: Rng): SetItem[] {
  const swimDist = rng.pick([200, 300]);
  const kickDist = rng.pick([100, 200]);
  const swimReps = niceReps(target * 0.55 / swimDist);
  const kickReps = niceReps(target * 0.45 / kickDist);
  const swimInterval = calcInterval(swimDist, pace, 10);
  const kickInterval = calcInterval(kickDist, pace, 20);
  const kickDesc = rng.pick(["Kick with fins — fast!", "Kick with board — build each", "Kick on back — streamline"]);
  return [
    { reps: swimReps, distance: swimDist, interval: swimInterval, description: "Free — moderate", stroke: "free" },
    { reps: kickReps, distance: kickDist, interval: kickInterval, description: kickDesc, stroke: "free", equipment: rng.pick(["fins", "kickboard"]) },
  ];
}

function mainDescendLadder(target: number, pace: number, rng: Rng): SetItem[] {
  const patterns = [
    [400, 300, 200, 100],
    [500, 400, 300, 200, 100],
    [300, 200, 100, 50],
    [400, 300, 200, 100, 50],
  ];
  let steps = rng.pick(patterns);
  const stepsTotal = steps.reduce((a, b) => a + b, 0);
  const repeats = Math.max(1, Math.round(target / stepsTotal));
  const fullSteps: number[] = [];
  for (let r = 0; r < repeats; r++) fullSteps.push(...steps);
  while (fullSteps.reduce((a, b) => a + b, 0) > target * 1.15 && fullSteps.length > 3) fullSteps.pop();

  return fullSteps.map((d, i) => ({
    reps: 1, distance: d,
    interval: calcInterval(d, pace, 10),
    description: i === 0 ? "Free — long & steady" : i === fullSteps.length - 1 ? "Free — sprint to finish" : "Free — pick it up",
    stroke: "free" as Stroke,
  }));
}

function mainSwimPullAlternate(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([200, 300]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  return [{ reps, distance: dist, interval, description: "Alternate: 1 swim, 1 pull (every other with pull buoy)", stroke: "free" }];
}

function mainTest(target: number, pace: number, rng: Rng): SetItem[] {
  const warmupReps = niceReps(target * 0.3 / 200);
  const warmupInterval = calcInterval(200, pace, 10);
  const testDist = rng.pick([200, 400, 500]);
  const testInterval = calcInterval(testDist, pace, 5);
  const coolReps = niceReps(target * 0.3 / 100);
  const coolInterval = calcInterval(100, pace, 15);
  return [
    { reps: warmupReps, distance: 200, interval: warmupInterval, description: "Free — build to race pace", stroke: "free" },
    { reps: 1, distance: testDist, interval: testInterval, description: `Free — ${testDist} time trial, all out`, stroke: "free" },
    { reps: coolReps, distance: 100, interval: coolInterval, description: "Free — active recovery", stroke: "free" },
  ];
}

type MainSetFn = (target: number, pace: number, rng: Rng) => SetItem[];
type FocusTag = "endurance" | "speed" | "technique";

interface MainSetTemplate {
  fn: MainSetFn;
  weight: number;
  name: string;
  tags: FocusTag[];
}

const MAIN_SET_TEMPLATES: MainSetTemplate[] = [
  { fn: mainStraight,          weight: 4, name: "Straight Freestyle",    tags: ["endurance"] },
  { fn: mainDescend,           weight: 4, name: "Descend Set",            tags: ["endurance"] },
  { fn: mainLadder,            weight: 3, name: "Ladder",                 tags: ["endurance"] },
  { fn: mainPyramid,           weight: 2, name: "Pyramid",                tags: ["endurance"] },
  { fn: mainNegSplit,          weight: 3, name: "Negative Split",         tags: ["endurance", "speed"] },
  { fn: mainPullSet,           weight: 3, name: "Pull Set",               tags: ["endurance", "technique"] },
  { fn: mainMixedGear,         weight: 2, name: "Mixed Gear",             tags: ["technique"] },
  { fn: mainIMSet,             weight: 2, name: "IM Set",                 tags: ["technique"] },
  { fn: mainBrokenSwim,        weight: 2, name: "Broken Swim",            tags: ["speed"] },
  { fn: mainCombo,             weight: 3, name: "Distance Combo",         tags: ["endurance"] },
  { fn: mainFinsSet,           weight: 2, name: "Fins Set",               tags: ["technique", "speed"] },
  { fn: mainSprint,            weight: 3, name: "Sprint Set",             tags: ["speed"] },
  { fn: mainThreshold,         weight: 3, name: "Threshold",              tags: ["speed", "endurance"] },
  { fn: mainWave,              weight: 2, name: "Wave Set",               tags: ["speed"] },
  { fn: mainOddsEvens,         weight: 3, name: "Odds & Evens",           tags: ["speed"] },
  { fn: mainCountdown,         weight: 2, name: "Countdown",              tags: ["endurance", "speed"] },
  { fn: mainBackstroke,        weight: 2, name: "Backstroke Focus",       tags: ["technique"] },
  { fn: mainBreaststroke,      weight: 2, name: "Breaststroke Focus",     tags: ["technique"] },
  { fn: mainStrokeMix,         weight: 2, name: "Stroke Mix",             tags: ["technique"] },
  { fn: mainRacePace,          weight: 2, name: "Race Pace",              tags: ["speed"] },
  { fn: mainBuildSet,          weight: 3, name: "Build Set",              tags: ["endurance", "speed"] },
  { fn: mainPaddlesSet,        weight: 2, name: "Paddles Power",          tags: ["technique"] },
  { fn: mainBrokenIM,          weight: 2, name: "Broken IM",              tags: ["technique"] },
  { fn: mainEndurance,         weight: 2, name: "Endurance",              tags: ["endurance"] },
  { fn: mainKickMain,          weight: 2, name: "Kick Focus",             tags: ["technique"] },
  { fn: mainDescendLadder,     weight: 2, name: "Descend Ladder",         tags: ["endurance", "speed"] },
  { fn: mainSwimPullAlternate, weight: 2, name: "Swim/Pull Alternate",    tags: ["endurance", "technique"] },
  { fn: mainTest,              weight: 1, name: "Time Trial",             tags: ["speed"] },
];

// ─── COOLDOWN TEMPLATES ────────────────────────────────────────────────────────
// NO rest intervals — cooldown is continuous

function buildCooldown(target: number, pace: number, rng: Rng): SetItem[] {
  const freeEnd = 200;
  const remaining = target - freeEnd;

  if (remaining < 200) {
    return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }

  const firstDist = Math.round(remaining / 50) * 50;

  const flavor = rng.pick(["back", "choice", "kansas", "IM", "pull", "build", "breast"]);

  switch (flavor) {
    case "back":
      return [
        { reps: 1, distance: firstDist, description: "Moderate backstroke", stroke: "back" },
        { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
      ];

    case "choice":
      return [
        { reps: 1, distance: firstDist, description: "Moderate choice — loosen up", stroke: "choice" },
        { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
      ];

    case "kansas":
      if (firstDist < 300) {
        return [
          { reps: 1, distance: firstDist, description: "Moderate backstroke", stroke: "back" },
          { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
        ];
      }
      return [
        { reps: 1, distance: 300, description: "Kansas (50 free, 50 back, 100 breast, 50 back, 50 free)", stroke: "mixed" },
        { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
      ];

    case "IM":
      if (firstDist < 200) {
        return [
          { reps: 1, distance: firstDist, description: "Moderate backstroke", stroke: "back" },
          { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
        ];
      }
      return [
        { reps: 4, distance: 50, description: "Easy IM order (fly, back, breast, free)", stroke: "IM" },
        { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
      ];

    case "pull":
      return [
        { reps: 1, distance: firstDist, description: "Easy pull — flush the legs", stroke: "free", equipment: "pull" },
        { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
      ];

    case "build":
      return [
        { reps: 1, distance: firstDist, description: "Easy free — build last 50", stroke: "free" },
        { reps: 1, distance: freeEnd, description: "Moderate free — stretch it out", stroke: "free" },
      ];

    case "breast":
      return [
        { reps: 1, distance: firstDist, description: "Easy breaststroke — long glide", stroke: "breast" },
        { reps: 1, distance: freeEnd, description: "Moderate free", stroke: "free" },
      ];

    default:
      return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }
}

// ─── PRE-SET TEMPLATES ─────────────────────────────────────────────────────────

type PresetFn = (target: number, pace: number, rng: Rng) => SetItem[];

function presetKick(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([50, 100]);
  const reps = Math.min(niceReps(target / dist), 12);
  const interval = calcInterval(dist, pace, 25);
  const desc = rng.pick(["Kick — moderate", "Kick — build each", "Kick — descend 1-4"]);
  return [{ reps, distance: dist, interval, description: desc, stroke: "free", equipment: "kickboard" }];
}

function presetPull(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([100, 200]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick(["Pull — steady", "Pull — build", "Pull — negative split each"]);
  return [{ reps, distance: dist, interval, description: desc, stroke: "free", equipment: "pull" }];
}

function presetDrill(target: number, pace: number, rng: Rng): SetItem[] {
  const drill = rng.pick(["Catch-up drill / swim by 25", "Fingertip drag / swim by 25", "Fist drill / swim by 25"]);
  const reps = niceReps(target / 50);
  const interval = calcInterval(50, pace, 15);
  return [{ reps, distance: 50, interval, description: drill, stroke: "free" }];
}

function presetSprintPrep(target: number, pace: number, rng: Rng): SetItem[] {
  const reps = niceReps(target / 25);
  const interval = calcInterval(25, pace, 25);
  const desc = rng.pick(["Fast 25s — race starts", "25s sprint — explode off the wall", "Quick turnover 25s"]);
  return [{ reps, distance: 25, interval, description: desc, stroke: "free" }];
}

function presetIMDrill(target: number, pace: number, rng: Rng): SetItem[] {
  const reps = niceReps(target / 100);
  const interval = calcInterval(100, pace, 15);
  return [{ reps, distance: 100, interval, description: "IM — 25 each stroke", stroke: "IM" }];
}

function presetFinsKick(target: number, pace: number, rng: Rng): SetItem[] {
  const dist = rng.pick([50, 100]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 15);
  const desc = rng.pick(["Kick with fins — fast", "Kick with fins — build each", "Streamline kick with fins"]);
  return [{ reps, distance: dist, interval, description: desc, stroke: "free", equipment: "fins" }];
}

function presetScull(target: number, pace: number, rng: Rng): SetItem[] {
  const reps = niceReps(target / 50);
  const interval = calcInterval(50, pace, 20);
  return [{ reps, distance: 50, interval, description: "Scull 25 / swim 25 — feel the water", stroke: "free" }];
}

const PRESET_TEMPLATES: PresetFn[] = [presetKick, presetPull, presetDrill, presetSprintPrep, presetIMDrill, presetFinsKick, presetScull];

// ─── MAIN GENERATOR ────────────────────────────────────────────────────────────

export function generateWorkout({ duration, pace, unit, seed, focus = "any" }: WorkoutInput): Workout {
  const rng = createRng(seed ?? Math.floor(Math.random() * 2147483647));
  const paceSec = parsePace(pace);
  const totalTargetDist = calcTargetDistance(duration, paceSec);

  // Step 1: Generate main set first (it's the priority)
  const mainTargetRaw = Math.round(totalTargetDist * 0.62 / 100) * 100;

  const hasPreset = duration > 30 ? rng.chance(0.55) : rng.chance(0.2);
  const presetTargetRaw = hasPreset ? Math.round(totalTargetDist * 0.10 / 100) * 100 : 0;

  // Apply focus biasing: 4x weight boost for templates matching the focus tag
  const effectiveWeights = MAIN_SET_TEMPLATES.map((t) =>
    focus === "any" || t.tags.includes(focus as FocusTag) ? t.weight * (focus === "any" ? 1 : 4) : t.weight
  );

  // Generate main set and pre-set
  const mainEntry = weightedPick(
    MAIN_SET_TEMPLATES,
    effectiveWeights,
    rng
  );
  const mainSet = mainEntry.fn(mainTargetRaw, paceSec, rng);
  const mainDist = groupDistance(mainSet);

  let preset: SetItem[] = [];
  let presetDist = 0;
  if (hasPreset) {
    preset = rng.pick(PRESET_TEMPLATES)(presetTargetRaw, paceSec, rng);
    presetDist = groupDistance(preset);
  }

  // Step 2: Pad warmup and cooldown to fill remaining distance
  const remainingDist = totalTargetDist - mainDist - presetDist;
  const cooldownDist = Math.max(200, Math.round(remainingDist * 0.3 / 50) * 50);
  const warmupDist = Math.max(200, remainingDist - cooldownDist);

  // Round to nearest 50, cap warmup at 1000
  const warmupDistFinal = Math.min(1000, Math.round(warmupDist / 50) * 50);
  const cooldownDistFinal = Math.round(cooldownDist / 50) * 50;

  const warmup = buildWarmup(warmupDistFinal, paceSec, rng);
  const cooldown = buildCooldown(cooldownDistFinal, paceSec, rng);

  // Calculate actual totals
  const actualWarmup = groupDistance(warmup);
  const actualCooldown = groupDistance(cooldown);
  const totalDist = actualWarmup + presetDist + mainDist + actualCooldown;

  // Estimate total time
  const totalDurSec =
    groupDuration(warmup, paceSec * 1.15) +
    groupDuration(preset, paceSec * 1.1) +
    groupDuration(mainSet, paceSec) +
    groupDuration(cooldown, paceSec * 1.2);

  // Format intervals for display
  const formatSet = (items: SetItem[]): SetItem[] =>
    items.map((item) => {
      if (item.isGroup && item.items) {
        return { ...item, items: formatSet(item.items) };
      }
      return {
        ...item,
        intervalDisplay: item.interval ? formatTime(item.interval) : null,
      };
    });

  return {
    name: mainEntry.name,
    duration,
    pace,
    unit,
    totalDistance: totalDist,
    estimatedMinutes: Math.round(totalDurSec / 60),
    sections: [
      { name: "Warmup", items: formatSet(warmup), distance: actualWarmup },
      ...(preset.length > 0
        ? [{ name: "Pre-Set", items: formatSet(preset), distance: presetDist }]
        : []),
      { name: "Main Set", items: formatSet(mainSet), distance: mainDist },
      { name: "Cooldown", items: formatSet(cooldown), distance: actualCooldown },
    ],
    seed,
  };
}
