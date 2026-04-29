interface RaceEntry {
  company: string;
  date: string;          // first paid driverless ride
  city: string;
  yearNum: number;       // for bar position (decimal year)
  status: "active" | "shut-down";
  scale: string;         // current scale, one short line
  yearsBehind: number | null; // years after Waymo's debut, null = leader
}

const FIRST = 2018 + 11 / 12; // Dec 2018 (Waymo)
const LAST = 2026 + 4 / 12;   // Apr 2026 (Tesla)
const SPAN = LAST - FIRST;

const entries: RaceEntry[] = [
  {
    company: "Waymo",
    date: "Dec 2018",
    city: "Phoenix",
    yearNum: 2018 + 11 / 12,
    status: "active",
    scale: "550K rides/wk · 6 cities",
    yearsBehind: null,
  },
  {
    company: "Cruise",
    date: "Feb 2022",
    city: "San Francisco",
    yearNum: 2022 + 1 / 12,
    status: "shut-down",
    scale: "Shut down Mar 2024",
    yearsBehind: 3.2,
  },
  {
    company: "Aurora",
    date: "Apr 2024",
    city: "Dallas ↔ Houston",
    yearNum: 2024 + 3 / 12,
    status: "active",
    scale: "200 trucks · freight only",
    yearsBehind: 5.3,
  },
  {
    company: "Zoox",
    date: "Jan 2025",
    city: "San Francisco",
    yearNum: 2025,
    status: "active",
    scale: "50 vehicles · invite-only",
    yearsBehind: 6.1,
  },
  {
    company: "Tesla",
    date: "Apr 2026",
    city: "Austin",
    yearNum: 2026 + 3 / 12,
    status: "active",
    scale: "Cybercab pilot · invite-only",
    yearsBehind: 7.3,
  },
];

const colorFor = (status: RaceEntry["status"]) =>
  status === "shut-down" ? "var(--dl-red)" : "var(--dl-accent)";

export default function L4Race() {
  return (
    <div className="dl-panel dl-full">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">First-to-L4 Race</h2>
        <span className="dl-panel-subtitle">First paid driverless ride, by company</span>
      </div>

      <p style={{
        fontSize: 12,
        color: "var(--dl-muted)",
        margin: 0,
        lineHeight: 1.55,
      }}>
        Eight years separate Waymo's first paid driverless ride from Tesla's. Each row marks the day the company's
        first commercial passenger or freight trip ran with <strong style={{ color: "var(--dl-ink)" }}>no human at the wheel</strong>.
      </p>

      {/* Year axis */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        color: "var(--dl-muted)",
        letterSpacing: "0.05em",
        padding: "0 8px",
        marginBottom: -4,
      }}>
        <span>2018</span>
        <span>2020</span>
        <span>2022</span>
        <span>2024</span>
        <span>2026</span>
      </div>

      {/* Race tracks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map((e) => {
          const pct = ((e.yearNum - FIRST) / SPAN) * 100;
          const color = colorFor(e.status);
          return (
            <div
              key={e.company}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(70px, 90px) 1fr",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--dl-ink)",
                  lineHeight: 1.1,
                }}>
                  {e.company}
                </div>
                <div style={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  color: "var(--dl-muted)",
                  marginTop: 2,
                }}>
                  {e.yearsBehind === null ? "leader" : `+${e.yearsBehind.toFixed(1)} yrs`}
                </div>
              </div>

              <div style={{
                position: "relative",
                background: "var(--dl-bg)",
                borderRadius: 8,
                padding: "10px 12px",
                minHeight: 56,
              }}>
                {/* Track line */}
                <div style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  top: "50%",
                  height: 2,
                  background: "var(--dl-border)",
                  borderRadius: 1,
                  transform: "translateY(-50%)",
                }} />

                {/* Filled bar to position */}
                <div style={{
                  position: "absolute",
                  left: 12,
                  width: `calc(${pct}% - 12px + ${pct > 0 ? "0px" : "0px"})`,
                  top: "50%",
                  height: 2,
                  background: color,
                  borderRadius: 1,
                  transform: "translateY(-50%)",
                  opacity: e.status === "shut-down" ? 0.5 : 0.8,
                }} />

                {/* Marker pill */}
                <div style={{
                  position: "absolute",
                  left: `calc(12px + (100% - 24px) * ${pct / 100})`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: e.status === "shut-down" ? "#fef2f2" : "#fff",
                  border: `1.5px solid ${color}`,
                  color: color,
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  textDecoration: e.status === "shut-down" ? "line-through" : "none",
                }}>
                  {e.date}
                </div>

                {/* Detail row underneath */}
                <div style={{
                  position: "absolute",
                  bottom: 4,
                  left: 12,
                  right: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 11,
                  color: "var(--dl-muted)",
                  pointerEvents: "none",
                }}>
                  <span style={{ color: e.status === "shut-down" ? "var(--dl-red)" : "var(--dl-ink)", fontWeight: 500 }}>
                    {e.city}
                  </span>
                  <span style={{ textAlign: "right", opacity: 0.85 }}>
                    {e.scale}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{
        fontSize: 11,
        color: "var(--dl-muted)",
        margin: 0,
        lineHeight: 1.5,
        paddingTop: 4,
        borderTop: "1px dashed var(--dl-border)",
      }}>
        L4 = Level 4 autonomy: no human required inside the operating area. Driver-assist (L2+) systems like
        Tesla's older FSD or GM Super Cruise don't count — they need a licensed human ready to take over.
      </p>
    </div>
  );
}
