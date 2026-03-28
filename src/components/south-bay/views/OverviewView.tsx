import { useState, useEffect } from "react";
import SportsView from "./SportsView";
import {
  SOUTH_BAY_EVENTS,
  type SBEvent,
  type DayOfWeek,
} from "../../../data/south-bay/events-data";
import { CITIES, getCityName } from "../../../lib/south-bay/cities";
import type { City } from "../../../lib/south-bay/types";
import upcomingJson from "../../../data/south-bay/upcoming-events.json";

// ── Time constants ────────────────────────────────────────────────────────────

const NOW = new Date();
const MONTH = NOW.getMonth() + 1;
const NEXT_MONTH = MONTH === 12 ? 1 : MONTH + 1;
const DAY_IDX = NOW.getDay();
const DAY_NAME = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][DAY_IDX];
const WEEKDAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][DAY_IDX];
const MONTH_NAME = NOW.toLocaleDateString("en-US", { month: "long" });
const NEXT_MONTH_NAME = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "long" });
const TODAY_ISO = NOW.toISOString().split("T")[0];

// ── Upcoming event type ────────────────────────────────────────────────────────

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  displayDate: string;
  time: string | null;
  endTime: string | null;
  venue: string;
  address: string;
  city: string;
  category: string;
  cost: string;
  description: string;
  url: string;
  source: string;
  kidFriendly: boolean;
}

const upcomingEvents = (upcomingJson as { events: UpcomingEvent[] }).events || [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isActiveToday(e: SBEvent): boolean {
  if (e.months && !e.months.includes(MONTH)) return false;
  if (!e.days) return true;
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

function upcomingCostBadge(cost: string): { label: string; bg: string; color: string } {
  if (cost === "free") return { label: "FREE", bg: "#D1FAE5", color: "#065F46" };
  if (cost === "low") return { label: "$", bg: "#FEF3C7", color: "#92400E" };
  return { label: "$$", bg: "#EDE9FE", color: "#5B21B6" };
}

// ── Discriminated union for today items ──────────────────────────────────────

type TodayItem =
  | { kind: "recurring"; data: SBEvent }
  | { kind: "upcoming"; data: UpcomingEvent };

// ── Compact recurring event row ───────────────────────────────────────────────

function EventRow({ event, showCity = true }: { event: SBEvent; showCity?: boolean }) {
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
          {showCity && <span>{cityLabel(event.city)}</span>}
          {event.time && (
            <>
              {showCity && <span style={{ color: "var(--sb-border)" }}>·</span>}
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

// ── Compact scraped event row ─────────────────────────────────────────────────

function ScrapedEventRow({ event, showCity = true }: { event: UpcomingEvent; showCity?: boolean }) {
  const badge = upcomingCostBadge(event.cost);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: "1px solid var(--sb-border-light)",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, width: 28, textAlign: "center" }}>
        📌
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
            {event.url ? (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {event.title}
              </a>
            ) : event.title}
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
          {event.time && <span>🕐 {event.time}</span>}
          {showCity && <span>{cityLabel(event.city)}</span>}
          {event.venue && event.venue !== cityLabel(event.city) && (
            <>
              <span style={{ color: "var(--sb-border)" }}>·</span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "200px",
                }}
              >
                {event.venue}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Unified today row ─────────────────────────────────────────────────────────

function TodayRow({ item, showCity = true }: { item: TodayItem; showCity?: boolean }) {
  if (item.kind === "upcoming") {
    return <ScrapedEventRow event={item.data} showCity={showCity} />;
  }
  return <EventRow event={item.data} showCity={showCity} />;
}

// ── This Month card ───────────────────────────────────────────────────────────

function MonthCard({ event, isUpcoming }: { event: SBEvent; isUpcoming?: boolean }) {
  const badge = costBadge(event);
  return (
    <div
      style={{
        background: "var(--sb-card)",
        border: "1px solid var(--sb-border-light)",
        borderRadius: "var(--sb-radius)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{event.emoji}</span>
        {isUpcoming ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#6B7280",
              background: "#F3F4F6",
              padding: "2px 7px",
              borderRadius: 3,
            }}
          >
            {NEXT_MONTH_NAME}
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#065F46",
              background: "#D1FAE5",
              padding: "2px 7px",
              borderRadius: 3,
            }}
          >
            {MONTH_NAME}
          </span>
        )}
      </div>
      <div>
        <span
          style={{
            fontFamily: "var(--sb-serif)",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--sb-ink)",
            lineHeight: 1.3,
            display: "block",
          }}
        >
          {event.title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--sb-muted)" }}>{cityLabel(event.city)}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: 3,
              background: badge.bg,
              color: badge.color,
              letterSpacing: "0.03em",
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--sb-muted)",
          lineHeight: 1.5,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {event.description}
      </p>
    </div>
  );
}

// ── City picker ───────────────────────────────────────────────────────────────

function CityPicker({
  homeCity,
  onSelect,
  onClose,
}: {
  homeCity: City | null;
  onSelect: (city: City) => void;
  onClose?: () => void;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--sb-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Pick your home city</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--sb-muted)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              padding: 0,
            }}
          >
            Cancel
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CITIES.map((city) => (
          <button
            key={city.id}
            onClick={() => onSelect(city.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 100,
              border: `1px solid ${homeCity === city.id ? "var(--sb-ink)" : "var(--sb-border)"}`,
              background: homeCity === city.id ? "var(--sb-ink)" : "var(--sb-card)",
              color: homeCity === city.id ? "white" : "var(--sb-muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  homeCity: City | null;
  setHomeCity: (city: City | null) => void;
}

export default function OverviewView({ homeCity, setHomeCity }: Props) {
  const [weather, setWeather] = useState<string | null>(null);
  const [changingCity, setChangingCity] = useState(false);
  const [showAllSouthBay, setShowAllSouthBay] = useState(false);

  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d) => setWeather(d.weather ?? null))
      .catch(() => {});
  }, []);

  // ── Today's events from scraped feed ──────────────────────────────────────
  const todayUpcoming = upcomingEvents.filter((e) => e.date === TODAY_ISO);

  // Seasonal events for "This Month" section
  const thisMonthEvents = SOUTH_BAY_EVENTS
    .filter((e) => e.recurrence === "seasonal" && e.months?.includes(MONTH))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 6);

  // Events starting next month (not yet active)
  const nextMonthPreview = SOUTH_BAY_EVENTS
    .filter(
      (e) =>
        e.recurrence === "seasonal" &&
        e.months?.includes(NEXT_MONTH) &&
        !e.months?.includes(MONTH),
    )
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 4);

  const showThisMonth = thisMonthEvents.length > 0 || nextMonthPreview.length > 0;

  // ── Your city today items (recurring + upcoming merged) ──────────────────
  const cityTodayItems: TodayItem[] = homeCity
    ? [
        ...SOUTH_BAY_EVENTS
          .filter((e) => e.city === homeCity && isActiveToday(e))
          .map((e) => ({ kind: "recurring" as const, data: e })),
        ...todayUpcoming
          .filter((e) => e.city === homeCity)
          .map((e) => ({ kind: "upcoming" as const, data: e })),
      ].sort((a, b) => {
        // Free first
        const aFree = a.data.cost === "free" ? 0 : 1;
        const bFree = b.data.cost === "free" ? 0 : 1;
        if (aFree !== bFree) return aFree - bFree;
        // Upcoming events: sort by time; recurring: featured first
        if (a.kind === "upcoming" && b.kind === "upcoming") {
          const at = a.data.time || "zz";
          const bt = b.data.time || "zz";
          return at.localeCompare(bt);
        }
        if (a.kind === "recurring" && b.kind === "recurring") {
          if (a.data.featured && !b.data.featured) return -1;
          if (!a.data.featured && b.data.featured) return 1;
        }
        return 0;
      })
    : [];

  // ── South Bay today items (excluding homeCity) ───────────────────────────
  const southBayTodayItems: TodayItem[] = [
    ...SOUTH_BAY_EVENTS
      .filter((e) => isActiveToday(e) && (homeCity ? e.city !== homeCity : true))
      .map((e) => ({ kind: "recurring" as const, data: e })),
    ...todayUpcoming
      .filter((e) => (homeCity ? e.city !== homeCity : true))
      .map((e) => ({ kind: "upcoming" as const, data: e })),
  ].sort((a, b) => {
    const aFree = a.data.cost === "free" ? 0 : 1;
    const bFree = b.data.cost === "free" ? 0 : 1;
    if (aFree !== bFree) return aFree - bFree;
    if (a.kind === "recurring" && b.kind === "recurring") {
      if (a.data.featured && !b.data.featured) return -1;
      if (!a.data.featured && b.data.featured) return 1;
    }
    if (a.kind === "upcoming" && b.kind === "upcoming") {
      const at = a.data.time || "zz";
      const bt = b.data.time || "zz";
      return at.localeCompare(bt);
    }
    return 0;
  });

  const SB_LIMIT = homeCity ? 6 : 8;
  const visibleSouthBay = showAllSouthBay
    ? southBayTodayItems
    : southBayTodayItems.slice(0, SB_LIMIT);

  return (
    <>
      {/* ── City prompt / picker ── */}
      {!homeCity && !changingCity ? (
        <div
          style={{
            background: "var(--sb-primary-light)",
            border: "1px solid var(--sb-border-light)",
            borderRadius: "var(--sb-radius)",
            padding: "12px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--sb-muted)", lineHeight: 1.4 }}>
            Personalize for your city — get a daily brief filtered to where you live.
          </span>
          <button
            onClick={() => setChangingCity(true)}
            style={{
              padding: "6px 14px",
              borderRadius: 100,
              border: "1px solid var(--sb-ink)",
              background: "var(--sb-ink)",
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Set my city →
          </button>
        </div>
      ) : changingCity ? (
        <CityPicker
          homeCity={homeCity}
          onSelect={(city) => {
            setHomeCity(city);
            setChangingCity(false);
          }}
          onClose={() => setChangingCity(false)}
        />
      ) : null}

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
          <span style={{ fontSize: 11, color: "var(--sb-muted)", letterSpacing: "0.04em" }}>
            · {homeCity ? getCityName(homeCity) : "South Bay"}, CA
          </span>
        </div>
      )}

      {/* ── Your City Today ── */}
      {homeCity && (
        <div style={{ marginBottom: 32 }}>
          <div
            className="sb-section-header"
            style={{ marginBottom: 16 }}
          >
            <span className="sb-section-title">Today in {getCityName(homeCity)}</span>
            {cityTodayItems.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--sb-muted)" }}>
                {cityTodayItems.length} {cityTodayItems.length === 1 ? "event" : "events"}
              </span>
            )}
            <button
              onClick={() => setChangingCity(true)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: 12,
                color: "var(--sb-muted)",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Change city
            </button>
          </div>
          {cityTodayItems.length === 0 ? (
            <div
              style={{
                padding: "16px 0",
                color: "var(--sb-muted)",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              No events found in {getCityName(homeCity)} today. Try the Events tab for the full calendar.
            </div>
          ) : (
            <>
              {cityTodayItems.slice(0, 8).map((item) => (
                <TodayRow key={item.kind === "upcoming" ? item.data.id : item.data.id} item={item} showCity={false} />
              ))}
              {cityTodayItems.length > 8 && (
                <div style={{ paddingTop: 10, fontSize: 12, color: "var(--sb-muted)" }}>
                  +{cityTodayItems.length - 8} more in{" "}
                  <span style={{ fontWeight: 600, color: "var(--sb-ink)" }}>{getCityName(homeCity)}</span>{" "}
                  — see the Events tab for the full list.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── This Month in the South Bay ── */}
      {showThisMonth && (
        <div style={{ marginBottom: 32 }}>
          <div className="sb-section-header" style={{ marginBottom: 16 }}>
            <span className="sb-section-title">This Month</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--sb-accent)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {MONTH_NAME}
            </span>
            <div className="sb-section-line" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {thisMonthEvents.map((e) => (
              <MonthCard key={e.id} event={e} />
            ))}
            {nextMonthPreview.map((e) => (
              <MonthCard key={e.id} event={e} isUpcoming />
            ))}
          </div>
        </div>
      )}

      {/* ── Happening Today, South Bay ── */}
      <div style={{ marginBottom: 32 }}>
        <div className="sb-section-header" style={{ marginBottom: 0 }}>
          <span className="sb-section-title">
            {homeCity ? "Across the South Bay" : "Happening Today"}
          </span>
          {southBayTodayItems.length > 0 && (
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--sb-muted)" }}>
              {southBayTodayItems.length} {southBayTodayItems.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>

        {southBayTodayItems.length === 0 ? (
          <div
            style={{
              padding: "20px 0",
              color: "var(--sb-muted)",
              fontSize: 14,
              fontStyle: "italic",
            }}
          >
            {homeCity
              ? `No events found across the region today (${WEEKDAY}).`
              : `No recurring events on ${WEEKDAY}s this time of year.`}
          </div>
        ) : (
          <>
            {visibleSouthBay.map((item) => (
              <TodayRow key={item.kind === "upcoming" ? item.data.id : item.data.id} item={item} />
            ))}
            {southBayTodayItems.length > SB_LIMIT && !showAllSouthBay && (
              <button
                onClick={() => setShowAllSouthBay(true)}
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
                Show {southBayTodayItems.length - SB_LIMIT} more events →
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Government teaser ── */}
      <div
        style={{
          marginBottom: 32,
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
        {" — "}AI-powered plain-English digests for 8 South Bay cities — including San José, Mountain View, Sunnyvale, and Cupertino. What your city council decided, without reading the agenda.
      </div>

      {/* ── Sports scoreboard ── */}
      <SportsView />
    </>
  );
}
