import { useState, useEffect } from "react";
import SportsView from "./SportsView";
import {
  SOUTH_BAY_EVENTS,
  type SBEvent,
  type DayOfWeek,
} from "../../../data/south-bay/events-data";

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOW = new Date();
const MONTH = NOW.getMonth() + 1;
const DAY_IDX = NOW.getDay();
const DAY_NAME = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][DAY_IDX];

function isActiveToday(e: SBEvent): boolean {
  if (e.months && !e.months.includes(MONTH)) return false;
  if (!e.days) return true; // ongoing
  return e.days.includes(DAY_NAME as DayOfWeek);
}

function cityLabel(city: string): string {
  return city.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function costBadge(e: SBEvent): { label: string; bg: string; color: string } {
  if (e.cost === "free") return { label: "FREE", bg: "#D1FAE5", color: "#065F46" };
  if (e.cost === "low") return { label: e.costNote?.split(" ")[0] ?? "$", bg: "#FEF3C7", color: "#92400E" };
  return { label: e.costNote?.split(" ")[0] ?? "$$", bg: "#EDE9FE", color: "#5B21B6" };
}

// ── Compact event row ─────────────────────────────────────────────────────────

function EventRow({ event }: { event: SBEvent }) {
  const badge = costBadge(event);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--sb-border-light)",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, width: 28, textAlign: "center" }}>
        {event.emoji}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "var(--sb-serif)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--sb-ink)",
              lineHeight: 1.3,
            }}
          >
            {event.title}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 3,
              background: badge.bg,
              color: badge.color,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            {badge.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--sb-muted)",
            marginTop: 2,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>{cityLabel(event.city)}</span>
          {event.time && (
            <>
              <span style={{ color: "var(--sb-border)" }}>·</span>
              <span>{event.time}</span>
            </>
          )}
          {event.venue && event.venue !== cityLabel(event.city) && (
            <>
              <span style={{ color: "var(--sb-border)" }}>·</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event.venue}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const WEEKDAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][DAY_IDX];

export default function OverviewView() {
  const [weather, setWeather] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => setWeather(d.weather ?? null))
      .catch(() => {});
  }, []);

  // Today's events: free first, then featured, then rest
  const todayEvents = SOUTH_BAY_EVENTS.filter(isActiveToday).sort((a, b) => {
    if (a.cost === "free" && b.cost !== "free") return -1;
    if (b.cost === "free" && a.cost !== "free") return 1;
    if (a.featured && !b.featured) return -1;
    if (b.featured && !a.featured) return 1;
    return 0;
  });

  const SHOW_LIMIT = 8;
  const visibleEvents = showAllEvents ? todayEvents : todayEvents.slice(0, SHOW_LIMIT);
  const hasMore = todayEvents.length > SHOW_LIMIT && !showAllEvents;

  return (
    <>
      {/* ── Weather strip ── */}
      {weather && (
        <div
          style={{
            background: "var(--sb-primary-light)",
            border: "1px solid var(--sb-border-light)",
            borderRadius: "var(--sb-radius)",
            padding: "10px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 14, color: "var(--sb-ink)", fontWeight: 500 }}>
            {weather}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--sb-muted)",
              letterSpacing: "0.04em",
            }}
          >
            · South Bay, CA
          </span>
        </div>
      )}

      {/* ── Happening Today ── */}
      <div className="sb-section-header">
        <span className="sb-section-title">
          Happening Today
        </span>
        {todayEvents.length > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--sb-muted)",
              marginLeft: 4,
            }}
          >
            {todayEvents.length} {todayEvents.length === 1 ? "event" : "events"}
          </span>
        )}
      </div>

      {todayEvents.length === 0 ? (
        <div
          style={{
            padding: "20px 0",
            color: "var(--sb-muted)",
            fontSize: 14,
            fontStyle: "italic",
          }}
        >
          No recurring events on {WEEKDAY}s this time of year.
        </div>
      ) : (
        <div style={{ marginBottom: 4 }}>
          {visibleEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
          {hasMore && (
            <button
              onClick={() => setShowAllEvents(true)}
              style={{
                display: "block",
                marginTop: 12,
                padding: "8px 0",
                background: "none",
                border: "none",
                color: "var(--sb-primary)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Show {todayEvents.length - SHOW_LIMIT} more events →
            </button>
          )}
        </div>
      )}

      {/* ── Government teaser ── */}
      <div
        style={{
          marginTop: 8,
          marginBottom: 28,
          padding: "12px 16px",
          background: "var(--sb-primary-light)",
          border: "1px solid var(--sb-border-light)",
          borderRadius: "var(--sb-radius)",
          fontSize: 13,
          color: "var(--sb-muted)",
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontWeight: 600, color: "var(--sb-ink)" }}>City Hall</span>
        {" — "}AI-powered plain-English digests for Campbell, Saratoga, and Los Altos. What your city council decided, without the agenda-reading.
      </div>

      {/* ── Sports scoreboard ── */}
      <SportsView />
    </>
  );
}
