import {
  esc,
  escUrl,
  type Competitor,
  type Status,
  type Competition,
  type Game,
  computePreGameScore,
  getBroadcasts,
  teamAbbr,
  teamMascot,
  isLive,
  getGameDayLabel,
  fitHeroLines,
  formatGameTime,
  initSportsApp,
  parseRecord,
  winPct,
} from "./sportsCore";
import { safeGet } from "./localStorage";

// ── MLB-specific types ──

interface MLBSituation {
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
  balls?: number;
  strikes?: number;
  outs?: number;
  pitcher?: {
    athlete?: { shortName?: string; displayName?: string };
    summary?: string;
  };
  batter?: {
    athlete?: { shortName?: string; displayName?: string };
    summary?: string;
  };
}

// ── MLB-specific constants ──

const API_URL =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard";
const MAX_WATCH_SCORE = 400;
const CLOSENESS_PENALTY = 15;
const EXTRA_INNINGS_MULTIPLIER = 3.5;
const MAX_PROGRESS_MULTIPLIER = 2.5;
const LATE_INNING_THRESHOLD = 7;
const LATE_INNING_BONUS = 1.5;
const RUNNERS_ON_BASE_BONUS = 0.15;

// ── Baseball-specific ranking helpers ──

function gameProgress(status: Status | undefined): number {
  const period = status?.period || 0;
  const detail = status?.type?.detail || "";
  if (period === 0) return 0;
  let halfInnings = (period - 1) * 2;
  if (/^Bot/i.test(detail) || /^End/i.test(detail)) halfInnings += 1;
  else if (/^Mid/i.test(detail)) halfInnings += 1;
  return Math.max(0, Math.min(halfInnings / 18, 1.0));
}

function isExtraInnings(status: Status | undefined): boolean {
  return (status?.period || 0) > 9;
}

function isLateInning(status: Status | undefined): boolean {
  return (status?.period || 0) >= LATE_INNING_THRESHOLD;
}

function getRunnersOnBase(situation: MLBSituation | undefined): number {
  if (!situation) return 0;
  let count = 0;
  if (situation.onFirst) count++;
  if (situation.onSecond) count++;
  if (situation.onThird) count++;
  return count;
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

  const status = comp.status;
  const progress = gameProgress(status);
  const extraInnings = isExtraInnings(status);
  const lateInning = isLateInning(status);

  const closenessScore = Math.max(0, 100 - scoreDelta * CLOSENESS_PENALTY);
  const qualityMultiplier = 0.5 + avgWinPct;

  let progressMultiplier;
  if (extraInnings) {
    progressMultiplier = EXTRA_INNINGS_MULTIPLIER;
  } else {
    progressMultiplier =
      1.0 + Math.min(progress, 1.0) * MAX_PROGRESS_MULTIPLIER;
  }

  let lateBonus = 1.0;
  if (lateInning && scoreDelta <= 2) lateBonus = LATE_INNING_BONUS;

  const situation = comp.situation as MLBSituation | undefined;
  const runners = getRunnersOnBase(situation);
  const runnerBonus = 1.0 + runners * RUNNERS_ON_BASE_BONUS;

  return (
    closenessScore *
    qualityMultiplier *
    progressMultiplier *
    lateBonus *
    runnerBonus
  );
}

// ── MLB-specific broadcast rendering ──

function renderBroadcastBadges(competition: Competition, compact: boolean): string {
  const { national } = getBroadcasts(competition);

  const nationalStyle =
    "display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.03em;padding:2px 6px;border-radius:3px;white-space:nowrap;line-height:1;text-transform:uppercase;background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);";
  const mlbTvStyle =
    "display:inline-flex;align-items:center;font-family:Inter,sans-serif;font-size:9px;font-weight:600;letter-spacing:0.03em;padding:2px 5px;border-radius:3px;white-space:nowrap;line-height:1;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);border:1px solid rgba(255,255,255,0.1);";

  let badge;
  if (national.length > 0) {
    badge = `<span style="${nationalStyle}">${esc(national[0])}</span>`;
  } else {
    badge = `<span style="${mlbTvStyle}">MLB.TV</span>`;
  }

  return `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;justify-content:${compact ? "flex-end" : "center"};${compact ? "" : "margin-top:8px;"}">${badge}</div>`;
}

// ── Baseball-specific rendering ──

function renderDiamond(situation: MLBSituation | undefined): string {
  if (!situation) return "";

  const baseColor = (occupied: boolean) =>
    occupied ? "#fbbf24" : "rgba(255,255,255,0.12)";
  const glowFilter = (occupied: boolean) =>
    occupied ? 'filter="url(#baseGlow)"' : "";

  return `
    <svg width="48" height="48" viewBox="0 0 48 48" style="flex-shrink:0;" role="img" aria-label="Bases: ${[situation.onFirst && "1st", situation.onSecond && "2nd", situation.onThird && "3rd"].filter(Boolean).join(", ") || "empty"}">
      <defs>
        <filter id="baseGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#fbbf24" flood-opacity="0.7"/>
        </filter>
      </defs>
      <path d="M24 6 L42 24 L24 42 L6 24 Z" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
      <rect x="21" y="39" width="6" height="4" rx="1" fill="rgba(255,255,255,0.2)"/>
      <rect x="37" y="20" width="8" height="8" rx="2" fill="${baseColor(!!situation.onFirst)}" ${glowFilter(!!situation.onFirst)}/>
      <rect x="20" y="2" width="8" height="8" rx="2" fill="${baseColor(!!situation.onSecond)}" ${glowFilter(!!situation.onSecond)}/>
      <rect x="3" y="20" width="8" height="8" rx="2" fill="${baseColor(!!situation.onThird)}" ${glowFilter(!!situation.onThird)}/>
    </svg>
  `;
}

function renderCount(situation: MLBSituation | undefined): string {
  if (!situation) return "";

  const balls = situation.balls ?? 0;
  const strikes = situation.strikes ?? 0;
  const outs = situation.outs ?? 0;

  function dots(count: number, max: number, activeColor: string) {
    return Array.from({ length: max }, (_, i) => {
      const active = i < count;
      return `<div style="width:8px;height:8px;border-radius:50%;background:${active ? activeColor : "rgba(255,255,255,0.1)"};${active ? `box-shadow:0 0 4px ${activeColor};` : ""}"></div>`;
    }).join("");
  }

  return `
    <div style="display:flex;flex-direction:column;gap:4px;font-family:Orbitron,monospace;font-size:10px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="color:rgba(255,255,255,0.3);width:10px;">B</span>
        <div style="display:flex;gap:3px;">${dots(balls, 4, "#22c55e")}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="color:rgba(255,255,255,0.3);width:10px;">S</span>
        <div style="display:flex;gap:3px;">${dots(strikes, 3, "#dc2626")}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="color:rgba(255,255,255,0.3);width:10px;">O</span>
        <div style="display:flex;gap:3px;">${dots(outs, 3, "#fbbf24")}</div>
      </div>
    </div>
  `;
}

function renderMatchup(situation: MLBSituation | undefined): string {
  if (!situation) return "";
  const pitcher =
    situation.pitcher?.athlete?.shortName ||
    situation.pitcher?.athlete?.displayName ||
    "";
  const batter =
    situation.batter?.athlete?.shortName ||
    situation.batter?.athlete?.displayName ||
    "";
  if (!pitcher && !batter) return "";
  const pitcherSummary = situation.pitcher?.summary || "";
  const batterSummary = situation.batter?.summary || "";

  return `
    <div style="display:flex;gap:16px;font-size:11px;margin-top:6px;justify-content:center;flex-wrap:wrap;">
      ${
        pitcher
          ? `
        <div>
          <span style="color:rgba(255,255,255,0.3);font-family:Orbitron,monospace;font-size:9px;letter-spacing:0.1em;">P</span>
          <span style="color:rgba(255,255,255,0.7);margin-left:4px;">${esc(pitcher)}</span>
          ${pitcherSummary ? `<span style="color:rgba(255,255,255,0.35);margin-left:4px;font-size:10px;">${esc(pitcherSummary)}</span>` : ""}
        </div>
      `
          : ""
      }
      ${
        batter
          ? `
        <div>
          <span style="color:rgba(255,255,255,0.3);font-family:Orbitron,monospace;font-size:9px;letter-spacing:0.1em;">AB</span>
          <span style="color:rgba(255,255,255,0.7);margin-left:4px;">${esc(batter)}</span>
          ${batterSummary ? `<span style="color:rgba(255,255,255,0.35);margin-left:4px;font-size:10px;">${esc(batterSummary)}</span>` : ""}
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderRHE(away: Competitor, home: Competitor): string {
  const awayR = away?.score ?? "0";
  const awayH = away?.hits ?? "0";
  const awayE = away?.errors ?? "0";
  const homeR = home?.score ?? "0";
  const homeH = home?.hits ?? "0";
  const homeE = home?.errors ?? "0";
  const awayAbbrStr = teamAbbr(away);
  const homeAbbrStr = teamAbbr(home);

  const headerStyle =
    "font-family:Orbitron,monospace;font-size:9px;text-align:center;padding:2px 8px;color:rgba(255,255,255,0.35);letter-spacing:0.15em;";
  const valueStyle =
    "font-family:Orbitron,monospace;font-size:11px;text-align:center;padding:2px 8px;color:#fbbf24;";
  const teamStyle =
    "font-family:Orbitron,monospace;font-size:10px;text-align:left;padding:2px 12px 2px 0;color:rgba(255,255,255,0.5);";

  return `
    <div style="margin-top:12px;display:flex;justify-content:center;">
      <table style="border-collapse:collapse;">
        <tr>
          <td style="${headerStyle}"></td>
          <td style="${headerStyle}">R</td>
          <td style="${headerStyle}">H</td>
          <td style="${headerStyle}">E</td>
        </tr>
        <tr>
          <td style="${teamStyle}">${awayAbbrStr}</td>
          <td style="${valueStyle}">${esc(String(awayR))}</td>
          <td style="${valueStyle}">${esc(String(awayH))}</td>
          <td style="${valueStyle}">${esc(String(awayE))}</td>
        </tr>
        <tr>
          <td style="${teamStyle}">${homeAbbrStr}</td>
          <td style="${valueStyle}">${esc(String(homeR))}</td>
          <td style="${valueStyle}">${esc(String(homeH))}</td>
          <td style="${valueStyle}">${esc(String(homeE))}</td>
        </tr>
      </table>
    </div>
  `;
}

// ── Rendering helpers ──

function statusLabel(status: Status | undefined): string {
  const period = status?.period || 0;
  const state = status?.type?.state || "";
  const detail = status?.type?.shortDetail || status?.type?.detail || "";
  const desc = status?.type?.description || "";
  if (state === "post" || desc === "Final") {
    if (period > 9) return `FINAL/${period}`;
    return "FINAL";
  }
  if (state === "pre" || period === 0) return "";
  return detail;
}

function formatFirstPitch(dateStr: string): string {
  return formatGameTime(dateStr, true);
}

function renderHeroCard(game: Game): string {
  const comp = game.competitions?.[0];
  const competitors = comp?.competitors || [];
  const status = comp?.status;
  const live = isLive(status);
  const watchScore = computeWatchScore(game);
  const maxScore = MAX_WATCH_SCORE;
  const situation = comp?.situation as MLBSituation | undefined;

  const away =
    competitors.find((c: Competitor) => c.homeAway === "away") || competitors[0];
  const home =
    competitors.find((c: Competitor) => c.homeAway === "home") || competitors[1];
  const barPct = Math.min(100, Math.round((watchScore / maxScore) * 100));

  const awayScore = parseInt(away?.score || "0", 10);
  const homeScore = parseInt(home?.score || "0", 10);
  const state = status?.type?.state;
  const hasScores = state && state !== "pre";

  const { national } = getBroadcasts(comp!);
  const network = national.length > 0 ? national[0] : "MLB.TV";

  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");

  // Score colors: gold for winning, dim for losing
  const awayScoreColor =
    hasScores && awayScore > homeScore
      ? "color:#fbbf24;text-shadow:0 0 10px rgba(251,191,36,0.4);"
      : hasScores && awayScore < homeScore
        ? "color:rgba(255,255,255,0.3);"
        : "color:#e5e7eb;";
  const homeScoreColor =
    hasScores && homeScore > awayScore
      ? "color:#fbbf24;text-shadow:0 0 10px rgba(251,191,36,0.4);"
      : hasScores && homeScore < awayScore
        ? "color:rgba(255,255,255,0.3);"
        : "color:#e5e7eb;";

  return `
    <div class="hero-card p-5" data-away="${teamAbbr(away)}" data-home="${teamAbbr(home)}">
      <div class="hero-sentence">
        <div class="hero-line">the best game</div>
        <div class="hero-line">right now is the</div>
        <div class="hero-line hl-team">${teamMascot(away)}</div>
        <div class="hero-line">versus the</div>
        <div class="hero-line hl-team">${teamMascot(home)}</div>
        <div class="hero-line">on <span class="hl-network">${esc(network)}</span></div>
      </div>

      <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-top:28px;">
        ${awayLogo ? `<img src="${awayLogo}" alt="${teamMascot(away)}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
        ${
          hasScores
            ? `<div class="score-detail" style="flex-direction:column;gap:6px;">
                <span style="${awayScoreColor}">${teamAbbr(away)} ${awayScore}</span>
                <span style="color:rgba(255,255,255,0.15);">\u2014</span>
                <span style="${homeScoreColor}">${teamAbbr(home)} ${homeScore}</span>
              </div>`
            : `<span class="font-score" style="font-size:20px;color:rgba(255,255,255,0.15);font-weight:700;">VS</span>`
        }
        ${homeLogo ? `<img src="${homeLogo}" alt="${teamMascot(home)}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
      </div>

      <div style="margin-top:16px;" class="text-center">
        <div class="flex justify-center">
          <div class="status-pill ${live ? "live" : ""}">
            ${live ? '<div class="live-dot"></div>' : ""}
            ${live ? "LIVE &middot; " : ""}${statusLabel(status)}
          </div>
        </div>
      </div>

      ${hasScores ? renderRHE(away, home) : ""}

      ${
        live && situation
          ? `
        <div class="situation-panel">
          <div style="display:flex;align-items:center;gap:16px;justify-content:center;">
            ${renderDiamond(situation)}
            ${renderCount(situation)}
          </div>
          ${renderMatchup(situation)}
        </div>
      `
          : ""
      }

      <div style="display:flex;align-items:center;gap:8px;margin-top:16px;">
        <div style="font-family:Orbitron,monospace;font-size:8px;font-weight:600;letter-spacing:0.15em;color:rgba(255,255,255,0.25);flex-shrink:0;">WATCHABILITY</div>
        <div class="watch-bar-track" style="flex:1;">
          <div class="watch-bar-fill" style="width: ${barPct}%;"></div>
        </div>
        <div style="font-family:Orbitron,monospace;font-size:10px;font-weight:700;color:#fbbf24;text-shadow:0 0 8px rgba(251,191,36,0.3);flex-shrink:0;min-width:30px;text-align:right;">${barPct}%</div>
      </div>
    </div>
  `;
}

function renderGameRow(game: Game, rank: number, isPreGame: boolean, watchPct?: number): string {
  const comp = game.competitions?.[0];
  const competitors = comp?.competitors || [];
  const status = comp?.status;
  const live = isLive(status);

  const away =
    competitors.find((c: Competitor) => c.homeAway === "away") || competitors[0];
  const home =
    competitors.find((c: Competitor) => c.homeAway === "home") || competitors[1];

  const awayScore = away?.score ?? "";
  const homeScore = home?.score ?? "";
  const awayNum = parseInt(awayScore || "0", 10);
  const homeNum = parseInt(homeScore || "0", 10);
  const awayAbbrStr = teamAbbr(away);
  const homeAbbrStr = teamAbbr(home);
  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");

  const showScores = !isPreGame;
  const firstPitch = isPreGame ? formatFirstPitch(game.date!) : "";
  const statusText = isPreGame ? firstPitch + " PT" : statusLabel(status);

  const awayScoreStyle =
    showScores && awayNum > homeNum
      ? "color:#fbbf24;text-shadow:0 0 8px rgba(251,191,36,0.4);"
      : showScores && awayNum < homeNum
        ? "color:rgba(255,255,255,0.3);"
        : "color:#e5e7eb;";
  const homeScoreStyle =
    showScores && homeNum > awayNum
      ? "color:#fbbf24;text-shadow:0 0 8px rgba(251,191,36,0.4);"
      : showScores && homeNum < awayNum
        ? "color:rgba(255,255,255,0.3);"
        : "color:#e5e7eb;";

  return `
    <div class="game-row px-3 py-2.5" data-away="${awayAbbrStr}" data-home="${homeAbbrStr}" style="display:flex;align-items:center;gap:12px;">
      <div style="font-family:Orbitron,monospace;font-size:10px;color:rgba(255,255,255,0.3);width:24px;text-align:right;flex-shrink:0;">${rank}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${
              awayLogo
                ? `<img src="${awayLogo}" alt="${awayAbbrStr}" width="16" height="16" style="object-fit:contain;" />`
                : `<div style="width:16px;height:16px;border-radius:50%;background:#d97706;"></div>`
            }
            <span class="font-score text-xs font-semibold tracking-wider" style="color:#e5e7eb;">${awayAbbrStr}</span>
          </div>
          ${showScores ? `<span class="font-score text-sm font-bold tracking-wider" style="${awayScoreStyle}">${awayScore}</span>` : ""}
        </div>
        <div class="flex items-center justify-between mt-0.5">
          <div class="flex items-center gap-2">
            ${
              homeLogo
                ? `<img src="${homeLogo}" alt="${homeAbbrStr}" width="16" height="16" style="object-fit:contain;" />`
                : `<div style="width:16px;height:16px;border-radius:50%;background:#d97706;"></div>`
            }
            <span class="font-score text-xs font-semibold tracking-wider" style="color:#e5e7eb;">${homeAbbrStr}</span>
          </div>
          ${showScores ? `<span class="font-score text-sm font-bold tracking-wider" style="${homeScoreStyle}">${homeScore}</span>` : ""}
        </div>
      </div>
      <div class="text-right flex-shrink-0" style="min-width: 70px;">
        <div class="flex items-center justify-end gap-1.5">
          ${live ? '<div class="live-dot" style="width:5px;height:5px;"></div>' : ""}
          <span class="font-score text-xs" style="color:${live ? "#fca5a5" : "rgba(255,255,255,0.5)"};">${statusText}</span>
        </div>
        ${renderBroadcastBadges(comp!, true)}
        ${watchPct != null ? `<div style="display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:3px;"><div style="height:2px;width:36px;border-radius:1px;background:rgba(0,0,0,0.3);overflow:hidden;"><div style="height:100%;width:${watchPct}%;border-radius:1px;background:linear-gradient(90deg,#d97706,#fbbf24);"></div></div><span style="font-family:Orbitron,monospace;font-size:8px;font-weight:600;color:#fbbf24;">${watchPct}%</span></div>` : ""}
      </div>
    </div>
  `;
}

function renderNoGames(events: Game[]): string {
  const scheduled = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "pre")
    .map((g) => ({ game: g, score: computePreGameScore(g) }))
    .sort((a, b) => b.score - a.score);

  if (scheduled.length > 0) {
    const best = scheduled[0].game;
    const comp = best.competitions?.[0];
    const away = comp?.competitors?.find((c: Competitor) => c.homeAway === "away");
    const home = comp?.competitors?.find((c: Competitor) => c.homeAway === "home");
    const time = formatFirstPitch(best.date!);
    const { national } = getBroadcasts(comp!);
    const network = national.length > 0 ? national[0] : "MLB.TV";

    const awayLogo = escUrl(away?.team?.logo || "");
    const homeLogo = escUrl(home?.team?.logo || "");

    return `
      <div class="hero-card p-5">
        <div class="hero-sentence">
          <div class="hero-line">the best game</div>
          <div class="hero-line">today is the</div>
          <div class="hero-line hl-team">${teamMascot(away!)}</div>
          <div class="hero-line">versus the</div>
          <div class="hero-line hl-team">${teamMascot(home!)}</div>
          <div class="hero-line hl-time">${esc(time)} pacific</div>
          <div class="hero-line">on <span class="hl-network">${esc(network)}</span></div>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-top:28px;">
          ${awayLogo ? `<img src="${awayLogo}" alt="${teamMascot(away!)}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
          <span class="font-score" style="font-size:20px;color:rgba(255,255,255,0.15);font-weight:700;">VS</span>
          ${homeLogo ? `<img src="${homeLogo}" alt="${teamMascot(home!)}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
        </div>
      </div>
    `;
  }

  const message = events.length === 0 ? "NO GAMES TODAY" : "NO LIVE GAMES";

  return `
    <div class="hero-card p-8 text-center">
      <div class="font-score text-lg font-bold tracking-widest" style="color: #fbbf24;">${message}</div>
    </div>
  `;
}

function renderHowItWorks(): string {
  const factors = [
    {
      icon: "⚡",
      label: "Closeness",
      desc: "Tight games score higher. Every extra run of margin cuts the score.",
    },
    {
      icon: "⏱",
      label: "Late innings",
      desc: "7th inning on with the game on the line gets a big boost.",
    },
    {
      icon: "🟡",
      label: "Runners on base",
      desc: "More traffic on the bases means more tension — and a higher score.",
    },
    {
      icon: "📈",
      label: "Team quality",
      desc: "Two .550 teams in a tight game beats a blowout between cellar-dwellers.",
    },
    {
      icon: "🔄",
      label: "Extra innings",
      desc: "Any game that goes past the 9th gets a major watchability multiplier.",
    },
  ];

  const factorHtml = factors.map((f) => `
    <div style="display:flex;gap:10px;align-items:flex-start;">
      <span style="font-size:16px;flex-shrink:0;line-height:1.4;">${f.icon}</span>
      <div>
        <span style="font-family:Orbitron,monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);">${f.label}</span>
        <span style="font-size:12px;color:rgba(255,255,255,0.3);margin-left:6px;">${f.desc}</span>
      </div>
    </div>
  `).join("");

  return `
    <div style="margin-top:28px;padding:16px 18px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:10px;">
      <div style="font-family:Orbitron,monospace;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(251,191,36,0.5);margin-bottom:12px;">How Watchability Is Scored</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${factorHtml}
      </div>
    </div>
  `;
}

function renderRankedGames(events: Game[], sectionLabel: string): string {
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

function renderFinalScores(events: Game[]): string {
  const finished = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "post")
    .map((g) => ({ game: g, score: computeWatchScore(g) }))
    .sort((a, b) => b.score - a.score);
  if (finished.length === 0) return "";
  return `
    <div class="section-header mt-8 mb-3">Final Scores</div>
    <div class="space-y-1.5">
      ${finished.map((g, i) => renderGameRow(g.game, i + 1, false, Math.min(100, Math.round((g.score / MAX_WATCH_SCORE) * 100)))).join("")}
    </div>
  `;
}

function render(events: Game[]): void {
  const content = document.getElementById("content");
  if (!content) return;

  const liveGames = events.filter((e) => {
    const state = e.competitions?.[0]?.status?.type?.state;
    return state === "in";
  });
  const dayLabel = getGameDayLabel(events);

  if (liveGames.length === 0) {
    content.innerHTML =
      renderNoGames(events) +
      renderFinalScores(events) +
      renderRankedGames(events, dayLabel) +
      renderHowItWorks();
    highlightFavorites();
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
      <div class="section-header mt-6 mb-3">Also Live, Ranked by Watchability</div>
      <div class="space-y-1.5">
        ${others.map((o, i) => renderGameRow(o.game, i + 2, false, Math.min(100, Math.round((o.score / MAX_WATCH_SCORE) * 100)))).join("")}
      </div>
    `;
  }

  html += renderRankedGames(events, "Coming Up");
  html += renderFinalScores(events);
  html += renderHowItWorks();
  content.innerHTML = html;
  highlightFavorites();
  document.fonts.ready.then(fitHeroLines);
}

// ── Favorite teams highlight ──

export function highlightFavorites(): void {
  const favs = safeGet<string[]>("mlb-fav-teams") ?? [];
  document.querySelectorAll<HTMLElement>("[data-home][data-away]").forEach((el) => {
    const home = el.getAttribute("data-home") || "";
    const away = el.getAttribute("data-away") || "";
    el.classList.toggle("fav-game", favs.includes(home) || favs.includes(away));
  });
}

// ── Public init ──

export function init(): void {
  (window as unknown as Record<string, unknown>).__mlbHighlight = highlightFavorites;
  initSportsApp(API_URL, render, {
    errorBtnId: "mlb-retry-btn",
    retryBtnStyle: "background:rgba(0,0,0,0.3);color:#fbbf24;border:1px solid rgba(255,255,255,0.1);cursor:pointer;",
  });
}
