import { useState, useRef, useCallback } from "react";
import { generateWorkout } from "../lib/workoutEngine.js";

// ─── Constants ─────────────────────────────────────────────────────────────────

const DURATIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const PACES = {
  meters: [
    { value: "1:20", label: "1:20" },
    { value: "1:25", label: "1:25" },
    { value: "1:30", label: "1:30" },
    { value: "1:35", label: "1:35" },
    { value: "1:40", label: "1:40" },
    { value: "1:45", label: "1:45" },
  ],
  yards: [
    { value: "1:10", label: "1:10" },
    { value: "1:15", label: "1:15" },
    { value: "1:20", label: "1:20" },
    { value: "1:25", label: "1:25" },
    { value: "1:30", label: "1:30" },
    { value: "1:35", label: "1:35" },
  ],
};

// ─── Chevron SVG pattern (for background flair) ────────────────────────────────

function ChevronPattern({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path d="M0 60 L50 10 L100 60" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.15" />
      <path d="M50 60 L100 10 L150 60" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.1" />
      <path d="M100 60 L150 10 L200 60" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.15" />
    </svg>
  );
}

// ─── Equipment badge ───────────────────────────────────────────────────────────

function EquipmentBadge({ equipment }) {
  const config = {
    pull: { label: "Pull", icon: "🟡", bg: "bg-amber-100 text-amber-800" },
    kickboard: { label: "Kick", icon: "🟢", bg: "bg-emerald-100 text-emerald-800" },
    fins: { label: "Fins", icon: "🔵", bg: "bg-sky-100 text-sky-800" },
  };
  const c = config[equipment];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.bg}`}>
      {c.label}
    </span>
  );
}

// ─── Set item renderer ─────────────────────────────────────────────────────────

function SetItem({ item, unit }) {
  if (item.isGroup && item.items) {
    return (
      <div className="pl-3 border-l-2 border-teal-200 space-y-2 my-2">
        {item.items.map((sub, i) => (
          <SetItem key={i} item={sub} unit={unit} />
        ))}
      </div>
    );
  }

  const distLabel = `${item.distance} ${unit === "meters" ? "m" : "y"}`;
  const repsLabel = item.reps > 1 ? `${item.reps} × ` : "";
  const totalDist = item.reps * item.distance;

  let timingLabel = "";
  if (item.intervalDisplay) {
    timingLabel = `@ ${item.intervalDisplay}`;
  } else if (item.restDisplay && item.rest > 0) {
    timingLabel = `+ ${item.restDisplay} rest`;
  }

  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="shrink-0 min-w-[80px] text-right font-mono text-sm font-semibold text-slate-700">
        {repsLabel}{distLabel}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-slate-600">{item.description}</span>
          {item.equipment && <EquipmentBadge equipment={item.equipment} />}
        </div>
        {timingLabel && (
          <span className="text-xs font-mono text-teal-600">{timingLabel}</span>
        )}
      </div>
      <div className="shrink-0 text-xs text-slate-400 font-mono">
        {totalDist}
      </div>
    </div>
  );
}

// ─── Section renderer ──────────────────────────────────────────────────────────

const SECTION_COLORS = {
  Warmup: {
    border: "border-l-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-400 text-white",
    headerText: "text-amber-800",
  },
  "Pre-Set": {
    border: "border-l-orange-400",
    bg: "bg-orange-50",
    badge: "bg-orange-400 text-white",
    headerText: "text-orange-800",
  },
  "Main Set": {
    border: "border-l-teal-500",
    bg: "bg-teal-50",
    badge: "bg-teal-500 text-white",
    headerText: "text-teal-800",
  },
  Cooldown: {
    border: "border-l-sky-400",
    bg: "bg-sky-50",
    badge: "bg-sky-400 text-white",
    headerText: "text-sky-800",
  },
};

function WorkoutSection({ section, unit }) {
  const colors = SECTION_COLORS[section.name] || SECTION_COLORS["Main Set"];
  return (
    <div className={`border-l-4 ${colors.border} ${colors.bg} rounded-r-xl p-4 sm:p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
          {section.name}
        </span>
        <span className="text-xs font-mono text-slate-400">
          {section.distance} {unit === "meters" ? "m" : "y"}
        </span>
      </div>
      <div className="space-y-0.5">
        {section.items.map((item, i) => (
          <SetItem key={i} item={item} unit={unit} />
        ))}
      </div>
    </div>
  );
}

// ─── Print view ────────────────────────────────────────────────────────────────

function PrintWorkout({ workout }) {
  if (!workout) return null;
  const unit = workout.unit === "meters" ? "m" : "y";

  return (
    <div className="print-workout hidden print:block p-8 max-w-[700px] mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{workout.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {workout.totalDistance} {unit} · ~{workout.estimatedMinutes} min · Pace: {workout.pace}/{unit === "m" ? "100m" : "100y"}
        </p>
      </div>

      {workout.sections.map((section, i) => (
        <div key={i} className="mb-4">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              {section.name}
            </span>
            <span className="text-xs text-gray-400 font-mono">{section.distance} {unit}</span>
          </div>
          {section.items.map((item, j) => {
            if (item.isGroup && item.items) {
              return (
                <div key={j} className="pl-4 mb-1">
                  {item.items.map((sub, k) => (
                    <PrintSetLine key={k} item={sub} unit={unit} />
                  ))}
                </div>
              );
            }
            return <PrintSetLine key={j} item={item} unit={unit} />;
          })}
        </div>
      ))}

      <div className="text-center mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Generated by Lap Lab · stanwood.dev/swim</p>
      </div>
    </div>
  );
}

function PrintSetLine({ item, unit }) {
  const reps = item.reps > 1 ? `${item.reps} × ` : "";
  const dist = `${item.distance}${unit}`;
  let timing = "";
  if (item.intervalDisplay) timing = `@ ${item.intervalDisplay}`;
  else if (item.restDisplay && item.rest > 0) timing = `+ ${item.restDisplay} rest`;
  const equip = item.equipment ? ` [${item.equipment}]` : "";

  return (
    <div className="flex items-baseline gap-2 py-0.5 text-sm">
      <span className="font-mono font-semibold min-w-[70px] text-right">{reps}{dist}</span>
      <span className="flex-1 text-gray-700">{item.description}{equip}</span>
      <span className="font-mono text-gray-400 text-xs">{timing}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SwimWorkout() {
  const [unit, setUnit] = useState("yards");
  const [duration, setDuration] = useState(60);
  const [pace, setPace] = useState("1:20");
  const [workout, setWorkout] = useState(null);
  const [animating, setAnimating] = useState(false);
  const workoutRef = useRef(null);

  // When unit changes, reset pace to middle option for that unit
  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    setPace(PACES[newUnit][2].value); // pick middle-ish option
  };

  const generate = useCallback(() => {
    const seed = Math.floor(Math.random() * 2147483647);
    const w = generateWorkout({ duration, pace, unit, seed });
    setAnimating(true);
    setWorkout(w);
    setTimeout(() => setAnimating(false), 400);

    // Scroll to workout after a beat
    setTimeout(() => {
      workoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [duration, pace, unit]);

  const shuffle = useCallback(() => {
    const seed = Math.floor(Math.random() * 2147483647);
    const w = generateWorkout({ duration, pace, unit, seed });
    setAnimating(true);
    setWorkout(w);
    setTimeout(() => setAnimating(false), 400);
  }, [duration, pace, unit]);

  const handlePrint = () => {
    window.print();
  };

  const currentPaces = PACES[unit];
  const unitLabel = unit === "meters" ? "m" : "y";

  return (
    <>
      {/* ─── Configuration ─────────────────────────────────────────────── */}
      <div className="mt-8 space-y-6 print:hidden">
        {/* Unit toggle */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pool
          </label>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
            {["yards", "meters"].map((u) => (
              <button
                key={u}
                onClick={() => handleUnitChange(u)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                  unit === u
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {u === "yards" ? "Yards (SCY)" : "Meters (SCM)"}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Duration
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                  duration === d.value
                    ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pace */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Pace per 100{unitLabel}
          </label>
          <div className="flex flex-wrap gap-2">
            {currentPaces.map((p) => (
              <button
                key={p.value}
                onClick={() => setPace(p.value)}
                className={`rounded-xl px-5 py-2.5 text-sm font-mono font-semibold transition-all ${
                  pace === p.value
                    ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          className="group relative w-full rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-teal-200/50 hover:shadow-xl hover:shadow-teal-300/50 transition-all active:scale-[0.98] overflow-hidden"
        >
          <span className="relative z-10">
            {workout ? "New Workout" : "Generate Workout"}
          </span>
          <ChevronPattern className="absolute inset-0 w-full h-full text-white opacity-30" />
        </button>
      </div>

      {/* ─── Workout Display ───────────────────────────────────────────── */}
      {workout && (
        <div
          ref={workoutRef}
          className={`mt-10 print:hidden ${animating ? "animate-fadeIn" : ""}`}
        >
          {/* Workout header card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-6 sm:p-8 text-white shadow-xl">
            <ChevronPattern className="absolute inset-0 w-full h-full text-white" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {workout.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 font-semibold">
                  🏊 {workout.totalDistance.toLocaleString()} {unitLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 font-semibold">
                  ⏱ ~{workout.estimatedMinutes} min
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 font-semibold">
                  💨 {workout.pace}/100{unitLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="mt-6 space-y-4">
            {workout.sections.map((section, i) => (
              <WorkoutSection key={i} section={section} unit={unit} />
            ))}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <button
              onClick={shuffle}
              className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-all active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Shuffle
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-all active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      )}

      {/* ─── Print-only view (clean, single-page layout) ─────────────── */}
      <PrintWorkout workout={workout} />
    </>
  );
}
