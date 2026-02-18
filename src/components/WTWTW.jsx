import { useEffect, useMemo, useState } from "react";

const PT_TZ = "America/Los_Angeles";

const PRIORITY = [
  { key: "steelers", label: "Steelers", league: "football/nfl", color: "#FFB81C", textColor: "#FFB81C" },
  { key: "michigan", label: "Michigan", league: "basketball/mens-college-basketball", color: "#FFCB05", textColor: "#FFCB05" },
  { key: "warriors", label: "Warriors", league: "basketball/nba", color: "#1D428A", textColor: "#6B9BFF" },
  { key: "valkyries", label: "Valkyries", league: "basketball/wnba", color: "#702F8A", textColor: "#C085E0" },
  { key: "cubs", label: "Cubs", league: "baseball/mlb", color: "#CC3433", textColor: "#FF6B6B" },
  { key: "giants", label: "Giants", league: "baseball/mlb", color: "#FD5A1E", textColor: "#FD5A1E" },
];

function teamMatcher(priorityKey, league) {
  return (competitor) => {
    const name = (competitor?.team?.displayName || "").toLowerCase();
    const abbr = (competitor?.team?.abbreviation || "").toUpperCase();

    if (priorityKey === "steelers" && league.includes("football/nfl"))
      return name.includes("steelers") || abbr === "PIT";
    if (priorityKey === "michigan" && league.includes("basketball/mens-college-basketball"))
      return name === "michigan wolverines" || abbr === "MICH";
    if (priorityKey === "warriors" && league.includes("basketball/nba"))
      return name.includes("warriors") || abbr === "GS" || abbr === "GSW";
    if (priorityKey === "valkyries" && league.includes("basketball/wnba"))
      return name.includes("valkyries") || name.includes("golden state valkyries");
    if (priorityKey === "cubs" && league.includes("baseball/mlb"))
      return name.includes("cubs") || abbr === "CHC";
    if (priorityKey === "giants" && league.includes("baseball/mlb"))
      return name.includes("giants") || abbr === "SF" || abbr === "SFG";
    return false;
  };
}

function formatPT(iso) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: PT_TZ,
  }).format(new Date(iso));
}

function hitsWindowPT(isoStart) {
  const d = new Date(isoStart);
  const [hhStr, mmStr] = new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .split(":");

  const startMin = parseInt(hhStr, 10) * 60 + parseInt(mmStr, 10);
  const endMin = startMin + 180;
  const windowStart = 17 * 60;
  const windowEnd = 20 * 60;

  return startMin < windowEnd && endMin > windowStart;
}

async function fetchScoreboard(leaguePath, yyyymmdd) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${leaguePath}/scoreboard?dates=${yyyymmdd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${leaguePath} ${yyyymmdd}`);
  return res.json();
}

function getUpcoming7Days() {
  const nowPT = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: PT_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(nowPT);
    d.setDate(nowPT.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "long" }),
      yyyymmdd: `${yyyy}${mm}${dd}`,
    });
  }
  return days;
}

function pickEventForDay(dayEvents) {
  const candidates = [];
  for (const { leaguePath, event } of dayEvents) {
    const comps = event?.competitions?.[0]?.competitors || [];
    for (const pri of PRIORITY) {
      if (!leaguePath.includes(pri.league)) continue;
      if (comps.some(teamMatcher(pri.key, leaguePath)) && hitsWindowPT(event.date)) {
        candidates.push({
          priorityIndex: PRIORITY.indexOf(pri),
          pri,
          event,
        });
        break;
      }
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) =>
      a.priorityIndex - b.priorityIndex ||
      new Date(a.event.date) - new Date(b.event.date)
  );
  return candidates[0];
}

export default function WTWTW() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [picks, setPicks] = useState([]);

  const days = useMemo(() => getUpcoming7Days(), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const leaguePaths = [...new Set(PRIORITY.map((p) => p.league))];
        const results = [];
        for (const day of days) {
          const jsons = await Promise.all(
            leaguePaths.map((lp) =>
              fetchScoreboard(lp, day.yyyymmdd)
                .then((j) => ({ lp, j }))
                .catch(() => ({ lp, j: null }))
            )
          );
          const dayEvents = [];
          for (const { lp, j } of jsons) {
            for (const ev of j?.events || [])
              dayEvents.push({ leaguePath: lp, event: ev });
          }
          results.push({ day, pick: pickEventForDay(dayEvents) });
        }
        if (alive) setPicks(results);
      } catch (e) {
        if (alive) setError(e?.message || String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [days]);

  return (
    <div className="mt-8 grid gap-4">
      {loading && (
        <div
          className="animate-pulse rounded-2xl p-5 text-white/40"
          style={{
            background: "#111D32",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.875rem",
          }}
        >
          Loading schedules...
        </div>
      )}
      {error && (
        <div
          className="rounded-2xl p-5 text-sm"
          style={{ background: "rgba(204, 52, 51, 0.15)", color: "#FF6B6B", borderLeft: "4px solid #CC3433" }}
        >
          {error}
        </div>
      )}
      {picks.map(({ day, pick }) => (
        <div
          key={day.yyyymmdd}
          className="rounded-2xl p-5 transition-all duration-200 hover:translate-y-[-2px]"
          style={{
            background: pick ? "#111D32" : "#0f1a2e",
            borderLeft: pick ? `4px solid ${pick.pri.color}` : "4px solid #1a2744",
            boxShadow: pick ? `0 4px 20px ${pick.pri.color}10` : "none",
          }}
        >
          <div
            className="text-sm font-bold uppercase tracking-widest"
            style={{
              fontFamily: "'Oswald', sans-serif",
              color: pick ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
              fontSize: "0.8rem",
              letterSpacing: "0.15em",
            }}
          >
            {day.label}
          </div>
          {pick ? (
            <div className="mt-3">
              <div
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {pick.event?.name || "Game"}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {formatPT(pick.event?.date)} PT
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${pick.pri.color}20`,
                    color: pick.pri.textColor,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: pick.pri.color }}
                  />
                  {pick.pri.label}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="mt-2 text-sm"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Nothing in the 5&ndash;8 PM window.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
