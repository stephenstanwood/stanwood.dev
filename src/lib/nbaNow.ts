// NBA Now — scoreboard ranking engine and renderer

import {
  type Game,
  type Status,
  type Competition,
  esc,
  escUrl,
  parseRecord,
  winPct,
  computePreGameScore,
  getBroadcasts,
  teamAbbr,
  teamMascot,
  teamFullName,
  teamColor,
  isLive,
  getGameDayLabel,
  formatGameTime,
  fitHeroLines,
  initSportsApp,
  scoreToPercent,
  parseScore,
  getAwayHome,
} from "./sportsCore";

// --- Constants ---
const API_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const MAX_WATCH_SCORE = 400;
const CLOSENESS_PENALTY = 4;
const OT_MULTIPLIER = 3.5;
const MAX_PROGRESS_MULTIPLIER = 2.0;

// --- Ranking algorithm ---

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

  const score1 = parseScore(competitors[0].score);
  const score2 = parseScore(competitors[1].score);
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

// --- Broadcast helpers ---

function renderBroadcastBadges(
  competition: Competition,
  compact: boolean,
): string {
  const { national } = getBroadcasts(competition);

  const nationalStyle =
    "display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.03em;padding:2px 5px;border-radius:3px;white-space:nowrap;line-height:1;text-transform:uppercase;background:rgba(255,107,43,0.12);color:#ff8c55;border:1px solid rgba(255,107,43,0.2);";
  const leaguePassStyle =
    "display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.03em;padding:2px 5px;border-radius:3px;white-space:nowrap;line-height:1;text-transform:uppercase;background:rgba(63,63,70,0.3);color:#71717a;border:1px solid rgba(63,63,70,0.4);";

  const badge =
    national.length > 0
      ? `<span style="${nationalStyle}">${esc(national[0])}</span>`
      : `<span style="${leaguePassStyle}">League Pass</span>`;

  return `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:${compact ? "flex-end" : "center"};${compact ? "" : "margin-top:8px;"}">${badge}</div>`;
}

// --- Rendering helpers ---

const SCORE_WIN_STYLE = "color:#4ade80;text-shadow:0 0 10px rgba(74,222,128,0.3);";
const SCORE_LOSS_STYLE = "color:#71717a;";
const SCORE_NEUTRAL_STYLE = "color:#e4e4e7;";

function scoreColorStyle(myScore: number, otherScore: number, active: boolean): string {
  if (!active) return SCORE_NEUTRAL_STYLE;
  if (myScore > otherScore) return SCORE_WIN_STYLE;
  if (myScore < otherScore) return SCORE_LOSS_STYLE;
  return SCORE_NEUTRAL_STYLE;
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

function formatTipoff(dateStr: string): string {
  return formatGameTime(dateStr);
}

// --- Card renderers ---

function renderHeroCard(game: Game): string {
  const comp = game.competitions![0];
  const competitors = comp?.competitors || [];
  const status = comp?.status!;
  const live = isLive(status);
  const watchScore = computeWatchScore(game);
  const barPct = scoreToPercent(watchScore, MAX_WATCH_SCORE);

  const { away, home } = getAwayHome(competitors);

  const awayScore = parseScore(away?.score);
  const homeScore = parseScore(home?.score);
  const state = status?.type?.state;
  const hasScores = !!(state && state !== "pre");

  const awayName = teamMascot(away);
  const homeName = teamMascot(home);
  const { national } = getBroadcasts(comp);
  const network = national.length > 0 ? national[0] : "League Pass";

  const awayScoreColor = scoreColorStyle(awayScore, homeScore, hasScores);
  const homeScoreColor = scoreColorStyle(homeScore, awayScore, hasScores);

  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");

  return `
    <div class="hero-card p-6">
      <div class="hero-sentence">
        <div class="hero-line">the best game</div>
        <div class="hero-line">right now is the</div>
        <div class="hero-line hl-team">${awayName}</div>
        <div class="hero-line">versus the</div>
        <div class="hero-line hl-team">${homeName}</div>
        <div class="hero-line">on <span class="hl-network">${esc(network)}</span></div>
      </div>

      <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-top:28px;">
        ${awayLogo ? `<img src="${awayLogo}" alt="${awayName}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
        ${
          hasScores
            ? `<div class="score-detail" style="flex-direction:column;gap:6px;">
                <span style="${awayScoreColor}">${teamAbbr(away)} ${awayScore}</span>
                <span class="score-dash">\u2014</span>
                <span style="${homeScoreColor}">${teamAbbr(home)} ${homeScore}</span>
              </div>`
            : `<span class="font-score" style="font-size:20px;color:#3f3f46;font-weight:700;">VS</span>`
        }
        ${homeLogo ? `<img src="${homeLogo}" alt="${homeName}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
      </div>

      <div style="margin-top:16px;" class="text-center">
        <div class="flex justify-center">
          <div class="status-pill ${live ? "live" : ""}">
            ${live ? '<div class="live-dot"></div>' : ""}
            ${live ? "LIVE \u00b7 " : ""}${statusLabel(status)}
          </div>
        </div>
        <div class="watch-meter mt-4">
          <div class="watch-meter-label">WATCHABILITY</div>
          <div class="watch-bar-track">
            <div class="watch-bar-fill" style="width: ${barPct}%;"></div>
          </div>
          <div class="watch-meter-value">${barPct}%</div>
        </div>
      </div>
    </div>
  `;
}

function renderGameRow(
  game: Game,
  rank: number,
  isPreGame: boolean,
  watchPct?: number,
): string {
  const comp = game.competitions![0];
  const competitors = comp?.competitors || [];
  const status = comp?.status!;
  const live = isLive(status);

  const { away, home } = getAwayHome(competitors);

  const awayScore = away?.score ?? "";
  const homeScore = home?.score ?? "";
  const awayNum = parseScore(awayScore);
  const homeNum = parseScore(homeScore);
  const awayAbbr = teamAbbr(away);
  const homeAbbr = teamAbbr(home);
  const awayFull = teamFullName(away);
  const homeFull = teamFullName(home);
  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");
  const awayColor = teamColor(away, "#ff6b2b");
  const homeColor = teamColor(home, "#ff6b2b");

  const showScores = !isPreGame;
  const tipoff = isPreGame ? formatTipoff(game.date!) : "";
  const statusText = isPreGame ? tipoff + " Pacific" : statusLabel(status);

  const awayScoreStyle = scoreColorStyle(awayNum, homeNum, showScores);
  const homeScoreStyle = scoreColorStyle(homeNum, awayNum, showScores);

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
            <span class="font-score text-xs font-semibold tracking-wider" style="color:#e4e4e7;">${awayAbbr}</span>
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
            <span class="font-score text-xs font-semibold tracking-wider" style="color:#e4e4e7;">${homeAbbr}</span>
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
        ${watchPct != null ? `<div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:3px;"><div style="height:2px;width:36px;border-radius:1px;background:rgba(63,63,70,0.5);overflow:hidden;"><div style="height:100%;width:${watchPct}%;border-radius:1px;background:linear-gradient(90deg,#f97316,#fb923c);"></div></div><span style="font-family:Orbitron,monospace;font-size:8px;font-weight:600;color:#f97316;">${watchPct}%</span></div>` : ""}
      </div>
    </div>
  `;
}

function renderNoGames(events: Game[]): string {
  // Find the best upcoming game by quality, not time
  const preGames = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "pre")
    .map((g) => ({ game: g, score: computePreGameScore(g) }))
    .sort((a, b) => b.score - a.score);

  if (preGames.length === 0) {
    const postGames = events.filter((e) => e.competitions?.[0]?.status?.type?.state === "post");
    const label = postGames.length > 0 ? "All Games Over" : "No Games Today";
    return `
      <div class="hero-card p-8" style="display:flex;align-items:center;justify-content:center;min-height:160px;">
        <div class="font-score" style="font-size:28px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#3f3f46;text-align:center;">${label}</div>
      </div>
    `;
  }

  const best = preGames[0].game;
  const comp = best.competitions?.[0];
  const { away, home } = getAwayHome(comp?.competitors || []);
  const time = formatTipoff(best.date!);
  const { national } = getBroadcasts(comp!);
  const network = national.length > 0 ? national[0] : "League Pass";
  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");

  return `
    <div class="hero-card p-6">
      <div class="hero-sentence">
        <div class="hero-line">the best game</div>
        <div class="hero-line">today is the</div>
        <div class="hero-line hl-team">${teamMascot(away)}</div>
        <div class="hero-line">versus the</div>
        <div class="hero-line hl-team">${teamMascot(home)}</div>
        <div class="hero-line hl-time">${esc(time)} Pacific</div>
        <div class="hero-line">on <span class="hl-network">${esc(network)}</span></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:32px;margin-top:24px;">
        ${awayLogo ? `<img src="${awayLogo}" alt="${teamFullName(away)}" width="80" height="80" style="object-fit:contain;opacity:0.9;" />` : ""}
        <span class="font-score" style="font-size:16px;color:#3f3f46;font-weight:700;">VS</span>
        ${homeLogo ? `<img src="${homeLogo}" alt="${teamFullName(home)}" width="80" height="80" style="object-fit:contain;opacity:0.9;" />` : ""}
      </div>
    </div>
  `;
}

function renderRankedGames(
  events: Game[],
  sectionLabel: string,
): string {
  const preGames = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "pre")
    .map((g) => ({ game: g, score: computePreGameScore(g) }))
    .sort((a, b) => b.score - a.score);

  if (preGames.length === 0) return "";

  const title = preGames.length === 1 ? sectionLabel : sectionLabel + ", Ranked";

  return `
    <div class="section-header mt-8 mb-3">${title}</div>
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
      renderRankedGames(events, dayLabel);
    document.fonts.ready.then(fitHeroLines);
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
        ${others.map((o, i) => renderGameRow(o.game, i + 2, false, scoreToPercent(o.score, MAX_WATCH_SCORE))).join("")}
      </div>
    `;
  }

  html += renderRankedGames(events, "Up Next");

  content.innerHTML = html;
  document.fonts.ready.then(fitHeroLines);
}

// --- Init ---

/** Initialize NBA Now: set date label, start fetching + auto-refresh. */
export function init(): void {
  initSportsApp(API_URL, render, {
    retryBtnStyle:
      "background:#111118;color:#ff6b2b;border:1px solid #1f1f30;cursor:pointer;",
  });
}
