import { useEffect, useMemo, useState } from "react";
import {
  type TeamEntry,
  LEAGUES,
  TEAM_REGISTRY,
  getTeam,
  getTeamsByLeague,
} from "../lib/teamRegistry";
import { safeGet, safeSet } from "../lib/localStorage";
import { fetchEspnScoreboard, formatYYYYMMDD } from "../lib/sportsCore";

// ── Types ──────────────────────────────────────────────────────────────────

interface DayInfo {
  label: string;
  yyyymmdd: string;
}

interface ESPNCompetitor {
  team?: {
    displayName?: string;
    abbreviation?: string;
  };
  homeAway?: string;
  score?: string;
}

interface ESPNGameStatus {
  type?: {
    name?: string;
    shortDetail?: string;
    description?: string;
  };
  displayClock?: string;
  period?: number;
}

interface ESPNEvent {
  date: string;
  name?: string;
  competitions?: Array<{
    competitors?: ESPNCompetitor[];
    status?: ESPNGameStatus;
    broadcasts?: Array<{ names?: string[] }>;
  }>;
}

interface Candidate {
  priorityIndex: number;
  team: TeamEntry;
  event: ESPNEvent;
}

interface DayPick {
  day: DayInfo;
  pick: Candidate | null;
  others: Candidate[];
}

interface WTWTWPrefs {
  teams: string[]; // ordered TeamEntry keys
  timezone: string; // IANA timezone
}

// ── Timezones ──────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York";
  }
}

function tzAbbr(iana: string): string {
  const match = TIMEZONE_OPTIONS.find((o) => o.value === iana);
  return match ? match.label : iana.split("/").pop()?.replace(/_/g, " ") || iana;
}

// ── localStorage ───────────────────────────────────────────────────────────

const LS_KEY = "wtwtw:v1";

function loadPrefs(): WTWTWPrefs {
  const parsed = safeGet<{ teams: unknown; timezone: unknown }>(LS_KEY);
  if (parsed && Array.isArray(parsed.teams) && typeof parsed.timezone === "string") {
    const valid = (parsed.teams as string[]).filter(
      (k) => TEAM_REGISTRY[k] !== undefined
    );
    return { teams: valid, timezone: parsed.timezone };
  }
  return { teams: [], timezone: getDefaultTimezone() };
}

function savePrefs(prefs: WTWTWPrefs): void {
  safeSet(LS_KEY, prefs);
}

// ── ESPN helpers ────────────────────────────────────────────────────────────

function formatTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(new Date(iso));
}

function hitsWindow(isoStart: string, tz: string): boolean {
  const startDate = new Date(isoStart);
  const [hhStr, mmStr] = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(startDate)
    .split(":");

  const startMin = parseInt(hhStr, 10) * 60 + parseInt(mmStr, 10);
  const endMin = startMin + 180;
  const windowStart = 17 * 60;
  const windowEnd = 23 * 60 + 30;

  return startMin < windowEnd && endMin > windowStart;
}

function getUpcoming7Days(tz: string): DayInfo[] {
  const nowLocal = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );

  const days: DayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(nowLocal);
    dayDate.setDate(nowLocal.getDate() + i);
    days.push({
      label: dayDate.toLocaleDateString("en-US", { weekday: "long" }),
      yyyymmdd: formatYYYYMMDD(dayDate),
    });
  }
  return days;
}

function pickEventsForDay(
  dayEvents: Array<{ leaguePath: string; event: ESPNEvent }>,
  teams: TeamEntry[],
  tz: string
): { top: Candidate | null; others: Candidate[] } {
  const candidates: Candidate[] = [];
  const seenEventIds = new Set<string>();

  for (const { leaguePath, event } of dayEvents) {
    const comps = event?.competitions?.[0]?.competitors || [];
    for (let idx = 0; idx < teams.length; idx++) {
      const team = teams[idx];
      if (!leaguePath.includes(team.league)) continue;
      const matched = comps.some((c) => {
        const abbr = (c?.team?.abbreviation || "").toUpperCase();
        return abbr === team.abbreviation.toUpperCase();
      });
      if (matched && hitsWindow(event.date, tz)) {
        const eventId = `${event.date}|${event.name}`;
        if (!seenEventIds.has(eventId)) {
          seenEventIds.add(eventId);
          candidates.push({ priorityIndex: idx, team, event });
        }
        break;
      }
    }
  }

  if (candidates.length === 0) return { top: null, others: [] };
  candidates.sort(
    (a, b) =>
      a.priorityIndex - b.priorityIndex ||
      new Date(a.event.date).getTime() - new Date(b.event.date).getTime()
  );
  return { top: candidates[0], others: candidates.slice(1) };
}

// ── Game status helpers ────────────────────────────────────────────────────

type GameState = "live" | "final" | "scheduled";

function getGameState(event: ESPNEvent): GameState {
  const statusName = event.competitions?.[0]?.status?.type?.name || "";
  if (statusName.includes("IN_PROGRESS")) return "live";
  if (statusName.includes("FINAL") || statusName.includes("OVER") || statusName.includes("COMPLETE")) return "final";
  return "scheduled";
}

function getScores(event: ESPNEvent): { away: string; home: string } | null {
  const comps = event.competitions?.[0]?.competitors;
  if (!comps || comps.length < 2) return null;
  const home = comps.find((c) => c.homeAway === "home");
  const away = comps.find((c) => c.homeAway === "away");
  if (!home?.score || !away?.score) return null;
  return { home: home.score, away: away.score };
}

function getStatusDetail(event: ESPNEvent): string {
  return event.competitions?.[0]?.status?.type?.shortDetail || "";
}

function getBroadcasts(event: ESPNEvent): string[] {
  const broadcasts = event.competitions?.[0]?.broadcasts || [];
  const names: string[] = [];
  for (const b of broadcasts) {
    for (const n of b.names || []) {
      if (!names.includes(n)) names.push(n);
    }
  }
  return names.slice(0, 3);
}

// ── Game Status Badge ──────────────────────────────────────────────────────

function GameStatusBadge({ event }: { event: ESPNEvent }) {
  const state = getGameState(event);
  const detail = getStatusDetail(event);

  if (state === "live") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
        style={{
          background: "rgba(34,197,94,0.15)",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.3)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            animation: "activePulse 2s ease-in-out infinite",
          }}
        />
        {detail || "LIVE"}
      </span>
    );
  }

  if (state === "final") {
    return (
      <span
        className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full"
        style={{
          background: "rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.35)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {detail || "FINAL"}
      </span>
    );
  }

  return null;
}

// ── Score Display ──────────────────────────────────────────────────────────

function ScoreDisplay({ event }: { event: ESPNEvent }) {
  const scores = getScores(event);
  if (!scores) return null;

  const comps = event.competitions?.[0]?.competitors || [];
  const awayTeam = comps.find((c) => c.homeAway === "away");
  const homeTeam = comps.find((c) => c.homeAway === "home");

  const awayScore = parseInt(scores.away, 10);
  const homeScore = parseInt(scores.home, 10);
  const state = getGameState(event);

  return (
    <div
      className="flex items-center gap-3 mt-2 rounded-lg px-3 py-2"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2 flex-1">
        <span
          className="text-xs uppercase tracking-wide"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.35)", minWidth: 28 }}
        >
          {awayTeam?.team?.abbreviation || "AWY"}
        </span>
        <span
          className="text-lg font-bold"
          style={{
            fontFamily: "'Oswald', sans-serif",
            color: state === "final" && awayScore < homeScore
              ? "rgba(255,255,255,0.35)"
              : "rgba(255,255,255,0.9)",
          }}
        >
          {scores.away}
        </span>
      </div>
      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>—</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span
          className="text-lg font-bold"
          style={{
            fontFamily: "'Oswald', sans-serif",
            color: state === "final" && homeScore < awayScore
              ? "rgba(255,255,255,0.35)"
              : "rgba(255,255,255,0.9)",
          }}
        >
          {scores.home}
        </span>
        <span
          className="text-xs uppercase tracking-wide"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.35)", minWidth: 28, textAlign: "right" }}
        >
          {homeTeam?.team?.abbreviation || "HME"}
        </span>
      </div>
    </div>
  );
}

// ── Settings Panel ─────────────────────────────────────────────────────────

function SettingsPanel({
  prefs,
  onUpdate,
  onClose,
}: {
  prefs: WTWTWPrefs;
  onUpdate: (p: WTWTWPrefs) => void;
  onClose: () => void;
}) {
  const [activeLeague, setActiveLeague] = useState(LEAGUES[0].path);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const leagueTeams = useMemo(
    () => getTeamsByLeague(activeLeague),
    [activeLeague]
  );

  const selectedSet = new Set(prefs.teams);

  function toggleTeam(key: string) {
    if (selectedSet.has(key)) {
      onUpdate({ ...prefs, teams: prefs.teams.filter((k) => k !== key) });
    } else if (prefs.teams.length < 10) {
      onUpdate({ ...prefs, teams: [...prefs.teams, key] });
    }
  }

  function removeTeam(key: string) {
    onUpdate({ ...prefs, teams: prefs.teams.filter((k) => k !== key) });
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...prefs.teams];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    onUpdate({ ...prefs, teams: next });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: "#111D32", border: "1px solid #1a2744" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-bold uppercase tracking-widest"
          style={{
            fontFamily: "'Oswald', sans-serif",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.15em",
          }}
        >
          Settings
        </h3>
        {prefs.teams.length > 0 && (
          <button
            onClick={onClose}
            className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
            style={{
              color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            Done
          </button>
        )}
      </div>

      {/* Timezone */}
      <div className="mb-5">
        <label
          className="block text-xs font-medium mb-2 uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Timezone
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMEZONE_OPTIONS.map((tz) => (
            <button
              key={tz.value}
              onClick={() => onUpdate({ ...prefs, timezone: tz.value })}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{
                background:
                  prefs.timezone === tz.value
                    ? "rgba(99, 102, 241, 0.3)"
                    : "rgba(255,255,255,0.05)",
                color:
                  prefs.timezone === tz.value
                    ? "#a5b4fc"
                    : "rgba(255,255,255,0.4)",
                border:
                  prefs.timezone === tz.value
                    ? "1px solid rgba(99, 102, 241, 0.4)"
                    : "1px solid transparent",
              }}
            >
              {tz.label}
            </button>
          ))}
        </div>
      </div>

      {/* My Teams */}
      <div className="mb-5">
        <label
          className="block text-xs font-medium mb-2 uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          My Teams ({prefs.teams.length}/10)
          {prefs.teams.length > 1 && (
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              {" "}
              — higher = more priority
            </span>
          )}
        </label>
        {prefs.teams.length === 0 ? (
          <p
            className="text-sm py-3"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Pick teams from the leagues below to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {prefs.teams.map((key, idx) => {
              const team = getTeam(key);
              if (!team) return null;
              const isDragging = dragIdx === idx;
              const isOver = dragOverIdx === idx && dragIdx !== idx;
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                  style={{
                    background: isOver
                      ? "rgba(99, 102, 241, 0.1)"
                      : "rgba(255,255,255,0.03)",
                    opacity: isDragging ? 0.4 : 1,
                    borderTop: isOver ? "2px solid rgba(99, 102, 241, 0.5)" : "2px solid transparent",
                    cursor: "grab",
                  }}
                >
                  <span
                    className="text-xs shrink-0 select-none"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                    aria-hidden="true"
                  >
                    ⠿
                  </span>
                  <span
                    className="text-xs font-bold w-5 text-center shrink-0"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: team.textColor }}
                  />
                  <span
                    className="text-sm font-medium flex-1"
                    style={{ color: team.textColor }}
                  >
                    {team.label}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    {LEAGUES.find((l) => l.path === team.league)?.label}
                  </span>
                  <button
                    onClick={() => removeTeam(key)}
                    className="text-xs px-1 transition-colors hover:text-red-400"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    aria-label={`Remove ${team.label}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* League Tabs */}
      <div className="mb-3">
        <label
          className="block text-xs font-medium mb-2 uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Browse Teams
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {LEAGUES.map((lg) => (
            <button
              key={lg.key}
              onClick={() => setActiveLeague(lg.path)}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all"
              style={{
                background:
                  activeLeague === lg.path
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(255,255,255,0.03)",
                color:
                  activeLeague === lg.path
                    ? "rgba(255,255,255,0.9)"
                    : "rgba(255,255,255,0.35)",
              }}
            >
              {lg.label}
            </button>
          ))}
        </div>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {leagueTeams.map((team) => {
            const selected = selectedSet.has(team.key);
            return (
              <button
                key={team.key}
                onClick={() => toggleTeam(team.key)}
                disabled={!selected && prefs.teams.length >= 10}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all"
                style={{
                  background: selected
                    ? `${team.color}20`
                    : "rgba(255,255,255,0.02)",
                  border: selected
                    ? `1px solid ${team.color}40`
                    : "1px solid transparent",
                  opacity:
                    !selected && prefs.teams.length >= 10 ? 0.3 : 1,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: team.color }}
                />
                <span
                  className="text-xs font-medium truncate"
                  style={{
                    color: selected
                      ? team.textColor
                      : "rgba(255,255,255,0.5)",
                  }}
                >
                  {team.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function WTWTW() {
  const [prefs, setPrefs] = useState<WTWTWPrefs>(loadPrefs);
  const [settingsOpen, setSettingsOpen] = useState(() => loadPrefs().teams.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<
    Map<string, Array<{ leaguePath: string; event: ESPNEvent }>>
  >(new Map());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const teams = useMemo(
    () =>
      prefs.teams
        .map((k) => getTeam(k))
        .filter((t): t is TeamEntry => t !== undefined),
    [prefs.teams]
  );

  const days = useMemo(() => getUpcoming7Days(prefs.timezone), [prefs.timezone]);

  const teamKeys = prefs.teams.join(",");

  async function fetchData(currentTeams: TeamEntry[], currentDays: DayInfo[], isRefresh = false) {
    if (currentTeams.length === 0) {
      setRawData(new Map());
      return;
    }
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const leaguePaths = [...new Set(currentTeams.map((t) => t.league))];
      const result = new Map<string, Array<{ leaguePath: string; event: ESPNEvent }>>();
      for (const day of currentDays) {
        const jsons = await Promise.all(
          leaguePaths.map((lp) =>
            fetchEspnScoreboard<ESPNEvent>(lp, day.yyyymmdd)
              .then((j) => ({ lp, j }))
              .catch(() => ({ lp, j: null as { events?: ESPNEvent[] } | null }))
          )
        );
        const dayEvents: Array<{ leaguePath: string; event: ESPNEvent }> = [];
        for (const { lp, j } of jsons) {
          for (const ev of j?.events || [])
            dayEvents.push({ leaguePath: lp, event: ev });
        }
        result.set(day.yyyymmdd, dayEvents);
      }
      setRawData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!alive) return;
      await fetchData(teams, days);
    };
    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamKeys]);

  const picks = useMemo<DayPick[]>(() => {
    if (teams.length === 0 || rawData.size === 0) return [];
    return days.map((day) => {
      const { top, others } = pickEventsForDay(rawData.get(day.yyyymmdd) || [], teams, prefs.timezone);
      return { day, pick: top, others };
    });
  }, [rawData, teams, days, prefs.timezone]);

  const isToday = (yyyymmdd: string) => days[0]?.yyyymmdd === yyyymmdd;

  return (
    <div className="mt-8">
      {/* Team badges */}
      {teams.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {teams.map((team) => (
            <span
              key={team.key}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${team.textColor}15`,
                color: team.textColor,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: team.textColor }}
              />
              {team.label}
            </span>
          ))}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        {lastRefresh && !loading && (
          <button
            onClick={() => fetchData(teams, days, true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              color: "rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
            title="Refresh scores"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: refreshing ? 0.5 : 1, animation: refreshing ? "spin 1s linear infinite" : "none" }}
            >
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {refreshing ? "Refreshing…" : `Updated ${formatRefreshTime(lastRefresh)}`}
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
            style={{
              background: settingsOpen
                ? "rgba(99, 102, 241, 0.2)"
                : "rgba(255,255,255,0.05)",
              color: settingsOpen ? "#a5b4fc" : "rgba(255,255,255,0.4)",
            }}
            aria-label="Toggle settings"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {settingsOpen ? "Close" : "Settings"}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {settingsOpen && (
        <SettingsPanel
          prefs={prefs}
          onUpdate={setPrefs}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Empty state */}
      {teams.length === 0 && !settingsOpen && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#111D32" }}
        >
          <p
            className="text-sm mb-3"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            No teams selected yet.
          </p>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
            style={{
              background: "rgba(99, 102, 241, 0.2)",
              color: "#a5b4fc",
            }}
          >
            Pick Your Teams
          </button>
        </div>
      )}

      {/* Schedule */}
      {teams.length > 0 && (
        <div className="grid gap-4">
          {loading && (
            <div
              className="animate-pulse rounded-2xl p-5 text-white/40"
              style={{
                background: "#111D32",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.875rem",
              }}
            >
              Loading schedules…
            </div>
          )}
          {error && (
            <div
              className="rounded-2xl p-5 text-sm"
              style={{
                background: "rgba(204, 52, 51, 0.15)",
                color: "#FF6B6B",
                borderLeft: "4px solid #CC3433",
              }}
            >
              {error}
            </div>
          )}
          {picks.map(({ day, pick, others }, idx) => {
            const broadcasts = pick ? getBroadcasts(pick.event) : [];
            const gameState = pick ? getGameState(pick.event) : "scheduled";
            const today = isToday(day.yyyymmdd);

            return (
              <div
                key={day.yyyymmdd}
                className="rounded-2xl p-5 transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  background: pick ? "#111D32" : "#0f1a2e",
                  borderLeft: pick
                    ? `4px solid ${pick.team.color}`
                    : "4px solid #1a2744",
                  boxShadow: pick
                    ? `0 4px 20px ${pick.team.color}10`
                    : "none",
                  animation: `fadeSlideIn 0.4s ease both`,
                  animationDelay: `${idx * 80}ms`,
                  outline: today && pick ? `1px solid ${pick.team.color}30` : "none",
                }}
              >
                {/* Day header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      color: pick
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,255,255,0.25)",
                      fontSize: "0.8rem",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {today ? "Today" : day.label}
                    {today && (
                      <span
                        className="ml-2 text-xs font-normal normal-case tracking-normal"
                        style={{ color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {day.label}
                      </span>
                    )}
                  </div>
                  {pick && <GameStatusBadge event={pick.event} />}
                </div>

                {pick ? (
                  <>
                    <div className="mt-3">
                      <div
                        className="text-xl font-bold text-white"
                        style={{ fontFamily: "'Oswald', sans-serif" }}
                      >
                        {pick.event?.name || "Game"}
                      </div>

                      {/* Time + team badge row */}
                      <div className="mt-2 flex items-center gap-3 flex-wrap">
                        {gameState === "scheduled" && (
                          <span
                            className="text-sm font-medium"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            {formatTime(pick.event?.date, prefs.timezone)}{" "}
                            {tzAbbr(prefs.timezone)}
                          </span>
                        )}
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${pick.team.color}20`,
                            color: pick.team.textColor,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: pick.team.color }}
                          />
                          {pick.team.label}
                        </span>
                        {/* Broadcast badges */}
                        {broadcasts.map((ch) => (
                          <span
                            key={ch}
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              background: "rgba(255,255,255,0.07)",
                              color: "rgba(255,255,255,0.45)",
                              fontFamily: "'JetBrains Mono', monospace",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {ch}
                          </span>
                        ))}
                      </div>

                      {/* Score display for live/final games */}
                      {(gameState === "live" || gameState === "final") && (
                        <ScoreDisplay event={pick.event} />
                      )}
                    </div>

                    {/* Also tonight */}
                    {others.length > 0 && (
                      <div
                        className="mt-3 pt-3 flex flex-col gap-1.5"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <span
                          className="text-xs uppercase tracking-widest mb-0.5"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color: "rgba(255,255,255,0.2)",
                            letterSpacing: "0.12em",
                          }}
                        >
                          Also tonight
                        </span>
                        {others.map((other) => {
                          const otherState = getGameState(other.event);
                          const otherScores = otherState !== "scheduled" ? getScores(other.event) : null;
                          const otherDetail = getStatusDetail(other.event);
                          return (
                            <div
                              key={`${other.event.date}|${other.event.name}`}
                              className="flex items-center gap-2 flex-wrap"
                            >
                              <span
                                className="text-sm"
                                style={{
                                  fontFamily: "'Oswald', sans-serif",
                                  color: "rgba(255,255,255,0.5)",
                                  fontWeight: 600,
                                }}
                              >
                                {other.event?.name || "Game"}
                              </span>
                              {otherScores ? (
                                <span
                                  className="text-xs font-bold"
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: otherState === "live" ? "#22c55e" : "rgba(255,255,255,0.3)",
                                  }}
                                >
                                  {otherScores.away}–{otherScores.home}
                                  {otherDetail ? ` · ${otherDetail}` : ""}
                                </span>
                              ) : (
                                <span
                                  className="text-xs"
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: "rgba(255,255,255,0.3)",
                                  }}
                                >
                                  {formatTime(other.event?.date, prefs.timezone)}
                                </span>
                              )}
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                                style={{
                                  backgroundColor: `${other.team.color}15`,
                                  color: other.team.textColor,
                                  opacity: 0.75,
                                }}
                              >
                                <span
                                  className="h-1 w-1 rounded-full"
                                  style={{ backgroundColor: other.team.color }}
                                />
                                {other.team.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="mt-2 text-sm"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    No evening games (5 PM&ndash;11:30 PM).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function formatRefreshTime(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
