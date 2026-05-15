/**
 * Shared utilities for ESPN-based sports ranking engines (NBA Now, MLB GameRank).
 */

import { esc, escUrl } from "./htmlUtils";

// Re-export so sport modules don't need to import htmlUtils separately
export { esc, escUrl };

// ── Constants ──

const REFRESH_MS = 30_000;
const TIMEZONE = "America/Los_Angeles";

// ── Shared ESPN types ──

export interface Competitor {
  homeAway?: string;
  score?: string;
  hits?: string;
  errors?: string;
  team?: {
    abbreviation?: string;
    displayName?: string;
    location?: string;
    name?: string;
    logo?: string;
    color?: string;
  };
  records?: Array<{ summary?: string }>;
}

export interface Status {
  period?: number;
  displayClock?: string;
  type?: { description?: string; state?: string; detail?: string; shortDetail?: string };
}

export interface Competition {
  competitors?: Competitor[];
  status?: Status;
  situation?: unknown;
  geoBroadcasts?: Array<{
    market?: { type?: string };
    media?: { shortName?: string };
  }>;
}

export interface Game {
  date?: string;
  competitions?: Competition[];
}

export interface TeamRecord {
  wins: number;
  losses: number;
}

// ── Shared ranking helpers ──

export function parseRecord(competitor: Competitor): TeamRecord {
  const rec = competitor?.records?.[0];
  if (!rec) return { wins: 0, losses: 0 };
  if (rec.summary) {
    const [w, l] = rec.summary.split("-").map(Number);
    if (!isNaN(w) && !isNaN(l)) return { wins: w, losses: l };
  }
  return { wins: 0, losses: 0 };
}

export function winPct({ wins, losses }: TeamRecord): number {
  const total = wins + losses;
  return total > 0 ? wins / total : 0.5;
}

/** Clamp a raw watch-score into a 0–100 percentage of its max. */
export function scoreToPercent(score: number, maxScore: number): number {
  return Math.min(100, Math.round((score / maxScore) * 100));
}

/** Parse an ESPN competitor score string. Missing/empty values resolve to 0. */
export function parseScore(score: string | undefined | null): number {
  return parseInt(score || "0", 10);
}

export function computePreGameScore(game: Game): number {
  const comp = game.competitions?.[0];
  if (!comp) return 0;
  const competitors = comp.competitors || [];
  if (competitors.length < 2) return 0;
  const rec1 = parseRecord(competitors[0]);
  const rec2 = parseRecord(competitors[1]);
  const avg = (winPct(rec1) + winPct(rec2)) / 2;
  const diff = Math.abs(winPct(rec1) - winPct(rec2));
  return avg * 100 * (1.0 - diff);
}

// ── Broadcast helpers ──

export function getBroadcasts(competition: Competition) {
  const geo = competition?.geoBroadcasts || [];
  const national = geo
    .filter((b) => b.market?.type === "National")
    .map((b) => b.media?.shortName)
    .filter(Boolean) as string[];
  return { national: [...new Set(national)] };
}

// ── Team display helpers ──

export function teamAbbr(competitor: Competitor): string {
  return esc(competitor?.team?.abbreviation || "???");
}

export function teamMascot(competitor: Competitor): string {
  return esc(competitor?.team?.name || competitor?.team?.abbreviation || "Team");
}

export function teamFullName(competitor: Competitor): string {
  const loc = competitor?.team?.location || "";
  const name = competitor?.team?.name || "";
  const full = `${loc} ${name}`.trim();
  return esc(full || competitor?.team?.abbreviation || "Team");
}

export function teamColor(competitor: Competitor, fallback = "#888"): string {
  const color = competitor?.team?.color;
  return color && /^[0-9a-fA-F]{3,8}$/.test(color) ? `#${color}` : fallback;
}

export function isLive(status: Status | undefined): boolean {
  return (status?.type?.state || "") === "in";
}

/**
 * Resolve away/home competitors from an ESPN competitor array. Falls back to
 * positional ordering ([0]=away, [1]=home) if `homeAway` flags are missing.
 * Caller is responsible for ensuring the array has at least 2 entries.
 */
export function getAwayHome(competitors: Competitor[]): {
  away: Competitor;
  home: Competitor;
} {
  return {
    away: competitors.find((c) => c.homeAway === "away") || competitors[0],
    home: competitors.find((c) => c.homeAway === "home") || competitors[1],
  };
}

// ── Date helpers ──

export function getGameDayLabel(events: Game[]): string {
  const firstGame = events.find((e) => e.date);
  if (!firstGame) return "Games";

  const gameDate = new Date(firstGame.date!);
  const now = new Date();

  const opts: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const gameDayStr = gameDate.toLocaleDateString("en-US", opts);
  const todayStr = now.toLocaleDateString("en-US", opts);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", opts);

  if (gameDayStr === todayStr) return "Today's Games";
  if (gameDayStr === tomorrowStr) return "Tomorrow's Games";

  const dayName = gameDate.toLocaleDateString("en-US", {
    timeZone: TIMEZONE,
    weekday: "long",
  });
  return `${dayName}'s Games`;
}

export function formatGameTime(dateStr: string, includeAmPm = false): string {
  const formatted = new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  });
  return includeAmPm ? formatted : formatted.replace(/\s*[AP]M$/i, "");
}

/** ESPN scoreboard URLs use a YYYYMMDD `dates` param. */
export function formatYYYYMMDD(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// ── ESPN fetch helpers ──

/**
 * Fetch ESPN's public scoreboard JSON for a given league + date. The event shape
 * varies by league and consumer needs, so callers parameterize the type.
 */
export async function fetchEspnScoreboard<T = unknown>(
  leaguePath: string,
  yyyymmdd: string,
): Promise<{ events?: T[] }> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${leaguePath}/scoreboard?dates=${yyyymmdd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN ${leaguePath} ${yyyymmdd} failed (${res.status})`);
  return res.json();
}

// ── DOM helpers ──

/** Scale each .hero-line to fill the container width, creating a boxy block. */
export function fitHeroLines(): void {
  const container = document.querySelector(".hero-sentence") as HTMLElement;
  if (!container) return;
  const targetWidth = container.clientWidth;
  const lines = container.querySelectorAll(".hero-line") as NodeListOf<HTMLElement>;
  const BASE = 48;
  container.style.overflow = "visible";
  lines.forEach((line) => {
    line.style.whiteSpace = "nowrap";
    line.style.display = "inline-block";
    line.style.fontSize = `${BASE}px`;
    const w1 = line.getBoundingClientRect().width;
    if (w1 <= 0) return;
    let size = (targetWidth / w1) * BASE;
    line.style.fontSize = `${size.toFixed(1)}px`;
    const w2 = line.getBoundingClientRect().width;
    if (w2 > 0) size = (targetWidth / w2) * size;
    line.style.fontSize = `${size.toFixed(1)}px`;
    line.style.display = "block";
  });
  container.style.overflow = "hidden";
}

/**
 * Standard fetch→render loop used by all sports engines.
 * Handles loading/content/error element visibility and retry button.
 */
function createFetchLoop(
  apiUrl: string,
  renderFn: (events: Game[]) => void,
  opts: { errorBtnId?: string; retryBtnStyle?: string } = {},
) {
  const errorBtnId = opts.errorBtnId || "retryBtn";

  async function fetchAndRender(): Promise<void> {
    const loading = document.getElementById("loading");
    const content = document.getElementById("content");
    const errorEl = document.getElementById("error");
    if (!loading || !content || !errorEl) return;

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
      const data = await res.json();
      const events: Game[] = data?.events || [];

      loading.style.display = "none";
      errorEl.style.display = "none";
      content.style.display = "block";
      renderFn(events);
    } catch (err) {
      loading.style.display = "none";
      content.style.display = "none";
      errorEl.style.display = "block";
      const message = err instanceof Error ? err.message : "Something went wrong";
      errorEl.innerHTML = `
        <div class="hero-card p-6 text-center">
          <div class="font-score text-xs" style="color:#fca5a5;">${esc(message)}</div>
          <button
            id="${errorBtnId}"
            class="mt-3 font-score text-xs font-semibold px-4 py-2 rounded-lg"
            style="${opts.retryBtnStyle || "background:#111118;color:#ff6b2b;border:1px solid #1f1f30;cursor:pointer;"}"
          >RETRY</button>
        </div>
      `;
      document.getElementById(errorBtnId)?.addEventListener("click", fetchAndRender);
    }
  }

  return fetchAndRender;
}

/**
 * Standard init: set date label, start polling, listen for resize.
 */
export function initSportsApp(
  apiUrl: string,
  renderFn: (events: Game[]) => void,
  opts: { errorBtnId?: string; retryBtnStyle?: string } = {},
): void {
  const dateLabelEl = document.getElementById("dateLabel");
  if (dateLabelEl) {
    dateLabelEl.textContent = new Date()
      .toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  }

  const fetchAndRender = createFetchLoop(apiUrl, renderFn, opts);
  fetchAndRender();
  // Start polling, but skip when tab is hidden
  setInterval(() => {
    if (!document.hidden) fetchAndRender();
  }, REFRESH_MS);
  window.addEventListener("resize", fitHeroLines);
}
