import SportsView from "./SportsView";
import { SOUTH_BAY_EVENTS } from "../../../data/south-bay/events-data";

function todayEventCount(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  const dayName = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()];
  return SOUTH_BAY_EVENTS.filter((e) => {
    if (e.months && !e.months.includes(month)) return false;
    if (!e.days) return true;
    return e.days.includes(dayName as Parameters<typeof SOUTH_BAY_EVENTS[0]["days"] extends undefined ? never : NonNullable<typeof SOUTH_BAY_EVENTS[0]["days"]>[0] extends infer T ? (s: T) => void : never>[0]);
  }).length;
}

export default function OverviewView() {
  const eventCount = SOUTH_BAY_EVENTS.filter((e) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (e.months && !e.months.includes(month)) return false;
    if (!e.days) return true;
    const dayName = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][now.getDay()];
    return e.days.includes(dayName as any);
  }).length;

  return (
    <>
      {/* Sports section — show the full scoreboard on overview for now */}
      <SportsView />

      {/* Events + Government teasers */}
      <div style={{ marginTop: 24 }} className="sb-overview-grid">
        <div className="sb-overview-section">
          <h3>
            Events{" "}
            <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--sb-muted)" }}>
              — {eventCount} happening today
            </span>
          </h3>
          <p style={{ color: "var(--sb-muted)", fontSize: 13, margin: "0 0 8px" }}>
            Farmers markets, outdoor parks, arts, family activities, Stanford events,
            live music, and sports venues across all 11 cities.
          </p>
        </div>
        <div className="sb-overview-section">
          <h3>Government</h3>
          <p style={{ color: "var(--sb-muted)", fontSize: 13, margin: "0 0 8px" }}>
            AI-powered council digests for Campbell, Saratoga, and Los Altos.
            Plain-English summaries of what your city council decided.
          </p>
        </div>
      </div>
    </>
  );
}
