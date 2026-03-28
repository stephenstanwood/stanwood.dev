import { useState, useMemo } from "react";
import type { City } from "../../../lib/south-bay/types";
import {
  SOUTH_BAY_EVENTS,
  EVENT_CATEGORIES,
  type SBEvent,
  type EventCategory,
} from "../../../data/south-bay/events-data";

interface Props {
  selectedCities: Set<City>;
  homeCity: City | null;
}

type TimeFilter = "all" | "today" | "weekend" | "weekday";

const DAY_NAMES: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function isEventActiveToday(event: SBEvent, now: Date): boolean {
  const month = now.getMonth() + 1;
  if (event.months && !event.months.includes(month)) return false;
  if (!event.days) return true; // ongoing
  return event.days.includes(
    ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()] as SBEvent["days"] extends (infer T)[] ? T : never
  );
}

function isEventThisWeekend(event: SBEvent, now: Date): boolean {
  const month = now.getMonth() + 1;
  if (event.months && !event.months.includes(month)) return false;
  if (!event.days) return true; // ongoing
  return event.days.some((d) => d === "saturday" || d === "sunday");
}

function isEventWeekday(event: SBEvent, _now: Date): boolean {
  if (!event.days) return true;
  return event.days.some(
    (d) => d !== "saturday" && d !== "sunday",
  );
}

function costBadge(cost: SBEvent["cost"], note?: string): string {
  if (cost === "free") return "FREE";
  if (cost === "low") return note ? note.split(" ")[0] : "$";
  return note ? note.split(" ")[0] : "$$";
}

function recurrenceLabel(event: SBEvent): string {
  if (event.recurrence === "ongoing") return "Always open";
  if (event.recurrence === "seasonal") {
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (event.months) {
      return `${monthNames[(event.months[0] ?? 1) - 1]}–${monthNames[(event.months[event.months.length - 1] ?? 12) - 1]}`;
    }
    return "Seasonal";
  }
  if (event.recurrence === "monthly") return "Monthly";
  if (event.recurrence === "biweekly") return "Every 2 weeks";
  if (event.days) {
    if (event.days.length === 1) {
      return `Every ${event.days[0].charAt(0).toUpperCase() + event.days[0].slice(1)}`;
    }
    return `${event.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}`;
  }
  return "Weekly";
}

function EventCard({ event }: { event: SBEvent }) {
  const isFree = event.cost === "free";
  const isLow = event.cost === "low";
  const now = new Date();
  const activeToday = isEventActiveToday(event, now);

  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${event.featured ? "var(--sb-border)" : "var(--sb-border-light)"}`,
        borderRadius: "var(--sb-radius-lg, 6px)",
        padding: "14px 16px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        transition: "box-shadow 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--sb-shadow-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Emoji */}
      <span style={{ fontSize: "24px", lineHeight: 1, flexShrink: 0, marginTop: "1px" }}>
        {event.emoji}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "3px" }}>
          <div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--sb-ink)",
                lineHeight: 1.3,
                display: "block",
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
          </div>

          {/* Cost badge */}
          <span
            style={{
              flexShrink: 0,
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.04em",
              padding: "2px 7px",
              borderRadius: "3px",
              background: isFree ? "#F0FDF4" : isLow ? "#FFF7ED" : "#F5F3FF",
              color: isFree ? "#166534" : isLow ? "#92400E" : "#5B21B6",
              border: `1px solid ${isFree ? "#BBF7D0" : isLow ? "#FDE68A" : "#DDD6FE"}`,
            }}
          >
            {costBadge(event.cost, event.costNote)}
          </span>
        </div>

        {/* Meta line */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 10px",
            fontSize: "11px",
            color: "var(--sb-muted)",
            marginBottom: "6px",
          }}
        >
          <span>📍 {event.city.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}</span>
          <span>📅 {recurrenceLabel(event)}</span>
          {event.time && <span>🕐 {event.time}</span>}
          {event.kidFriendly && <span>👶 Kid-friendly</span>}
          {activeToday && (
            <span style={{ color: "#16803C", fontWeight: 600 }}>✓ Today</span>
          )}
        </div>

        {/* Description */}
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            lineHeight: 1.55,
            color: "var(--sb-muted)",
          }}
        >
          {event.description}
        </p>

        {event.costNote && event.cost !== "free" && (
          <div style={{ fontSize: "11px", color: "var(--sb-light)", marginTop: "4px" }}>
            {event.costNote}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsView({ selectedCities, homeCity }: Props) {
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [search, setSearch] = useState("");
  const [showKidsOnly, setShowKidsOnly] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const filtered = useMemo(() => {
    const allCitiesSelected = selectedCities.size === 11; // all cities
    return SOUTH_BAY_EVENTS.filter((e) => {
      // City filter
      if (!allCitiesSelected && !selectedCities.has(e.city)) return false;

      // Month / season filter
      if (e.months && !e.months.includes(currentMonth)) return false;

      // Category filter
      if (category !== "all" && e.category !== category) return false;

      // Time filter
      if (timeFilter === "today" && !isEventActiveToday(e, now)) return false;
      if (timeFilter === "weekend" && !isEventThisWeekend(e, now)) return false;
      if (timeFilter === "weekday" && !isEventWeekday(e, now)) return false;

      // Kids filter
      if (showKidsOnly && !e.kidFriendly) return false;

      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.title.toLowerCase().includes(q) &&
          !e.description.toLowerCase().includes(q) &&
          !e.city.toLowerCase().includes(q) &&
          !e.venue.toLowerCase().includes(q)
        )
          return false;
      }

      return true;
    }).sort((a, b) => {
      // Home city first, then featured, then rest
      const primary = homeCity ?? "san-jose";
      const aHome = a.city === primary ? 1 : 0;
      const bHome = b.city === primary ? 1 : 0;
      if (aHome !== bHome) return bHome - aHome;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [selectedCities, category, timeFilter, showKidsOnly, search, currentMonth, homeCity]);

  const todayCount = SOUTH_BAY_EVENTS.filter((e) => {
    if (e.months && !e.months.includes(currentMonth)) return false;
    return isEventActiveToday(e, now);
  }).length;

  return (
    <>
      <div className="sb-section-header">
        <span className="sb-section-title">
          Events
          <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--sb-muted)", marginLeft: "8px" }}>
            {todayCount} happening today
          </span>
        </span>
        <div className="sb-section-line" />
      </div>

      {/* Search */}
      <div style={{ marginBottom: "12px" }}>
        <input
          type="search"
          placeholder="Search events, venues, cities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: "1.5px solid var(--sb-border)",
            borderRadius: "var(--sb-radius-lg, 6px)",
            fontFamily: "inherit",
            fontSize: "13px",
            background: "#fff",
            color: "var(--sb-ink)",
            boxSizing: "border-box",
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--sb-primary)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--sb-border)")}
        />
      </div>

      {/* Category pills */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          marginBottom: "10px",
        }}
      >
        {EVENT_CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as EventCategory | "all")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                border: `1.5px solid ${active ? "var(--sb-primary)" : "var(--sb-border)"}`,
                borderRadius: "100px",
                background: active ? "var(--sb-primary)" : "#fff",
                color: active ? "#fff" : "var(--sb-muted)",
                fontSize: "12px",
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.12s",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick filters row */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {(["all", "today", "weekend", "weekday"] as TimeFilter[]).map((tf) => {
          const labels: Record<TimeFilter, string> = {
            all: "All",
            today: "Today",
            weekend: "Weekend",
            weekday: "Weekday",
          };
          const active = timeFilter === tf;
          return (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              style={{
                padding: "3px 10px",
                border: `1px solid ${active ? "var(--sb-accent)" : "var(--sb-border)"}`,
                borderRadius: "4px",
                background: active ? "var(--sb-accent)" : "transparent",
                color: active ? "#fff" : "var(--sb-muted)",
                fontSize: "11px",
                fontWeight: active ? 700 : 400,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {labels[tf]}
            </button>
          );
        })}

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            color: "var(--sb-muted)",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={showKidsOnly}
            onChange={(e) => setShowKidsOnly(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          👶 Kids only
        </label>

        <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--sb-light)", fontFamily: "'Space Mono', monospace" }}>
          {filtered.length} events
        </span>
      </div>

      {/* Event cards */}
      {filtered.length === 0 ? (
        <div className="sb-empty">
          <div className="sb-empty-title">No events match</div>
          <div className="sb-empty-sub">
            Try broadening your filters or selecting more cities
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Contribute notice */}
      <div
        style={{
          marginTop: "20px",
          padding: "12px 14px",
          background: "var(--sb-card)",
          border: "1px dashed var(--sb-border)",
          borderRadius: "var(--sb-radius-lg, 6px)",
          fontSize: "12px",
          color: "var(--sb-light)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--sb-muted)" }}>More events coming.</strong>{" "}
        Live event calendar integration, ticketed shows, and one-off events are on the roadmap.
        Events data covers {SOUTH_BAY_EVENTS.length} recurring and ongoing events across the South Bay.
      </div>
    </>
  );
}
