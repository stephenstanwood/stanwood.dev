// NBA Now — scoreboard ranking engine and renderer

// --- Constants ---
const API_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const REFRESH_MS = 30_000;
const MAX_WATCH_SCORE = 400;
const CLOSENESS_PENALTY = 4;
const OT_MULTIPLIER = 3.5;
const MAX_PROGRESS_MULTIPLIER = 2.0;

// --- XSS protection ---
const ESC_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c] || c);
}

function escUrl(u: string): string {
  try {
    const p = new URL(u);
    return ["http:", "https:"].includes(p.protocol) ? p.href : "";
  } catch {
    return "";
  }
}

// --- Minimal types for ESPN data ---
interface Competitor {
  homeAway?: string;
  score?: string;
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

interface Status {
  period?: number;
  displayClock?: string;
  type?: { description?: string; state?: string };
}

interface Competition {
  competitors?: Competitor[];
  status?: Status;
  geoBroadcasts?: Array<{
    market?: { type?: string };
    media?: { shortName?: string };
  }>;
}

interface Game {
  date?: string;
  competitions?: Competition[];
}

// --- Ranking algorithm ---

function parseRecord(competitor: Competitor) {
  const rec = competitor?.records?.[0];
  if (!rec) return { wins: 0, losses: 0 };
  if (rec.summary) {
    const [w, l] = rec.summary.split("-").map(Number);
    if (!isNaN(w) && !isNaN(l)) return { wins: w, losses: l };
  }
  return { wins: 0, losses: 0 };
}

function winPct({ wins, losses }: { wins: number; losses: number }): number {
  const total = wins + losses;
  return total > 0 ? wins / total : 0.5;
}

function gameProgress(status: Status): number {
  const period = status?.period || 0;
  const clockStr = status?.displayClock || "12:00";
  const [minStr, secStr] = clockStr.split(":");
  const minutes = parseFloat(minStr || "0");
  const seconds = parseFloat(secStr || "0");
  const clockMinutes = minutes + seconds / 60;

  if (period === 0) return 0;

  const quarterElapsed = 12 - clockMinutes;
  const totalElapsed = (period - 1) * 12 + quarterElapsed;
  return Math.max(0, totalElapsed / 48);
}

function isOvertime(status: Status): boolean {
  return (status?.period || 0) > 4;
}

function computeWatchScore(game: Game): number {
  const comp = game.competitions?.[0];
  if (!comp) return 0;

  const competitors = comp.competitors || [];
  if (competitors.length < 2) return 0;

  const score1 = parseInt(competitors[0].score || "0", 10);
  const score2 = parseInt(competitors[1].score || "0", 10);
  const scoreDelta = Math.abs(score1 - score2);

  const rec1 = parseRecord(competitors[0]);
  const rec2 = parseRecord(competitors[1]);
  const avgWinPct = (winPct(rec1) + winPct(rec2)) / 2;

  const status = comp.status!;
  const progress = gameProgress(status);
  const ot = isOvertime(status);

  const closenessScore = Math.max(0, 100 - scoreDelta * CLOSENESS_PENALTY);
  const qualityMultiplier = 0.5 + avgWinPct;
  const progressMultiplier = ot
    ? OT_MULTIPLIER
    : 1.0 + Math.min(progress, 1.0) * MAX_PROGRESS_MULTIPLIER;

  return closenessScore * qualityMultiplier * progressMultiplier;
}

function computePreGameScore(game: Game): number {
  const comp = game.competitions?.[0];
  if (!comp) return 0;
  const competitors = comp.competitors || [];
  if (competitors.length < 2) return 0;

  const rec1 = parseRecord(competitors[0]);
  const rec2 = parseRecord(competitors[1]);
  const avg = (winPct(rec1) + winPct(rec2)) / 2;
  const diff = Math.abs(winPct(rec1) - winPct(rec2));
  const matchupBonus = 1.0 - diff;

  return avg * 100 * matchupBonus;
}

// --- Broadcast helpers ---

function getBroadcasts(competition: Competition) {
  const geo = competition?.geoBroadcasts || [];
  const national = geo
    .filter((b) => b.market?.type === "National")
    .map((b) => b.media?.shortName)
    .filter(Boolean) as string[];
  const local = geo
    .filter((b) => b.market?.type !== "National")
    .map((b) => b.media?.shortName)
    .filter(Boolean) as string[];
  return {
    national: [...new Set(national)],
    local: [...new Set(local)],
  };
}

function renderBroadcastBadges(
  competition: Competition,
  compact: boolean,
): string {
  const { national } = getBroadcasts(competition);

  const nationalStyle =
    "display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.03em;padding:2px 5px;border-radius:3px;white-space:nowrap;line-height:1;background:rgba(255,107,43,0.12);color:#ff8c55;border:1px solid rgba(255,107,43,0.2);";
  const leaguePassStyle =
    "display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.03em;padding:2px 5px;border-radius:3px;white-space:nowrap;line-height:1;background:rgba(63,63,70,0.3);color:#71717a;border:1px solid rgba(63,63,70,0.4);";

  const badge =
    national.length > 0
      ? `<span style="${nationalStyle}">${esc(national[0])}</span>`
      : `<span style="${leaguePassStyle}">League Pass</span>`;

  return `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:${compact ? "flex-end" : "center"};${compact ? "" : "margin-top:8px;"}">${badge}</div>`;
}

// --- Rendering helpers ---

function teamAbbr(competitor: Competitor): string {
  return esc(competitor?.team?.abbreviation || "???");
}

/** Full team name for accessible alt text (e.g. "Golden State Warriors"). */
function teamFullName(competitor: Competitor): string {
  const loc = competitor?.team?.location || "";
  const name = competitor?.team?.name || "";
  const full = `${loc} ${name}`.trim();
  return esc(full || competitor?.team?.abbreviation || "Team");
}

function teamColor(competitor: Competitor): string {
  const c = competitor?.team?.color;
  return c && /^[0-9a-fA-F]{3,8}$/.test(c) ? `#${c}` : "#ff6b2b";
}

function statusLabel(status: Status): string {
  const period = status?.period || 0;
  const clock = status?.displayClock || "";
  const desc = status?.type?.description || "";

  if (desc === "Final") return "FINAL";
  if (desc === "Halftime") return "HALF";
  if (period === 0) return "";
  if (period > 4) return `OT${period - 4} ${clock}`;
  return `Q${period} ${clock}`;
}

function isLive(status: Status | undefined): boolean {
  return (status?.type?.state || "") === "in";
}

function formatTipoff(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles",
  });
}

// --- Card renderers ---

function renderHeroTeam(
  competitor: Competitor,
  status: Status,
  label: string,
  isWinning: boolean,
  isLosing: boolean,
): string {
  const abbr = teamAbbr(competitor);
  const fullName = teamFullName(competitor);
  const city = esc(competitor?.team?.location || abbr);
  const name = esc(competitor?.team?.name || "");
  const record = esc(competitor?.records?.[0]?.summary || "");
  const logoUrl = escUrl(competitor?.team?.logo || "");
  const color = teamColor(competitor);
  const state = status?.type?.state;
  const showScore = state && state !== "pre";
  const score = showScore ? (competitor?.score ?? "\u2013") : "";

  let scoreStyle = "color: #e4e4e7;";
  if (isWinning)
    scoreStyle =
      "color: #4ade80; text-shadow: 0 0 20px rgba(74, 222, 128, 0.4);";
  else if (isLosing) scoreStyle = "color: #71717a;";

  return `
    <div class="flex items-center justify-between py-1.5">
      <div class="flex items-center gap-3">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="${fullName}" width="32" height="32" style="object-fit: contain;" />`
            : `<div style="width:32px;height:32px;border-radius:50%;background:${color};"></div>`
        }
        <div>
          <div style="font-size: 10px; letter-spacing: 0.15em; color: #71717a; text-transform: uppercase;">${label}</div>
          <div class="font-score text-base font-bold tracking-wider" style="color: ${color};">${city}</div>
          <div style="font-size: 12px; color: ${color}; opacity: 0.7;">${name} <span style="color: #71717a; opacity: 1; font-size: 10px; margin-left: 4px;">${record}</span></div>
        </div>
      </div>
      ${score ? `<div class="font-score text-4xl font-black tracking-wider" style="${scoreStyle}">${score}</div>` : ""}
    </div>
  `;
}

function renderHeroCard(game: Game): string {
  const comp = game.competitions![0];
  const competitors = comp?.competitors || [];
  const status = comp?.status!;
  const live = isLive(status);
  const watchScore = computeWatchScore(game);
  const barPct = Math.min(
    100,
    Math.round((watchScore / MAX_WATCH_SCORE) * 100),
  );

  const away =
    competitors.find((c) => c.homeAway === "away") || competitors[0];
  const home =
    competitors.find((c) => c.homeAway === "home") || competitors[1];

  const awayScore = parseInt(away?.score || "0", 10);
  const homeScore = parseInt(home?.score || "0", 10);
  const state = status?.type?.state;
  const hasScores = !!(state && state !== "pre");

  return `
    <div class="hero-card p-5">
      <div class="flex justify-center">
        <div class="status-pill ${live ? "live" : ""}">
          ${live ? '<div class="live-dot"></div>' : ""}
          ${live ? "LIVE \u00b7 " : ""}${statusLabel(status)}
        </div>
      </div>

      <div class="mt-5 space-y-1">
        ${renderHeroTeam(away, status, "AWAY", hasScores && awayScore > homeScore, hasScores && awayScore < homeScore)}
        <div style="border-top: 1px dashed rgba(34, 211, 238, 0.15); margin: 4px 0;"></div>
        ${renderHeroTeam(home, status, "HOME", hasScores && homeScore > awayScore, hasScores && homeScore < awayScore)}
      </div>

      <div class="flex justify-center">${renderBroadcastBadges(comp, false)}</div>

      <div class="mt-3">
        <div class="watch-bar-track">
          <div class="watch-bar-fill" style="width: ${barPct}%;"></div>
        </div>
      </div>
    </div>
  `;
}

function renderGameRow(
  game: Game,
  rank: number,
  isPreGame: boolean,
): string {
  const comp = game.competitions![0];
  const competitors = comp?.competitors || [];
  const status = comp?.status!;
  const live = isLive(status);

  const away =
    competitors.find((c) => c.homeAway === "away") || competitors[0];
  const home =
    competitors.find((c) => c.homeAway === "home") || competitors[1];

  const awayScore = away?.score ?? "";
  const homeScore = home?.score ?? "";
  const awayNum = parseInt(awayScore || "0", 10);
  const homeNum = parseInt(homeScore || "0", 10);
  const awayAbbr = teamAbbr(away);
  const homeAbbr = teamAbbr(home);
  const awayFull = teamFullName(away);
  const homeFull = teamFullName(home);
  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");
  const awayColor = teamColor(away);
  const homeColor = teamColor(home);

  const showScores = !isPreGame;
  const tipoff = isPreGame ? formatTipoff(game.date!) : "";
  const statusText = isPreGame ? tipoff + " PT" : statusLabel(status);

  const awayScoreStyle =
    showScores && awayNum > homeNum
      ? "color:#4ade80;text-shadow:0 0 10px rgba(74,222,128,0.3);"
      : showScores && awayNum < homeNum
        ? "color:#71717a;"
        : "color:#e4e4e7;";
  const homeScoreStyle =
    showScores && homeNum > awayNum
      ? "color:#4ade80;text-shadow:0 0 10px rgba(74,222,128,0.3);"
      : showScores && homeNum < awayNum
        ? "color:#71717a;"
        : "color:#e4e4e7;";

  return `
    <div class="game-row px-3 py-2.5" style="display:flex;align-items:center;gap:12px;">
      <div style="font-family:Orbitron,monospace;font-size:10px;color:#52525b;width:24px;text-align:right;flex-shrink:0;">${rank}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${
              awayLogo
                ? `<img src="${awayLogo}" alt="${awayFull}" width="16" height="16" style="object-fit:contain;" />`
                : `<div style="width:16px;height:16px;border-radius:50%;background:${awayColor};"></div>`
            }
            <span class="font-score text-xs font-semibold tracking-wider" style="color:${awayColor};">${awayAbbr}</span>
          </div>
          ${showScores ? `<span class="font-score text-sm font-bold tracking-wider" style="${awayScoreStyle}">${awayScore}</span>` : ""}
        </div>
        <div class="flex items-center justify-between mt-0.5">
          <div class="flex items-center gap-2">
            ${
              homeLogo
                ? `<img src="${homeLogo}" alt="${homeFull}" width="16" height="16" style="object-fit:contain;" />`
                : `<div style="width:16px;height:16px;border-radius:50%;background:${homeColor};"></div>`
            }
            <span class="font-score text-xs font-semibold tracking-wider" style="color:${homeColor};">${homeAbbr}</span>
          </div>
          ${showScores ? `<span class="font-score text-sm font-bold tracking-wider" style="${homeScoreStyle}">${homeScore}</span>` : ""}
        </div>
      </div>
      <div class="text-right flex-shrink-0" style="min-width: 70px;">
        <div class="flex items-center justify-end gap-1.5">
          ${live ? '<div class="live-dot" style="width:5px;height:5px;"></div>' : ""}
          <span class="font-score text-xs ${live ? "neon-cyan" : ""}" style="${!live ? "color:#a1a1aa;" : ""}">${statusText}</span>
        </div>
        ${renderBroadcastBadges(comp, true)}
      </div>
    </div>
  `;
}

function renderNoGames(events: Game[]): string {
  const scheduled = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "pre")
    .sort(
      (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime(),
    );

  let nextLine = "";
  if (scheduled.length > 0) {
    const next = scheduled[0];
    const comp = next.competitions?.[0];
    const away = comp?.competitors?.find((c) => c.homeAway === "away");
    const home = comp?.competitors?.find((c) => c.homeAway === "home");
    const time = formatTipoff(next.date!);
    nextLine = `
      <div class="mt-4 font-score text-sm" style="color: #a1a1aa;">
        Next up: <span style="color: #22d3ee; text-shadow: 0 0 8px rgba(34, 211, 238, 0.3);">${teamAbbr(away!)} @ ${teamAbbr(home!)}</span>
        <span style="color: #f59e0b; text-shadow: 0 0 6px rgba(245, 158, 11, 0.3); margin-left: 4px;">${time} PT</span>
      </div>
    `;
  }

  const message =
    events.length === 0 ? "NO GAMES TODAY" : "NO LIVE GAMES";

  return `
    <div class="hero-card p-8 text-center">
      <div class="font-score text-lg font-bold tracking-widest" style="color: #22d3ee; text-shadow: 0 0 15px rgba(34, 211, 238, 0.4);">${message}</div>
      ${nextLine}
    </div>
  `;
}

function getGameDayLabel(events: Game[]): string {
  const firstGame = events.find((e) => e.date);
  if (!firstGame) return "Games";

  const gameDate = new Date(firstGame.date!);
  const now = new Date();
  const pt = "America/Los_Angeles";

  const opts: Intl.DateTimeFormatOptions = {
    timeZone: pt,
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
    timeZone: pt,
    weekday: "long",
  });
  return `${dayName}'s Games`;
}

function renderRankedGames(
  events: Game[],
  sectionTitle: string,
): string {
  const preGames = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "pre")
    .map((g) => ({ game: g, score: computePreGameScore(g) }))
    .sort((a, b) => b.score - a.score);

  if (preGames.length === 0) return "";

  return `
    <div class="section-header mt-8 mb-3">${sectionTitle}</div>
    <div class="space-y-1.5">
      ${preGames.map((g, i) => renderGameRow(g.game, i + 1, true)).join("")}
    </div>
  `;
}

function render(events: Game[]): void {
  const content = document.getElementById("content")!;

  const liveGames = events.filter((e) => {
    const state = e.competitions?.[0]?.status?.type?.state;
    return state === "in";
  });

  const dayLabel = getGameDayLabel(events);

  if (liveGames.length === 0) {
    content.innerHTML =
      renderNoGames(events) +
      renderRankedGames(events, dayLabel + ", Ranked");
    return;
  }

  const ranked = liveGames
    .map((g) => ({ game: g, score: computeWatchScore(g) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const others = ranked.slice(1);

  let html = renderHeroCard(best.game);

  if (others.length > 0) {
    html += `
      <div class="section-header mt-6 mb-3">Also Live</div>
      <div class="space-y-1.5">
        ${others.map((o, i) => renderGameRow(o.game, i + 2, false)).join("")}
      </div>
    `;
  }

  html += renderRankedGames(events, "Coming Up");

  content.innerHTML = html;
}

// --- Fetch + loop ---

async function fetchAndRender(): Promise<void> {
  const loading = document.getElementById("loading")!;
  const content = document.getElementById("content")!;
  const errorEl = document.getElementById("error")!;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();
    const events: Game[] = data?.events || [];

    loading.style.display = "none";
    errorEl.style.display = "none";
    content.style.display = "block";

    render(events);
  } catch (err) {
    loading.style.display = "none";
    content.style.display = "none";
    errorEl.style.display = "block";
    const message =
      err instanceof Error ? err.message : "Something went wrong";
    errorEl.innerHTML = `
      <div class="hero-card p-6 text-center">
        <div class="font-score text-xs neon-red">${esc(message)}</div>
        <button
          id="retryBtn"
          class="mt-3 font-score text-xs font-semibold px-4 py-2 rounded-lg"
          style="background: #111118; color: #ff6b2b; border: 1px solid #1f1f30; cursor: pointer;"
        >
          RETRY
        </button>
      </div>
    `;
    document
      .getElementById("retryBtn")
      ?.addEventListener("click", fetchAndRender);
  }
}

/** Initialize NBA Now: set date label, start fetching + auto-refresh. */
export function init(): void {
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

  fetchAndRender();
  setInterval(fetchAndRender, REFRESH_MS);
}
