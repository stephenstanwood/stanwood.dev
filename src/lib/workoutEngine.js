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

// ─── Seeded RNG ────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed) {
  const next = mulberry32(seed);
  return {
    random: () => next(),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    chance: (p) => next() < p,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parsePace(str) {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function roundTo5(secs) {
  return Math.round(secs / 5) * 5;
}

function calcInterval(distance, pacePer100, restAdder = 10) {
  const swimTime = (distance / 100) * pacePer100;
  return roundTo5(swimTime + (distance / 100) * restAdder);
}

/** Pick the nearest "nice" rep count to a raw number */
function niceReps(raw) {
  const nice = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20];
  let best = nice[0];
  let bestDiff = Infinity;
  for (const n of nice) {
    const diff = Math.abs(n - raw);
    if (diff < bestDiff) { bestDiff = diff; best = n; }
  }
  return best;
}

function calcSetDuration(set, pacePer100) {
  if (!set || !set.reps || !set.distance) return 0;
  if (set.interval) return set.reps * set.interval;
  return set.reps * (set.distance / 100) * pacePer100;
}

function groupDistance(items) {
  return items.reduce((sum, item) => {
    if (item.items) return sum + item.reps * groupDistance(item.items);
    return sum + (item.reps || 1) * (item.distance || 0);
  }, 0);
}

function groupDuration(items, pacePer100) {
  return items.reduce((sum, item) => {
    if (item.items) return sum + item.reps * groupDuration(item.items, pacePer100);
    return sum + calcSetDuration(item, pacePer100);
  }, 0);
}

function weightedPick(items, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Target yardage by duration & pace ─────────────────────────────────────────

function calcTargetDistance(durationMin, paceSec) {
  const utilization = durationMin <= 30 ? 0.72 : durationMin <= 60 ? 0.68 : 0.65;
  const rawDist = (durationMin * 60 * utilization) / (paceSec / 100);
  return Math.round(rawDist / 100) * 100;
}

// ─── WARMUP TEMPLATES ──────────────────────────────────────────────────────────
// NO rest intervals — warmup is continuous swimming

// Warmup always starts with 200+ plain free, then an optional second piece.
// Total warmup never exceeds 1000.

function buildWarmup(target, pace, rng) {
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
  const flavor = rng.pick(["choice", "SKPS", "build", "IM", "kansas"]);

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

    default:
      return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }
}

// ─── MAIN SET TEMPLATES ────────────────────────────────────────────────────────

function mainStraight(target, pace, rng) {
  const dist = rng.pick([100, 200, 200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick(["Hold pace", "Steady effort", "Strong & consistent"]);
  return [{ reps, distance: dist, interval, description: `Free — ${desc}`, stroke: "free" }];
}

function mainDescend(target, pace, rng) {
  const dist = rng.pick([100, 150, 200]);
  const rawReps = Math.round(target / dist);
  // Valid combos: reps must be divisible by descend group (3 or 4)
  // Pick the best combo that's close to rawReps
  const combos = [
    { reps: 3, group: 3 }, { reps: 4, group: 4 },
    { reps: 6, group: 3 }, { reps: 8, group: 4 },
    { reps: 9, group: 3 }, { reps: 12, group: 3 },
    { reps: 12, group: 4 }, { reps: 15, group: 3 },
    { reps: 16, group: 4 }, { reps: 20, group: 4 },
  ];
  // Find closest combo
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

function mainLadder(target, pace, rng) {
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
    stroke: "free",
  }));
}

function mainPyramid(target, pace, rng) {
  const step = target >= 2000 ? 100 : 50;
  const peak = Math.max(step * 2, Math.min(Math.round(target * 0.2 / step) * step, 500));

  const ascending = [];
  for (let d = step; d <= peak; d += step) ascending.push(d);
  const descending = [...ascending].slice(0, -1).reverse();
  const pyramid = [...ascending, ...descending];
  const pyramidTotal = pyramid.reduce((a, b) => a + b, 0);

  if (pyramidTotal < target * 0.6) {
    const remaining = target - pyramidTotal;
    const repDist = rng.pick([100, 200]);
    const repCount = niceReps(remaining / repDist);
    const interval = calcInterval(repDist, pace, 10);
    const result = pyramid.map((d, i) => ({
      reps: 1, distance: d,
      interval: calcInterval(d, pace, 10),
      description: i < pyramid.length / 2 ? "Free — build up" : "Free — bring it home",
      stroke: "free",
    }));
    result.push({ reps: repCount, distance: repDist, interval, description: "Free — hold best pace", stroke: "free" });
    return result;
  }

  return pyramid.map((d, i) => ({
    reps: 1, distance: d,
    interval: calcInterval(d, pace, 10),
    description: i < pyramid.length / 2 ? "Free — build up" : "Free — bring it home",
    stroke: "free",
  }));
}

function mainNegSplit(target, pace, rng) {
  const dist = rng.pick([200, 200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 12);
  return [{ reps, distance: dist, interval, description: "Free — negative split each", stroke: "free" }];
}

function mainPullSet(target, pace, rng) {
  const dist = rng.pick([200, 200, 300, 400]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick(["Descend 1-4", "Negative split each", "Build within each", "Hold strong pace"]);
  return [{ reps, distance: dist, interval, description: `Pull — ${desc}`, stroke: "free", equipment: "pull" }];
}

function mainMixedGear(target, pace, rng) {
  const swimDist = rng.pick([200, 300]);
  const pullDist = rng.pick([200, 300]);
  const kickDist = rng.pick([100, 200]);
  const roundTotal = swimDist + pullDist + kickDist;
  const rounds = niceReps(target / roundTotal);

  const swimInterval = calcInterval(swimDist, pace, 10);
  const pullInterval = calcInterval(pullDist, pace, 10);
  const kickInterval = calcInterval(kickDist, pace, 20); // more rest for kick

  return [{
    reps: rounds, distance: roundTotal,
    description: `${rounds}x through:`,
    isGroup: true,
    items: [
      { reps: 1, distance: swimDist, interval: swimInterval, description: "Swim free — strong", stroke: "free" },
      { reps: 1, distance: pullDist, interval: pullInterval, description: "Pull free", stroke: "free", equipment: "pull" },
      { reps: 1, distance: kickDist, interval: kickInterval, description: "Kick choice", stroke: "choice", equipment: "kickboard" },
    ],
  }];
}

function mainIMSet(target, pace, rng) {
  const formats = [
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

function mainBrokenSwim(target, pace, rng) {
  const raceDist = target >= 1500 ? rng.pick([400, 500, 800]) : rng.pick([400, 500]);
  const breakDist = rng.pick([100, 50]);
  const pieces = raceDist / breakDist;
  const interval = calcInterval(breakDist, pace, 5); // tight interval for broken swim

  const remaining = target - raceDist;
  const result = [
    { reps: pieces, distance: breakDist, interval, description: `Broken ${raceDist} free — race pace`, stroke: "free" },
  ];

  if (remaining >= 200) {
    const extraDist = rng.pick([100, 200]);
    const extraReps = niceReps(remaining / extraDist);
    const interval = calcInterval(extraDist, pace, 10);
    result.push({ reps: extraReps, distance: extraDist, interval, description: "Free — moderate", stroke: "free" });
  }

  return result;
}

function mainCombo(target, pace, rng) {
  const patterns = [
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
    return { reps, distance: dist, interval, description: descriptions[Math.min(i, descriptions.length - 1)], stroke: "free" };
  });
}

function mainFinsSet(target, pace, rng) {
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

const MAIN_SET_TEMPLATES = [
  { fn: mainStraight, weight: 4, name: "Straight Freestyle" },
  { fn: mainDescend, weight: 4, name: "Descend Set" },
  { fn: mainLadder, weight: 3, name: "Ladder" },
  { fn: mainPyramid, weight: 2, name: "Pyramid" },
  { fn: mainNegSplit, weight: 3, name: "Negative Split" },
  { fn: mainPullSet, weight: 3, name: "Pull Set" },
  { fn: mainMixedGear, weight: 2, name: "Mixed Gear" },
  { fn: mainIMSet, weight: 2, name: "IM Set" },
  { fn: mainBrokenSwim, weight: 2, name: "Broken Swim" },
  { fn: mainCombo, weight: 3, name: "Distance Combo" },
  { fn: mainFinsSet, weight: 2, name: "Fins Set" },
];

// ─── COOLDOWN TEMPLATES ────────────────────────────────────────────────────────
// NO rest intervals — cooldown is continuous

// Cooldown always ends with 200 plain free. Optional first piece before it.

function buildCooldown(target, pace, rng) {
  const freeEnd = 200;
  const remaining = target - freeEnd;

  // If not much room for a first piece, just do all free
  if (remaining < 200) {
    return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }

  const firstDist = Math.round(remaining / 50) * 50;

  const flavor = rng.pick(["back", "choice", "kansas"]);

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

    default:
      return [{ reps: 1, distance: target, description: "Moderate free", stroke: "free" }];
  }
}

// ─── PRE-SET TEMPLATES ─────────────────────────────────────────────────────────

function presetKick(target, pace, rng) {
  const dist = rng.pick([50, 100]);
  const reps = Math.min(niceReps(target / dist), 12); // cap kick reps
  const interval = calcInterval(dist, pace, 25); // generous interval for kick
  const desc = rng.pick(["Kick — moderate", "Kick — build each", "Kick — descend 1-4"]);
  return [{ reps, distance: dist, interval, description: desc, stroke: "free", equipment: "kickboard" }];
}

function presetPull(target, pace, rng) {
  const dist = rng.pick([100, 200]);
  const reps = niceReps(target / dist);
  const interval = calcInterval(dist, pace, 10);
  const desc = rng.pick(["Pull — steady", "Pull — build", "Pull — negative split each"]);
  return [{ reps, distance: dist, interval, description: desc, stroke: "free", equipment: "pull" }];
}

function presetDrill(target, pace, rng) {
  const drill = rng.pick(["Catch-up drill / swim by 25", "Fingertip drag / swim by 25", "Fist drill / swim by 25"]);
  const reps = niceReps(target / 50);
  const interval = calcInterval(50, pace, 15);
  return [{ reps, distance: 50, interval, description: drill, stroke: "free" }];
}

const PRESET_TEMPLATES = [presetKick, presetPull, presetDrill];

// ─── MAIN GENERATOR ────────────────────────────────────────────────────────────

export function generateWorkout({ duration, pace, unit, seed }) {
  const rng = createRng(seed ?? Math.floor(Math.random() * 2147483647));
  const paceSec = parsePace(pace);
  const totalTargetDist = calcTargetDistance(duration, paceSec);

  // Step 1: Generate main set first (it's the priority)
  const mainTargetRaw = Math.round(totalTargetDist * 0.62 / 100) * 100;

  const hasPreset = duration > 30 ? rng.chance(0.55) : rng.chance(0.2);
  const presetTargetRaw = hasPreset ? Math.round(totalTargetDist * 0.10 / 100) * 100 : 0;

  // Generate main set and pre-set
  const mainEntry = weightedPick(
    MAIN_SET_TEMPLATES,
    MAIN_SET_TEMPLATES.map((t) => t.weight),
    rng
  );
  const mainSet = mainEntry.fn(mainTargetRaw, paceSec, rng);
  const mainDist = groupDistance(mainSet);

  let preset = [];
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
  const formatSet = (items) =>
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
