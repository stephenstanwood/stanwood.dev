import { useState, useCallback, useMemo } from "react";
import { activities } from "../data/kidwindow-activities";
import {
  scoreActivities,
  getRandomActivity,
  DEFAULT_FILTERS,
  type Filters,
  type WeatherFilter,
  type CostFilter,
  type EnergyFilter,
  type TimingFilter,
  type StrollerFilter,
} from "../lib/kidwindow";
import type { Activity } from "../data/kidwindow-activities";

// ── Filter button configs ──

const WEATHER_OPTIONS: { value: WeatherFilter; label: string; icon: string }[] =
  [
    { value: "shine", label: "Shine", icon: "\u2600\uFE0F" },
    { value: "rain", label: "Rain", icon: "\u{1F327}\uFE0F" },
  ];

const COST_OPTIONS: { value: CostFilter; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "either", label: "Either" },
];

const ENERGY_OPTIONS: { value: EnergyFilter; label: string; icon: string }[] = [
  { value: "easy", label: "Easy", icon: "\u{1F6CB}\uFE0F" },
  { value: "normal", label: "Normal", icon: "\u{1F6B6}" },
  { value: "adventure", label: "Adventure", icon: "\u26A1" },
];

const TIMING_OPTIONS: { value: TimingFilter; label: string }[] = [
  { value: "now", label: "Right now" },
  { value: "90min", label: "90 min" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
];

const STROLLER_OPTIONS: { value: StrollerFilter; label: string }[] = [
  { value: "yes", label: "Stroller-friendly" },
  { value: "any", label: "Doesn't matter" },
];

// ── Chip component ──

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: "weather-shine" | "weather-rain" | "cost" | "energy" | "stroller" | "low-lift" | "snack" | "location";
}) {
  const colors: Record<string, { bg: string; color: string }> = {
    "weather-shine": { bg: "#fef3c7", color: "#92400e" },
    "weather-rain": { bg: "#dbeafe", color: "#1e40af" },
    cost: { bg: "#dcfce7", color: "#166534" },
    energy: { bg: "#fce7f3", color: "#9d174d" },
    stroller: { bg: "#e0e7ff", color: "#3730a3" },
    "low-lift": { bg: "#f0fdf4", color: "#15803d" },
    snack: { bg: "#fff7ed", color: "#9a3412" },
    location: { bg: "#f3f4f6", color: "#374151" },
  };

  const c = colors[variant] || colors.location;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        fontFamily: "'Space Mono', monospace",
        letterSpacing: "0.02em",
        background: c.bg,
        color: c.color,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ── Activity card ──

function ActivityCard({
  activity,
  reason,
  featured,
}: {
  activity: Activity;
  reason: string;
  featured?: boolean;
}) {
  const weatherChip =
    activity.rainOrShine === "rain"
      ? "Rain"
      : activity.rainOrShine === "shine"
        ? "Shine"
        : "Rain or Shine";

  return (
    <div
      style={{
        background: featured ? "#fffef5" : "white",
        border: featured ? "3px solid #111" : "2px solid #111",
        boxShadow: featured ? "5px 5px 0 #111" : "3px 3px 0 #111",
        borderRadius: "0",
        padding: featured ? "20px 22px" : "16px 18px",
        transition: "transform 0.1s, box-shadow 0.1s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translate(-2px, -2px)";
        el.style.boxShadow = featured
          ? "7px 7px 0 #111"
          : "5px 5px 0 #111";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "none";
        el.style.boxShadow = featured
          ? "5px 5px 0 #111"
          : "3px 3px 0 #111";
      }}
    >
      {featured && (
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            background: "#111",
            color: "#f5e642",
            display: "inline-block",
            padding: "2px 8px",
            marginBottom: "10px",
          }}
        >
          Best match
        </div>
      )}

      <h3
        style={{
          fontFamily: "'Cabin', sans-serif",
          fontWeight: 700,
          fontSize: featured ? "20px" : "16px",
          lineHeight: 1.2,
          margin: "0 0 6px",
          color: "#111",
        }}
      >
        {activity.name}
      </h3>

      <p
        style={{
          fontSize: "13px",
          color: "#555",
          lineHeight: 1.5,
          margin: "0 0 10px",
          fontStyle: "italic",
        }}
      >
        {reason}
      </p>

      <p
        style={{
          fontSize: "13px",
          color: "#444",
          lineHeight: 1.5,
          margin: "0 0 12px",
        }}
      >
        {activity.description}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap" as const,
          gap: "5px",
          alignItems: "center",
        }}
      >
        <Chip
          label={weatherChip}
          variant={
            activity.rainOrShine === "rain" ? "weather-rain" : "weather-shine"
          }
        />
        <Chip
          label={activity.cost === "free" ? "Free" : "Paid"}
          variant="cost"
        />
        <Chip
          label={
            activity.energy === "easy"
              ? "Easy"
              : activity.energy === "adventure"
                ? "Adventure"
                : "Normal"
          }
          variant="energy"
        />
        {activity.strollerFriendly && (
          <Chip label="Stroller OK" variant="stroller" />
        )}
        {activity.lowLift && <Chip label="Low-lift" variant="low-lift" />}
        {activity.bestWithSnack && (
          <Chip label="Bring snacks" variant="snack" />
        )}
        {activity.neighborhood && activity.neighborhood !== "Home" && (
          <Chip label={activity.neighborhood} variant="location" />
        )}
      </div>

      {activity.link && (
        <a
          href={activity.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: "10px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            color: "#1a4fff",
            textDecoration: "none",
          }}
        >
          more info &rarr;
        </a>
      )}

      {activity.notes && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#999",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {activity.notes}
        </p>
      )}
    </div>
  );
}

// ── Filter row ──

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "#888",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap" as const,
        }}
      >
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              aria-pressed={isActive}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 14px",
                border: isActive ? "2px solid #111" : "2px solid #ddd",
                borderRadius: "0",
                background: isActive ? "#111" : "white",
                color: isActive ? "#f5e642" : "#444",
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.1s",
                boxShadow: isActive ? "2px 2px 0 #111" : "none",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #1a4fff";
                e.currentTarget.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
              }}
            >
              {opt.icon && <span>{opt.icon}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──

export default function KidWindow() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [surpriseKey, setSurpriseKey] = useState(0);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const results = useMemo(
    () => scoreActivities(activities, filters),
    [filters],
  );

  const surprise = useCallback(() => {
    setSurpriseKey((k) => k + 1);
  }, []);

  const surpriseResult = useMemo(
    () => getRandomActivity(activities, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, surpriseKey],
  );

  // Top result + others
  const topResult = results[0];
  const otherResults = results.slice(1, 6);

  // Check if top result is a strong match
  const isStrongMatch = topResult && topResult.score >= 70;

  // Check if we have no great matches
  const noGreatMatches = topResult && topResult.score < 50;

  return (
    <div>
      {/* Filters */}
      <div
        style={{
          background: "white",
          border: "3px solid #111",
          boxShadow: "5px 5px 0 #111",
          padding: "18px 20px 10px",
          marginBottom: "20px",
        }}
      >
        <FilterGroup
          label="Weather"
          options={WEATHER_OPTIONS}
          value={filters.weather}
          onChange={(v) => updateFilter("weather", v)}
        />
        <FilterGroup
          label="Cost"
          options={COST_OPTIONS}
          value={filters.cost}
          onChange={(v) => updateFilter("cost", v)}
        />
        <FilterGroup
          label="Energy"
          options={ENERGY_OPTIONS}
          value={filters.energy}
          onChange={(v) => updateFilter("energy", v)}
        />
        <FilterGroup
          label="Timing"
          options={TIMING_OPTIONS}
          value={filters.timing}
          onChange={(v) => updateFilter("timing", v)}
        />
        <FilterGroup
          label="Stroller"
          options={STROLLER_OPTIONS}
          value={filters.stroller}
          onChange={(v) => updateFilter("stroller", v)}
        />

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "4px",
            paddingBottom: "8px",
          }}
        >
          <button
            onClick={resetFilters}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "#888",
              background: "none",
              border: "1px solid #ddd",
              padding: "4px 12px",
              cursor: "pointer",
              borderRadius: "0",
            }}
          >
            reset filters
          </button>
          <button
            onClick={surprise}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "#1a4fff",
              background: "none",
              border: "1px solid #1a4fff",
              padding: "4px 12px",
              cursor: "pointer",
              borderRadius: "0",
            }}
          >
            {"\uD83C\uDFB2"} surprise me
          </button>
        </div>
      </div>

      {/* No great matches warning */}
      {noGreatMatches && (
        <div
          style={{
            background: "#fff7ed",
            border: "2px solid #fdba74",
            padding: "12px 16px",
            marginBottom: "16px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            color: "#9a3412",
          }}
        >
          Nothing matched every filter perfectly — here are the closest good
          options.
        </div>
      )}

      {/* Featured result */}
      {topResult && (
        <div style={{ marginBottom: "16px" }}>
          <ActivityCard
            activity={topResult.activity}
            reason={topResult.reason}
            featured
          />
        </div>
      )}

      {/* Other results */}
      {otherResults.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "#888",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>More options</span>
            <span
              style={{
                flex: 1,
                height: "1px",
                background: "#ddd",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column" as const,
              gap: "12px",
            }}
          >
            {otherResults.map((r) => (
              <ActivityCard
                key={r.activity.id}
                activity={r.activity}
                reason={r.reason}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
