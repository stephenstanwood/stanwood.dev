import { esc, escUrl } from "./htmlUtils";

// ── Constants ──

const API_URL =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard";
const REFRESH_MS = 30_000;
const MAX_WATCH_SCORE = 400;
const CLOSENESS_PENALTY = 15;
const EXTRA_INNINGS_MULTIPLIER = 3.5;
const MAX_PROGRESS_MULTIPLIER = 2.5;
const LATE_INNING_THRESHOLD = 7;
const LATE_INNING_BONUS = 1.5;
const RUNNERS_ON_BASE_BONUS = 0.15;

// ── Ranking algorithm ──

interface TeamRecord {
  wins: number;
  losses: number;
}

function parseRecord(competitor: any): TeamRecord {
  const rec = competitor?.records?.[0];
  if (!rec) return { wins: 0, losses: 0 };
  if (rec.summary) {
    const [w, l] = rec.summary.split("-").map(Number);
    if (!isNaN(w) && !isNaN(l)) return { wins: w, losses: l };
  }
  return { wins: 0, losses: 0 };
}

function winPct({ wins, losses }: TeamRecord): number {
  const total = wins + losses;
  return total > 0 ? wins / total : 0.5;
}

function gameProgress(status: any): number {
  const period = status?.period || 0;
  const detail = status?.type?.detail || "";
  if (period === 0) return 0;
  let halfInnings = (period - 1) * 2;
  if (/^Bot/i.test(detail) || /^End/i.test(detail)) halfInnings += 1;
  else if (/^Mid/i.test(detail)) halfInnings += 1;
  return Math.max(0, Math.min(halfInnings / 18, 1.0));
}

function isExtraInnings(status: any): boolean {
  return (status?.period || 0) > 9;
}

function isLateInning(status: any): boolean {
  return (status?.period || 0) >= LATE_INNING_THRESHOLD;
}

function getRunnersOnBase(situation: any): number {
  if (!situation) return 0;
  let count = 0;
  if (situation.onFirst) count++;
  if (situation.onSecond) count++;
  if (situation.onThird) count++;
  return count;
}

function computeWatchScore(game: any): number {
  const comp = game.competitions?.[0];
  if (!comp) return 0;
  const competitors = comp.competitors || [];
  if (competitors.length < 2) return 0;

  const score1 = parseInt(competitors[0].score || 0, 10);
  const score2 = parseInt(competitors[1].score || 0, 10);
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

  const situation = comp.situation;
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

function computePreGameScore(game: any): number {
  const comp = game.competitions?.[0];
  if (!comp) return 0;
  const competitors = comp.competitors || [];
  if (competitors.length < 2) return 0;
  const rec1 = parseRecord(competitors[0]);
  const rec2 = parseRecord(competitors[1]);
  const avgWinPct = (winPct(rec1) + winPct(rec2)) / 2;
  const diff = Math.abs(winPct(rec1) - winPct(rec2));
  const matchupBonus = 1.0 - diff;
  return avgWinPct * 100 * matchupBonus;
}

// ── Broadcast helpers ──

function getBroadcasts(competition: any) {
  const geo = competition?.geoBroadcasts || [];
  const national = geo
    .filter((b: any) => b.market?.type === "National")
    .map((b: any) => b.media?.shortName)
    .filter(Boolean);
  return { national: [...new Set(national)] as string[] };
}

function renderBroadcastBadges(competition: any, compact: boolean): string {
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

function renderDiamond(situation: any): string {
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
      <rect x="37" y="20" width="8" height="8" rx="2" fill="${baseColor(situation.onFirst)}" ${glowFilter(situation.onFirst)}/>
      <rect x="20" y="2" width="8" height="8" rx="2" fill="${baseColor(situation.onSecond)}" ${glowFilter(situation.onSecond)}/>
      <rect x="3" y="20" width="8" height="8" rx="2" fill="${baseColor(situation.onThird)}" ${glowFilter(situation.onThird)}/>
    </svg>
  `;
}

function renderCount(situation: any): string {
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

function renderMatchup(situation: any): string {
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

function renderRHE(away: any, home: any): string {
  const awayR = away?.score ?? "0";
  const awayH = away?.hits ?? "0";
  const awayE = away?.errors ?? "0";
  const homeR = home?.score ?? "0";
  const homeH = home?.hits ?? "0";
  const homeE = home?.errors ?? "0";
  const awayAbbr = teamAbbr(away);
  const homeAbbr = teamAbbr(home);

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
          <td style="${teamStyle}">${awayAbbr}</td>
          <td style="${valueStyle}">${esc(String(awayR))}</td>
          <td style="${valueStyle}">${esc(String(awayH))}</td>
          <td style="${valueStyle}">${esc(String(awayE))}</td>
        </tr>
        <tr>
          <td style="${teamStyle}">${homeAbbr}</td>
          <td style="${valueStyle}">${esc(String(homeR))}</td>
          <td style="${valueStyle}">${esc(String(homeH))}</td>
          <td style="${valueStyle}">${esc(String(homeE))}</td>
        </tr>
      </table>
    </div>
  `;
}

// ── Rendering helpers ──

function teamAbbr(competitor: any): string {
  return esc(competitor?.team?.abbreviation || "???");
}

function teamColor(competitor: any): string {
  const c = competitor?.team?.color;
  return c && /^[0-9a-fA-F]{3,8}$/.test(c) ? `#${c}` : "#d97706";
}

function statusLabel(status: any): string {
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

function isLive(status: any): boolean {
  return (status?.type?.state || "") === "in";
}

function formatFirstPitch(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles",
  });
}

function renderHeroTeam(
  competitor: any,
  status: any,
  label: string,
  isWinning: boolean,
  isLosing: boolean,
): string {
  const abbr = teamAbbr(competitor);
  const city = esc(competitor?.team?.location || abbr);
  const name = esc(competitor?.team?.name || "");
  const record = esc(competitor?.records?.[0]?.summary || "");
  const logoUrl = escUrl(competitor?.team?.logo || "");
  const color = teamColor(competitor);
  const state = status?.type?.state;
  const showScore = state && state !== "pre";
  const score = showScore ? (competitor?.score ?? "\u2013") : "";

  let scoreStyle = "color: #e5e7eb;";
  if (isWinning)
    scoreStyle = `color: #fbbf24; text-shadow: 0 0 12px rgba(251, 191, 36, 0.5);`;
  else if (isLosing) scoreStyle = "color: rgba(255, 255, 255, 0.3);";

  return `
    <div class="flex items-center justify-between py-1.5">
      <div class="flex items-center gap-3">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="${abbr}" width="32" height="32" style="object-fit: contain;" />`
            : `<div style="width:32px;height:32px;border-radius:50%;background:${color};"></div>`
        }
        <div>
          <div style="font-size: 10px; letter-spacing: 0.15em; color: rgba(255,255,255,0.3); text-transform: uppercase;">${label}</div>
          <div class="font-score text-xl font-bold tracking-wider" style="color: #e5e7eb;">${name}</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px;">${record}</div>
        </div>
      </div>
      ${score ? `<div class="font-score text-4xl font-black tracking-wider" style="${scoreStyle}">${score}</div>` : ""}
    </div>
  `;
}

function teamMascot(competitor: any): string {
  return esc(
    competitor?.team?.name || competitor?.team?.abbreviation || "Team",
  );
}

function renderHeroCard(game: any): string {
  const comp = game.competitions?.[0];
  const competitors = comp?.competitors || [];
  const status = comp?.status;
  const live = isLive(status);
  const watchScore = computeWatchScore(game);
  const maxScore = MAX_WATCH_SCORE;
  const situation = comp?.situation;

  const away =
    competitors.find((c: any) => c.homeAway === "away") || competitors[0];
  const home =
    competitors.find((c: any) => c.homeAway === "home") || competitors[1];
  const barPct = Math.min(100, Math.round((watchScore / maxScore) * 100));

  const awayScore = parseInt(away?.score || 0, 10);
  const homeScore = parseInt(home?.score || 0, 10);
  const state = status?.type?.state;
  const hasScores = state && state !== "pre";

  const { national } = getBroadcasts(comp);
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
    <div class="hero-card p-5">
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

function renderGameRow(game: any, rank: number, isPreGame: boolean): string {
  const comp = game.competitions?.[0];
  const competitors = comp?.competitors || [];
  const status = comp?.status;
  const live = isLive(status);

  const away =
    competitors.find((c: any) => c.homeAway === "away") || competitors[0];
  const home =
    competitors.find((c: any) => c.homeAway === "home") || competitors[1];

  const awayScore = away?.score ?? "";
  const homeScore = home?.score ?? "";
  const awayNum = parseInt(awayScore || 0, 10);
  const homeNum = parseInt(homeScore || 0, 10);
  const awayAbbr = teamAbbr(away);
  const homeAbbr = teamAbbr(home);
  const awayLogo = escUrl(away?.team?.logo || "");
  const homeLogo = escUrl(home?.team?.logo || "");

  const showScores = !isPreGame;
  const firstPitch = isPreGame ? formatFirstPitch(game.date) : "";
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
    <div class="game-row px-3 py-2.5" style="display:flex;align-items:center;gap:12px;">
      <div style="font-family:Orbitron,monospace;font-size:10px;color:rgba(255,255,255,0.3);width:24px;text-align:right;flex-shrink:0;">${rank}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${
              awayLogo
                ? `<img src="${awayLogo}" alt="${awayAbbr}" width="16" height="16" style="object-fit:contain;" />`
                : `<div style="width:16px;height:16px;border-radius:50%;background:#d97706;"></div>`
            }
            <span class="font-score text-xs font-semibold tracking-wider" style="color:#e5e7eb;">${awayAbbr}</span>
          </div>
          ${showScores ? `<span class="font-score text-sm font-bold tracking-wider" style="${awayScoreStyle}">${awayScore}</span>` : ""}
        </div>
        <div class="flex items-center justify-between mt-0.5">
          <div class="flex items-center gap-2">
            ${
              homeLogo
                ? `<img src="${homeLogo}" alt="${homeAbbr}" width="16" height="16" style="object-fit:contain;" />`
                : `<div style="width:16px;height:16px;border-radius:50%;background:#d97706;"></div>`
            }
            <span class="font-score text-xs font-semibold tracking-wider" style="color:#e5e7eb;">${homeAbbr}</span>
          </div>
          ${showScores ? `<span class="font-score text-sm font-bold tracking-wider" style="${homeScoreStyle}">${homeScore}</span>` : ""}
        </div>
      </div>
      <div class="text-right flex-shrink-0" style="min-width: 70px;">
        <div class="flex items-center justify-end gap-1.5">
          ${live ? '<div class="live-dot" style="width:5px;height:5px;"></div>' : ""}
          <span class="font-score text-xs" style="color:${live ? "#fca5a5" : "rgba(255,255,255,0.5)"};">${statusText}</span>
        </div>
        ${renderBroadcastBadges(comp, true)}
      </div>
    </div>
  `;
}

function renderNoGames(events: any[]): string {
  const scheduled = events
    .filter((e) => e.competitions?.[0]?.status?.type?.state === "pre")
    .map((g) => ({ game: g, score: computePreGameScore(g) }))
    .sort((a, b) => b.score - a.score);

  if (scheduled.length > 0) {
    const best = scheduled[0].game;
    const comp = best.competitions?.[0];
    const away = comp?.competitors?.find((c: any) => c.homeAway === "away");
    const home = comp?.competitors?.find((c: any) => c.homeAway === "home");
    const time = formatFirstPitch(best.date);
    const { national } = getBroadcasts(comp);
    const network = national.length > 0 ? national[0] : "MLB.TV";

    const awayLogo = escUrl(away?.team?.logo || "");
    const homeLogo = escUrl(home?.team?.logo || "");

    return `
      <div class="hero-card p-5">
        <div class="hero-sentence">
          <div class="hero-line">the best game</div>
          <div class="hero-line">today is the</div>
          <div class="hero-line hl-team">${teamMascot(away)}</div>
          <div class="hero-line">versus the</div>
          <div class="hero-line hl-team">${teamMascot(home)}</div>
          <div class="hero-line hl-time">${esc(time)} pacific</div>
          <div class="hero-line">on <span class="hl-network">${esc(network)}</span></div>
        </div>

        <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin-top:28px;">
          ${awayLogo ? `<img src="${awayLogo}" alt="${teamMascot(away)}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
          <span class="font-score" style="font-size:20px;color:rgba(255,255,255,0.15);font-weight:700;">VS</span>
          ${homeLogo ? `<img src="${homeLogo}" alt="${teamMascot(home)}" width="96" height="96" style="object-fit:contain;opacity:0.9;" />` : ""}
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

function getGameDayLabel(events: any[]): string {
  const firstGame = events.find((e) => e.date);
  if (!firstGame) return "Games";
  const gameDate = new Date(firstGame.date);
  const now = new Date();
  const pt = "America/Los_Angeles";
  const gameDayStr = gameDate.toLocaleDateString("en-US", {
    timeZone: pt,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = now.toLocaleDateString("en-US", {
    timeZone: pt,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", {
    timeZone: pt,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (gameDayStr === todayStr) return "Today's Games";
  if (gameDayStr === tomorrowStr) return "Tomorrow's Games";
  const dayName = gameDate.toLocaleDateString("en-US", {
    timeZone: pt,
    weekday: "long",
  });
  return `${dayName}'s Games`;
}

function renderRankedGames(events: any[], sectionLabel: string): string {
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

/** Scale each .hero-line to fill the container width, creating a boxy block. */
function fitHeroLines(): void {
  const container = document.querySelector(".hero-sentence") as HTMLElement;
  if (!container) return;
  const targetWidth = container.clientWidth;
  const lines = container.querySelectorAll(
    ".hero-line",
  ) as NodeListOf<HTMLElement>;
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

function render(events: any[]): void {
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
      <div class="section-header mt-6 mb-3">Also Live, Ranked by Watchability</div>
      <div class="space-y-1.5">
        ${others.map((o, i) => renderGameRow(o.game, i + 2, false)).join("")}
      </div>
    `;
  }

  html += renderRankedGames(events, "Coming Up");
  content.innerHTML = html;
  document.fonts.ready.then(fitHeroLines);
}

// ── Fetch + loop ──

async function fetchAndRender(): Promise<void> {
  const loading = document.getElementById("loading");
  const content = document.getElementById("content");
  const errorEl = document.getElementById("error");
  if (!loading || !content || !errorEl) return;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();
    const events = data?.events || [];

    loading.style.display = "none";
    errorEl.style.display = "none";
    content.style.display = "block";
    render(events);
  } catch (err) {
    loading.style.display = "none";
    content.style.display = "none";
    errorEl.style.display = "block";
    errorEl.innerHTML = `
      <div class="hero-card p-6 text-center">
        <div class="font-score text-xs" style="color: #fca5a5;">
          ${esc((err as Error).message)}
        </div>
        <button
          id="mlb-retry-btn"
          class="mt-3 font-score text-xs font-semibold px-4 py-2 rounded-lg"
          style="background: rgba(0,0,0,0.3); color: #fbbf24; border: 1px solid rgba(255,255,255,0.1); cursor: pointer;"
        >
          RETRY
        </button>
      </div>
    `;
    document
      .getElementById("mlb-retry-btn")
      ?.addEventListener("click", fetchAndRender);
  }
}

// ── Public init ──

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
  window.addEventListener("resize", fitHeroLines);
}
