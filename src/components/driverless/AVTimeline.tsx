import { useState } from "react";

interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
  type: "milestone" | "launch" | "setback" | "policy";
}

const events: TimelineEvent[] = [
  { date: "2004", title: "DARPA Grand Challenge", detail: "No vehicle finishes the 142-mile desert course. The best entry travels 7.3 miles before getting stuck.", type: "milestone" },
  { date: "2005", title: "Stanford wins DARPA Grand Challenge", detail: "Five vehicles complete the full course. Stanford's Stanley wins, finishing in 6h 53m. The era of autonomous driving research begins.", type: "milestone" },
  { date: "2009", title: "Google launches secret AV project", detail: "A small team begins testing self-driving Priuses on California roads. The project is kept confidential for two years.", type: "milestone" },
  { date: "2012", title: "First AV driver's license issued", detail: "Nevada grants Google a license to test its self-driving car on public roads — the first of its kind in the US.", type: "policy" },
  { date: "Dec 2016", title: "Waymo spun out of Google", detail: "Alphabet separates its self-driving car project into a standalone company called Waymo. It begins testing a fully custom vehicle with no steering wheel.", type: "milestone" },
  { date: "Nov 2017", title: "Fully driverless testing begins", detail: "Waymo starts testing its Chrysler Pacifica minivans with no human behind the wheel on public roads in Chandler, AZ.", type: "milestone" },
  { date: "Dec 2018", title: "Waymo One launches", detail: "The world's first commercial driverless rideshare service opens to the public in Phoenix, AZ. No safety driver. No steering wheel takeovers.", type: "launch" },
  { date: "2019", title: "Cruise & Nuro join the race", detail: "GM-backed Cruise begins passenger testing in San Francisco. Nuro deploys its small delivery robots in Houston for grocery delivery.", type: "launch" },
  { date: "2021", title: "Cruise launches paid rides in SF", detail: "Cruise opens driverless paid service in San Francisco, the most complex urban environment yet for autonomous vehicles.", type: "launch" },
  { date: "Feb 2022", title: "California permits 24/7 AV service", detail: "Both Waymo and Cruise receive permits to operate driverless vehicles day and night in San Francisco with no charge to riders.", type: "policy" },
  { date: "Aug 2023", title: "Cruise incident in San Francisco", detail: "A Cruise robotaxi drags a pedestrian 20 feet after a collision. GM suspends all operations. The California DMV revokes Cruise's permit.", type: "setback" },
  { date: "Oct 2023", title: "Waymo surpasses 1 million rides", detail: "Waymo One hits the milestone of 1M cumulative passenger trips across Phoenix and San Francisco.", type: "milestone" },
  { date: "Mar 2024", title: "Cruise shuts down", detail: "GM officially closes Cruise after the San Francisco incident. Over 900 employees are laid off. The Cruise brand is retired.", type: "setback" },
  { date: "Apr 2024", title: "Nuro suspends operations", detail: "The delivery-robot startup suspends operations citing capital constraints. Most employees are laid off, ending commercial delivery service.", type: "setback" },
  { date: "Apr 2024", title: "Aurora's driverless freight goes live", detail: "Aurora launches commercial self-driving semi-truck service between Dallas and Houston — the first driverless freight operation on US public highways.", type: "launch" },
  { date: "Jun 2024", title: "Waymo opens Los Angeles", detail: "Waymo One expands to LA — the largest and most traffic-heavy city in the US. Waitlist opens for the general public.", type: "launch" },
  { date: "Dec 2024", title: "Waymo hits 100K rides/week", detail: "Weekly ride volume crosses 100,000 across all markets. Austin and Atlanta are added, bringing the total to five US cities.", type: "milestone" },
  { date: "Jan 2025", title: "Zoox launches in San Francisco", detail: "Amazon-backed Zoox begins limited public rides in SF in its purpose-built vehicle — a boxy pod that drives in both directions with no front or back.", type: "launch" },
  { date: "Apr 2025", title: "Waymo announces Mesa factory", detail: "Waymo breaks ground on a manufacturing facility in Mesa, AZ to scale production of its custom Waymo Driver hardware.", type: "milestone" },
  { date: "Oct 2025", title: "Waymo crosses 300K rides/week", detail: "Ride volume hits a new high. The company announces Miami as its next market. Total cumulative rides top 20 million.", type: "milestone" },
  { date: "Feb 2026", title: "Waymo launches 6th-generation hardware", detail: "The newest Waymo Driver platform brings improved sensor range and full hardware redundancy. Retrofits begin across the existing fleet.", type: "milestone" },
  { date: "Mar 2026", title: "500K rides per week", detail: "Waymo reaches half a million rides per week across San Francisco, Los Angeles, Phoenix, Austin, Atlanta, and Miami. Expansion to Dallas and Nashville is next.", type: "milestone" },
  { date: "Apr 2026", title: "Tesla launches paid unsupervised robotaxi rides", detail: "Tesla begins offering paid robotaxi service in Austin with no safety driver — the company's first true Level 4 deployment after years of driver-assist (L2+). The geo-fenced pilot uses a fleet of Cybercabs and marks Tesla's entry into fully driverless commercial rides.", type: "launch" },
];

const typeConfig = {
  milestone: { color: "#3b82f6", bg: "#eff6ff", label: "Milestone" },
  launch:    { color: "#16a34a", bg: "#f0fdf4", label: "Launch" },
  setback:   { color: "#ef4444", bg: "#fef2f2", label: "Setback" },
  policy:    { color: "#d97706", bg: "#fffbeb", label: "Policy" },
};

type EventType = keyof typeof typeConfig;

const ALL_TYPES: EventType[] = ["milestone", "launch", "setback", "policy"];

export default function AVTimeline() {
  const [activeFilter, setActiveFilter] = useState<EventType | null>(null);

  const filtered = activeFilter ? events.filter((e) => e.type === activeFilter) : events;

  const countOf = (type: EventType) => events.filter((e) => e.type === type).length;

  return (
    <div className="dl-panel dl-full">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">The Road So Far</h2>
        <span className="dl-panel-subtitle">Key moments in autonomous vehicle history, 2004–2026</span>
      </div>

      {/* Filter buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveFilter(null)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 6,
            border: "1.5px solid",
            cursor: "pointer",
            transition: "all 0.12s",
            borderColor: activeFilter === null ? "var(--dl-ink)" : "var(--dl-border)",
            background: activeFilter === null ? "var(--dl-ink)" : "transparent",
            color: activeFilter === null ? "#fff" : "var(--dl-muted)",
          }}
        >
          All {events.length}
        </button>
        {ALL_TYPES.map((type) => {
          const cfg = typeConfig[type];
          const isActive = activeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(isActive ? null : type)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 12px",
                borderRadius: 6,
                border: "1.5px solid",
                cursor: "pointer",
                transition: "all 0.12s",
                borderColor: isActive ? cfg.color : "var(--dl-border)",
                background: isActive ? cfg.bg : "transparent",
                color: isActive ? cfg.color : "var(--dl-muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, flexShrink: 0, display: "inline-block" }} />
              {cfg.label}
              <span style={{
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
                background: isActive ? cfg.color : "var(--dl-border)",
                color: isActive ? "#fff" : "var(--dl-muted)",
                borderRadius: 10,
                padding: "1px 6px",
                lineHeight: 1.4,
              }}>{countOf(type)}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 4 }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute",
          left: 15,
          top: 8,
          bottom: 8,
          width: 2,
          background: "var(--dl-border)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.map((ev, i) => {
            const cfg = typeConfig[ev.type];
            return (
              <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 16, alignItems: "flex-start" }}>
                {/* Dot */}
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: cfg.color,
                  flexShrink: 0,
                  marginTop: 3,
                  zIndex: 1,
                  boxShadow: `0 0 0 3px ${cfg.bg}`,
                  marginLeft: 9,
                }} />

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                      color: cfg.color,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}>{ev.date}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--dl-ink)" }}>{ev.title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--dl-muted)", margin: "4px 0 0", lineHeight: 1.55 }}>
                    {ev.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
