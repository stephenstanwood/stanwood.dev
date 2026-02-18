/**
 * Swim Workout Generator Engine
 *
 * Generates structured swim workouts based on:
 *  - Duration (30, 60, 90, 120 minutes)
 *  - Pace per 100 (user's comfortable pace)
 *  - Unit (meters or yards)
 *
 * Workout structure: Warmup → Main Set → Cooldown
 * Skews towards longer distances (100s–400s) with occasional 50s/25s.
 */

// ─── Seeded RNG ────────────────────────────────────────────────────────────────
// Using a simple mulberry32 PRNG so we can seed & reproduce workouts

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

/** Parse pace string "1:30" → seconds */
function parsePace(str) {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
}

/** Format seconds → "1:30" */
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Round to nearest 5 seconds */
function roundTo5(secs) {
  return Math.round(secs / 5) * 5;
}

/** Calculate interval for a given distance based on pace per 100 */
function calcInterval(distance, pacePer100, restAdder = 10) {
  const swimTime = (distance / 100) * pacePer100;
  const interval = swimTime + (distance / 100) * restAdder;
  return roundTo5(interval);
}

/** Calculate how long a set takes in seconds (swim time + rest) */
function calcSetDuration(set, pacePer100) {
  if (!set || !set.reps || !set.distance) return 0;

  if (set.interval) {
    // Interval-based: total time = reps × interval
    return set.reps * set.interval;
  }

  if (set.rest) {
    // Rest-based: total = reps × (swim + rest) - last rest
    const swimTime = (set.distance / 100) * pacePer100;
    return set.reps * (swimTime + set.rest) - set.rest;
  }

  // Just swim time
  const swimTime = (set.distance / 100) * pacePer100;
  return set.reps * swimTime;
}

/** Calculate total distance in a workout group */
function groupDistance(items) {
  return items.reduce((sum, item) => {
    if (item.items) return sum + groupDistance(item.items);
    return sum + (item.reps || 1) * (item.distance || 0);
  }, 0);
}

/** Calculate total duration in seconds for a workout group */
function groupDuration(items, pacePer100) {
  return items.reduce((sum, item) => {
    if (item.items) return sum + groupDuration(item.items, pacePer100);
    return sum + calcSetDuration(item, pacePer100);
  }, 0);
}

// ─── Workout Set Templates ─────────────────────────────────────────────────────

/**
 * Each template function returns an array of set items.
 * A set item: { reps, distance, interval?, rest?, description, stroke?, equipment? }
 */

// ─── WARMUP TEMPLATES ──────────────────────────────────────────────────────────

function warmupSimpleFree(targetDist, pace, rng) {
  // Simple continuous free swim
  const dist = Math.min(targetDist, 400);
  return [
    { reps: 1, distance: dist, rest: 0, description: "Easy free", stroke: "free" },
  ];
}

function warmupMixed(targetDist, pace, rng) {
  // Free + choice stroke mix
  const half = Math.min(Math.round(targetDist / 2 / 50) * 50, 300);
  return [
    { reps: 1, distance: half, rest: 0, description: "Easy free", stroke: "free" },
    { reps: 1, distance: half, rest: 0, description: "Easy choice stroke", stroke: "choice" },
  ];
}

function warmupSKPS(targetDist, pace, rng) {
  // Swim / Kick / Pull / Swim
  const leg = Math.min(Math.round(targetDist / 4 / 50) * 50, 200);
  if (leg < 100) return warmupSimpleFree(targetDist, pace, rng);
  return [
    { reps: 1, distance: leg, rest: 15, description: "Swim free", stroke: "free" },
    { reps: 1, distance: leg, rest: 15, description: "Kick", stroke: "free", equipment: "kickboard" },
    { reps: 1, distance: leg, rest: 15, description: "Pull", stroke: "free", equipment: "pull" },
    { reps: 1, distance: leg, rest: 0, description: "Swim free", stroke: "free" },
  ];
}

function warmupBuildReps(targetDist, pace, rng) {
  // 4–6 × 100 build
  const n = Math.min(Math.max(Math.round(targetDist / 100), 3), 6);
  const interval = calcInterval(100, pace, 15);
  return [
    { reps: n, distance: 100, interval, description: "Build (easy → fast)", stroke: "free" },
  ];
}

function warmupIMOrder(targetDist, pace, rng) {
  // 200 free + 4×50 IM order
  const freeDist = Math.min(Math.round(targetDist * 0.5 / 50) * 50, 200);
  const n = Math.min(4, Math.round((targetDist - freeDist) / 50));
  if (n < 4) return warmupMixed(targetDist, pace, rng);
  const interval = calcInterval(50, pace, 20);
  return [
    { reps: 1, distance: freeDist, rest: 15, description: "Easy free", stroke: "free" },
    { reps: 4, distance: 50, interval, description: "IM order (fly, back, breast, free)", stroke: "IM" },
  ];
}

const WARMUP_TEMPLATES = [
  warmupSimpleFree,
  warmupMixed,
  warmupSKPS,
  warmupBuildReps,
  warmupIMOrder,
];

// ─── MAIN SET TEMPLATES ────────────────────────────────────────────────────────

function mainStraight(targetDist, pace, rng) {
  // Straight set: N × distance at consistent pace
  const distances = [100, 150, 200, 300, 400];
  const weights = [2, 2, 4, 3, 2];
  const dist = weightedPick(distances, weights, rng);
  const reps = Math.max(2, Math.round(targetDist / dist));
  const interval = calcInterval(dist, pace, 10);
  const descriptors = rng.pick([
    "Hold pace",
    "Steady effort",
    "Strong & consistent",
  ]);
  return [
    { reps, distance: dist, interval, description: `Free — ${descriptors}`, stroke: "free" },
  ];
}

function mainDescend(targetDist, pace, rng) {
  // Descending set: get faster each rep
  const dist = rng.pick([100, 150, 200]);
  const reps = Math.max(4, Math.min(10, Math.round(targetDist / dist)));
  const interval = calcInterval(dist, pace, 12);
  // Round reps to even number for nice descend groupings
  const finalReps = reps % 2 === 0 ? reps : reps - 1;
  return [
    { reps: finalReps, distance: dist, interval, description: `Free — Descend 1-${finalReps}`, stroke: "free" },
  ];
}

function mainLadder(targetDist, pace, rng) {
  // Ladder: 100, 200, 300, 400, ... ascending
  const steps = rng.pick([
    [100, 200, 300, 400],
    [100, 200, 300, 400, 500],
    [200, 300, 400, 500],
    [100, 200, 300, 200, 100], // pyramid
  ]);
  const ladderTotal = steps.reduce((a, b) => a + b, 0);

  // If ladder total is much less than target, repeat or extend
  let sets = [...steps];
  if (ladderTotal < targetDist * 0.6) {
    // Do the ladder twice or add a repeat
    const remaining = targetDist - ladderTotal;
    const repDist = rng.pick([100, 200]);
    const repCount = Math.max(2, Math.round(remaining / repDist));
    const repInterval = calcInterval(repDist, pace, 10);

    const result = steps.map((d) => ({
      reps: 1, distance: d, rest: roundTo5(15 + (d / 100) * 5),
      description: d === steps[steps.length - 1] ? "Free — strong finish" : "Free — build through the ladder",
      stroke: "free",
    }));

    result.push({
      reps: repCount, distance: repDist, interval: repInterval,
      description: "Free — hold best pace", stroke: "free",
    });
    return result;
  }

  return steps.map((d, i) => ({
    reps: 1, distance: d,
    rest: roundTo5(15 + (d / 100) * 5),
    description: i === 0 ? "Free — ease into it" : i === steps.length - 1 ? "Free — strong finish" : "Free — settle in",
    stroke: "free",
  }));
}

function mainPyramid(targetDist, pace, rng) {
  // Pyramid: go up and come back down
  const pyramids = [
    [50, 100, 150, 200, 150, 100, 50],
    [100, 200, 300, 400, 300, 200, 100],
    [100, 200, 300, 200, 100],
    [50, 100, 200, 300, 200, 100, 50],
  ];

  // Pick pyramid that's closest to target
  let best = pyramids[0];
  let bestDiff = Infinity;
  for (const p of pyramids) {
    const total = p.reduce((a, b) => a + b, 0);
    const diff = Math.abs(total - targetDist);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
    }
  }

  return best.map((d, i) => ({
    reps: 1, distance: d,
    rest: roundTo5(10 + (d / 100) * 5),
    description: i < best.length / 2 ? "Free — build up" : "Free — bring it home",
    stroke: "free",
  }));
}

function mainNegSplit(targetDist, pace, rng) {
  // Negative split: second half faster
  const dist = rng.pick([200, 300, 400]);
  const reps = Math.max(3, Math.round(targetDist / dist));
  const interval = calcInterval(dist, pace, 12);
  return [
    { reps, distance: dist, interval, description: "Free — negative split each", stroke: "free" },
  ];
}

function mainPullSet(targetDist, pace, rng) {
  // Main set that's pull-focused
  const dist = rng.pick([200, 300, 400]);
  const reps = Math.max(3, Math.round(targetDist / dist));
  // Pull is slightly faster (no kick drag), so similar interval works
  const interval = calcInterval(dist, pace, 10);
  const descriptor = rng.pick([
    "Descend 1-" + reps,
    "Negative split each",
    "Build within each",
    "Hold strong pace",
  ]);
  return [
    { reps, distance: dist, interval, description: `Pull — ${descriptor}`, stroke: "free", equipment: "pull" },
  ];
}

function mainMixedGear(targetDist, pace, rng) {
  // Mix of swim / pull / kick
  const swimDist = rng.pick([200, 300]);
  const pullDist = rng.pick([200, 300]);
  const kickDist = rng.pick([100, 200]);

  const rounds = Math.max(2, Math.round(targetDist / (swimDist + pullDist + kickDist)));

  const swimInterval = calcInterval(swimDist, pace, 10);
  const pullInterval = calcInterval(pullDist, pace, 10);
  const kickRest = roundTo5((kickDist / 100) * pace * 0.3); // generous kick rest

  return [
    {
      reps: rounds, distance: swimDist + pullDist + kickDist,
      description: `${rounds}x through:`,
      isGroup: true,
      items: [
        { reps: 1, distance: swimDist, interval: swimInterval, description: `Swim free — strong`, stroke: "free" },
        { reps: 1, distance: pullDist, interval: pullInterval, description: `Pull free`, stroke: "free", equipment: "pull" },
        { reps: 1, distance: kickDist, rest: kickRest, description: `Kick choice`, stroke: "choice", equipment: "kickboard" },
      ],
    },
  ];
}

function mainIMSet(targetDist, pace, rng) {
  // IM-focused main set
  const formats = [
    // Standard IM repeats
    (td) => {
      const dist = rng.pick([100, 200]);
      const reps = Math.max(4, Math.round(td / dist));
      const finalReps = Math.min(reps, dist === 200 ? 8 : 12);
      const interval = calcInterval(dist, pace, 15); // IM is slower, more rest
      return [
        { reps: finalReps, distance: dist, interval, description: "IM", stroke: "IM" },
      ];
    },
    // IM broken up: stroke focus per round
    (td) => {
      const dist = rng.pick([50, 100]);
      const reps = Math.max(2, Math.round(td / (dist * 4)));
      const interval = calcInterval(dist, pace, 15);
      return [
        { reps, distance: dist, interval, description: "Fly", stroke: "fly" },
        { reps, distance: dist, interval, description: "Back", stroke: "back" },
        { reps, distance: dist, interval, description: "Breast", stroke: "breast" },
        { reps, distance: dist, interval, description: "Free — fast", stroke: "free" },
      ];
    },
    // IM ladder
    (td) => {
      const interval100 = calcInterval(100, pace, 15);
      const interval200 = calcInterval(200, pace, 15);
      const rest300 = roundTo5(30);
      return [
        { reps: 1, distance: 100, interval: interval100, description: "IM", stroke: "IM" },
        { reps: 1, distance: 200, interval: interval200, description: "IM", stroke: "IM" },
        { reps: 2, distance: 100, interval: interval100, description: "IM", stroke: "IM" },
      ];
    },
  ];

  return rng.pick(formats)(targetDist);
}

function mainBrokenSwim(targetDist, pace, rng) {
  // Broken distance swim
  const raceDist = rng.pick([400, 500, 800]);
  const breakDist = rng.pick([100, 50]);
  const pieces = raceDist / breakDist;
  const rest = 10;

  const remaining = targetDist - raceDist;
  const result = [
    { reps: pieces, distance: breakDist, rest, description: `Broken ${raceDist} free — race pace, ${rest}s rest between`, stroke: "free" },
  ];

  if (remaining > 200) {
    const extraDist = rng.pick([100, 200]);
    const extraReps = Math.max(2, Math.round(remaining / extraDist));
    const interval = calcInterval(extraDist, pace, 10);
    result.push({
      reps: extraReps, distance: extraDist, interval,
      description: "Free — easy-to-moderate",
      stroke: "free",
    });
  }

  return result;
}

function mainCombo(targetDist, pace, rng) {
  // Combo set: mix of distances
  // e.g., 1×400, 2×200, 4×100
  const combos = [
    [[1, 400], [2, 200], [4, 100]],
    [[1, 400], [2, 200], [4, 100], [4, 50]],
    [[1, 300], [2, 200], [3, 100]],
    [[2, 400], [4, 200]],
    [[1, 500], [5, 100]],
    [[2, 300], [3, 200], [6, 50]],
  ];

  // Find combo closest to target
  let best = combos[0];
  let bestDiff = Infinity;
  for (const c of combos) {
    const total = c.reduce((s, [r, d]) => s + r * d, 0);
    const diff = Math.abs(total - targetDist);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = c;
    }
  }

  return best.map(([reps, dist], i) => {
    const interval = calcInterval(dist, pace, 10);
    const descriptors = [
      "Free — settle into pace",
      "Free — hold steady",
      "Free — pick it up",
      "Free — fast finish",
    ];
    return {
      reps, distance: dist, interval,
      description: descriptors[Math.min(i, descriptors.length - 1)],
      stroke: "free",
    };
  });
}

function mainFinsSet(targetDist, pace, rng) {
  // Fins set — kick or swim with fins
  const swimDist = rng.pick([200, 300]);
  const finsDist = rng.pick([100, 200]);
  const swimReps = Math.max(2, Math.round((targetDist * 0.6) / swimDist));
  const finsReps = Math.max(2, Math.round((targetDist * 0.4) / finsDist));

  const swimInterval = calcInterval(swimDist, pace, 10);
  const finsInterval = calcInterval(finsDist, pace, 5); // fins = faster

  return [
    { reps: swimReps, distance: swimDist, interval: swimInterval, description: "Free — strong pace", stroke: "free" },
    { reps: finsReps, distance: finsDist, interval: finsInterval, description: "Free with fins — fast!", stroke: "free", equipment: "fins" },
  ];
}

const MAIN_SET_TEMPLATES = [
  { fn: mainStraight, weight: 4 },
  { fn: mainDescend, weight: 4 },
  { fn: mainLadder, weight: 3 },
  { fn: mainPyramid, weight: 2 },
  { fn: mainNegSplit, weight: 3 },
  { fn: mainPullSet, weight: 3 },
  { fn: mainMixedGear, weight: 2 },
  { fn: mainIMSet, weight: 2 },
  { fn: mainBrokenSwim, weight: 2 },
  { fn: mainCombo, weight: 3 },
  { fn: mainFinsSet, weight: 2 },
];

// ─── COOLDOWN TEMPLATES ────────────────────────────────────────────────────────

function cooldownEasy(targetDist, pace, rng) {
  const dist = Math.min(targetDist, 400);
  return [
    { reps: 1, distance: dist, rest: 0, description: "Easy free", stroke: "free" },
  ];
}

function cooldownMixed(targetDist, pace, rng) {
  const half = Math.min(Math.round(targetDist / 2 / 50) * 50, 200);
  if (half < 50) return cooldownEasy(targetDist, pace, rng);
  return [
    { reps: 1, distance: half, rest: 0, description: "Easy backstroke", stroke: "back" },
    { reps: 1, distance: half, rest: 0, description: "Easy free", stroke: "free" },
  ];
}

function cooldownLoosen(targetDist, pace, rng) {
  const n = Math.max(2, Math.min(4, Math.round(targetDist / 50)));
  return [
    { reps: n, distance: 50, rest: 10, description: "Easy choice — loosen up", stroke: "choice" },
  ];
}

const COOLDOWN_TEMPLATES = [cooldownEasy, cooldownMixed, cooldownLoosen];

// ─── KICK/PULL PRE-SET TEMPLATES ───────────────────────────────────────────────

function presetKick(targetDist, pace, rng) {
  const dist = rng.pick([50, 100]);
  const reps = Math.max(4, Math.round(targetDist / dist));
  const rest = roundTo5((dist / 100) * pace * 0.25 + 10); // generous kick rest
  return [
    { reps, distance: dist, rest, description: rng.pick(["Kick — moderate", "Kick — build each", "Kick — descend 1-" + reps]), stroke: "free", equipment: "kickboard" },
  ];
}

function presetPull(targetDist, pace, rng) {
  const dist = rng.pick([100, 200]);
  const reps = Math.max(3, Math.round(targetDist / dist));
  const interval = calcInterval(dist, pace, 10);
  return [
    { reps, distance: dist, interval, description: rng.pick(["Pull — steady", "Pull — build", "Pull — negative split each"]), stroke: "free", equipment: "pull" },
  ];
}

function presetDrill(targetDist, pace, rng) {
  const drills = [
    "Catch-up drill / swim by 25",
    "Fingertip drag / swim by 25",
    "Fist drill / swim by 25",
  ];
  const reps = Math.max(4, Math.round(targetDist / 50));
  const interval = calcInterval(50, pace, 15);
  return [
    { reps, distance: 50, interval, description: rng.pick(drills), stroke: "free" },
  ];
}

const PRESET_TEMPLATES = [presetKick, presetPull, presetDrill];

// ─── Weighted pick utility ─────────────────────────────────────────────────────

function weightedPick(items, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── MAIN GENERATOR ────────────────────────────────────────────────────────────

/**
 * Generate a swim workout.
 *
 * @param {Object} options
 * @param {number} options.duration - Workout duration in minutes (30, 60, 90, 120)
 * @param {string} options.pace - Pace per 100 as "M:SS" (e.g., "1:30")
 * @param {"meters"|"yards"} options.unit - Pool unit
 * @param {number} [options.seed] - Random seed for reproducibility
 *
 * @returns {Object} workout
 */
export function generateWorkout({ duration, pace, unit, seed }) {
  const rng = createRng(seed ?? Math.floor(Math.random() * 2147483647));
  const paceSec = parsePace(pace);

  // Total available time in seconds
  const totalTimeSec = duration * 60;

  // Estimate total distance achievable (swim time ≈ 80% of total time, rest is 20%)
  const effectiveSwimFraction = 0.78;
  const estimatedTotalDist = Math.round(
    (totalTimeSec * effectiveSwimFraction) / (paceSec / 100)
  );

  // Round to nearest 50
  const totalTargetDist = Math.round(estimatedTotalDist / 50) * 50;

  // Allocate distances
  const warmupTarget = Math.round(totalTargetDist * 0.18 / 50) * 50;
  const cooldownTarget = Math.max(200, Math.round(totalTargetDist * 0.08 / 50) * 50);

  // Decide if we have a pre-set (60%+ chance for workouts > 30 min)
  const hasPreset = duration > 30 ? rng.chance(0.6) : rng.chance(0.25);
  const presetTarget = hasPreset ? Math.round(totalTargetDist * 0.12 / 50) * 50 : 0;

  const mainTarget = totalTargetDist - warmupTarget - cooldownTarget - presetTarget;

  // Generate each section
  const warmupTemplate = rng.pick(WARMUP_TEMPLATES);
  const warmup = warmupTemplate(warmupTarget, paceSec, rng);

  let preset = [];
  if (hasPreset) {
    const presetTemplate = rng.pick(PRESET_TEMPLATES);
    preset = presetTemplate(presetTarget, paceSec, rng);
  }

  // Pick main set
  const mainTemplates = MAIN_SET_TEMPLATES;
  const mainTemplate = weightedPick(
    mainTemplates.map((t) => t.fn),
    mainTemplates.map((t) => t.weight),
    rng
  );
  const mainSet = mainTemplate(mainTarget, paceSec, rng);

  const cooldownTemplate = rng.pick(COOLDOWN_TEMPLATES);
  const cooldown = cooldownTemplate(cooldownTarget, paceSec, rng);

  // Calculate actual totals
  const warmupDist = groupDistance(warmup);
  const presetDist = groupDistance(preset);
  const mainDist = groupDistance(mainSet);
  const cooldownDist = groupDistance(cooldown);
  const totalDist = warmupDist + presetDist + mainDist + cooldownDist;

  // Estimate total time
  const warmupDur = groupDuration(warmup, paceSec * 1.15); // warmup is slower
  const presetDur = groupDuration(preset, paceSec * 1.1);
  const mainDur = groupDuration(mainSet, paceSec);
  const cooldownDur = groupDuration(cooldown, paceSec * 1.2); // cooldown is slowest
  const totalDurSec = warmupDur + presetDur + mainDur + cooldownDur;

  // Format intervals for display
  const formatSet = (items) =>
    items.map((item) => {
      if (item.isGroup && item.items) {
        return {
          ...item,
          items: formatSet(item.items),
        };
      }
      return {
        ...item,
        intervalDisplay: item.interval ? formatTime(item.interval) : null,
        restDisplay: item.rest ? formatTime(item.rest) : null,
      };
    });

  // Workout name
  const names = [
    "The Engine Builder",
    "Steady State",
    "Lane Burner",
    "Blue Line Special",
    "The Long Game",
    "Chlorine Dreams",
    "Pace Machine",
    "Distance Eater",
    "The Grind",
    "Deep End Session",
    "Tempo Town",
    "The Yardage Monster",
    "Clock Watcher",
    "Pool Shark Session",
    "The Endless Lane",
  ];

  return {
    name: rng.pick(names),
    duration,
    pace,
    unit,
    totalDistance: totalDist,
    estimatedMinutes: Math.round(totalDurSec / 60),
    sections: [
      {
        name: "Warmup",
        items: formatSet(warmup),
        distance: warmupDist,
      },
      ...(preset.length > 0
        ? [
            {
              name: "Pre-Set",
              items: formatSet(preset),
              distance: presetDist,
            },
          ]
        : []),
      {
        name: "Main Set",
        items: formatSet(mainSet),
        distance: mainDist,
      },
      {
        name: "Cooldown",
        items: formatSet(cooldown),
        distance: cooldownDist,
      },
    ],
    seed,
  };
}
