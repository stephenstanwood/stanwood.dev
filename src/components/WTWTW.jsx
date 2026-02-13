import { useEffect, useMemo, useState } from "react";

const PT_TZ = "America/Los_Angeles";

const PRIORITY = [
  { key: "steelers", label: "Steelers (NFL)", league: "football/nfl" },
  { key: "warriors", label: "Warriors (NBA)", league: "basketball/nba" },
  { key: "valkyries", label: "Valkyries (WNBA)", league: "basketball/wnba" },
  { key: "cubs", label: "Cubs (MLB)", league: "baseball/mlb" },
  { key: "giants", label: "Giants (MLB)", league: "baseball/mlb" },
];

function teamMatcher(priorityKey, league) {
  return (competitor) => {
    const name = (competitor?.team?.displayName || "").toLowerCase();
    const abbr = (competitor?.team?.abbreviation || "").toUpperCase();

    if (priorityKey === "steelers" && league.includes("football/nfl"))
      return name.includes("steelers") || abbr === "PIT";
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
    <div className="mt-6 grid gap-4">
      {loading && (
        <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-500">
          Loading schedules...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}
      {picks.map(({ day, pick }) => (
        <div
          key={day.yyyymmdd}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {day.label}
          </div>
          {pick ? (
            <div className="mt-2">
              <div className="text-lg font-semibold text-neutral-900">
                {pick.event?.name || "Game"}
              </div>
              <div className="mt-1 text-sm text-neutral-600">
                {formatPT(pick.event?.date)} PT
              </div>
              <div className="mt-2 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                {pick.pri.label}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-neutral-500">
              Nothing in the 5-8pm PT window.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
