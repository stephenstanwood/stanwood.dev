import { awayHomeOf, broadcastsOf, competitorsOf, finishedGameWatchScore, isFinalEvent, isoDateInPT, type ESPNEvent, type TeamSide } from "./wtwtwSports";
import { MS_PER_DAY } from "./time";
import { isoDateInTz } from "./dateFormat";

export const TV_TEAM_KEYS = ["nfl-steelers", "nfl-49ers", "wnba-valkyries", "mlb-cubs", "nba-warriors"];
export const REPLAY_SLOTS = [
  ["steelers", "Steelers", "#FFB612"],
  ["49ers", "49ers", "#AA0000"],
  ["nfl-best", "Best other NFL game", "#013369"],
  ["valkyries", "Valkyries", "#5F4B8B"],
  ["wnba-best", "Best other WNBA game", "#EF3340"],
  ["cubs", "Cubs", "#0E3386"],
  ["warriors", "Warriors", "#1D428A"],
  ["nba-best", "Best other NBA game", "#C9082A"],
] as const;
export type ReplaySlot = typeof REPLAY_SLOTS[number][0];
export interface ReplayGame {
  id: string;
  date: string;
  league: string;
  away: TeamSide;
  home: TeamSide;
  href: string;
  service: string;
  note: string;
}
export interface ReplayCard {
  slot: ReplaySlot;
  game: ReplayGame | null;
  empty?: string;
  unavailable?: boolean;
}
export interface ReplayFeed { cards: ReplayCard[]; builtAt: string }

export function involves(event: ESPNEvent, teams: string[]): boolean {
  return competitorsOf(event).some(c => teams.includes(c.team?.abbreviation?.toUpperCase() ?? ""));
}

export function latestFinal(events: ESPNEvent[], now = new Date()): ESPNEvent | undefined {
  return events.filter(e => isFinalEvent(e) && awayHomeOf(e) && Date.parse(e.date) <= +now)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
}

/** Football weekends run Thursday–Monday. On Tue–Sat, retain the previous weekend. */
export function nflWeekendDates(now = new Date()): string[] {
  const local = new Date(`${isoDateInPT(now)}T12:00:00Z`);
  const sunday = new Date(+local - local.getUTCDay() * MS_PER_DAY);
  return [-3, -2, -1, 0, 1].map(offset => new Date(+sunday + offset * MS_PER_DAY).toISOString().slice(0, 10))
    .filter(date => date <= isoDateInPT(now));
}

/** Result closeness dominates, with modest bonuses for quality, late swings and OT. */
export function nflWatchScore(event: ESPNEvent): number {
  const sides = awayHomeOf(event);
  if (!sides) return -Infinity;
  const margin = Math.abs(Number(sides.away.score) - Number(sides.home.score));
  if (!Number.isFinite(margin)) return -Infinity;
  const quality = competitorsOf(event).reduce((sum, c) => {
    const parts = (c.records?.find(r => r.type === "total")?.summary ?? c.records?.[0]?.summary ?? "").split("-").map(Number);
    const [w, l, t = 0] = parts;
    return sum + (w + l + t > 0 ? (w + t / 2) / (w + l + t) : 0.5);
  }, 0) / 2;
  let away = 0, home = 0, lastLeader = 0, swings = 0;
  for (let i = 0; i < 4; i++) {
    away += sides.away.linescores?.[i]?.value ?? 0;
    home += sides.home.linescores?.[i]?.value ?? 0;
    const leader = Math.sign(away - home);
    if (leader && lastLeader && leader !== lastLeader) swings++;
    if (leader) lastLeader = leader;
  }
  const thirdMargin = Math.abs(
    (sides.away.linescores ?? []).slice(0, 3).reduce((n, q) => n + q.value, 0) -
    (sides.home.linescores ?? []).slice(0, 3).reduce((n, q) => n + q.value, 0),
  );
  const hasQuarters = (sides.away.linescores?.length ?? 0) >= 4 && (sides.home.linescores?.length ?? 0) >= 4;
  return Math.max(0, 80 - margin * 4) + quality * 10 +
    ((event.competitions?.[0]?.status?.period ?? 4) > 4 ? 18 : 0) +
    Math.min(swings, 3) * 4 + (hasQuarters && thirdMargin <= 8 ? 8 : 0) +
    (event.season?.type === 3 ? 6 : 0);
}

export function bestReplay(events: ESPNEvent[], league: string, excluded: string[], now = new Date()): ESPNEvent | undefined {
  let finals = events.filter(e => isFinalEvent(e) && awayHomeOf(e) && !involves(e, excluded) && Date.parse(e.date) <= +now);
  // Basketball gets the best of the latest completed slate, including on off-days.
  if (league !== "football/nfl") {
    const latest = latestFinal(finals, now);
    if (latest) finals = finals.filter(e => isoDateInPT(new Date(e.date)) === isoDateInPT(new Date(latest.date)));
  }
  const score = league === "football/nfl" ? nflWatchScore : finishedGameWatchScore;
  return finals.sort((a, b) => score(b) - score(a) || Date.parse(b.date) - Date.parse(a.date) || (a.id ?? "").localeCompare(b.id ?? ""))[0];
}

const NFL_SLUGS: Record<string, string> = {
  ARI: "cardinals", ATL: "falcons", BAL: "ravens", BUF: "bills", CAR: "panthers", CHI: "bears",
  CIN: "bengals", CLE: "browns", DAL: "cowboys", DEN: "broncos", DET: "lions", GB: "packers",
  HOU: "texans", IND: "colts", JAX: "jaguars", JAC: "jaguars", KC: "chiefs", LAC: "chargers",
  LAR: "rams", LA: "rams", LV: "raiders", MIA: "dolphins", MIN: "vikings", NE: "patriots",
  NO: "saints", NYG: "giants", NYJ: "jets", PHI: "eagles", PIT: "steelers", SEA: "seahawks",
  SF: "49ers", TB: "buccaneers", TEN: "titans", WSH: "commanders", WAS: "commanders",
};
export function nflReplayUrl(event: ESPNEvent): string {
  const sides = awayHomeOf(event);
  const away = NFL_SLUGS[sides?.away.team?.abbreviation ?? ""];
  const home = NFL_SLUGS[sides?.home.team?.abbreviation ?? ""];
  const season = event.season?.year;
  const week = event.week?.number;
  const phase = ({ 1: "pre", 2: "reg", 3: "post" } as Record<number, string>)[event.season?.type ?? 2];
  if (!away || !home || !season || !week || !phase) return "https://www.nfl.com/plus/replays";
  return `https://www.nfl.com/games/${away}-at-${home}-${season}-${phase}-${week}?tab=highlights-replays`;
}

/** NBA edits take hours; local Warriors/Kings replays have a 72h US blackout. */
export function nbaReplayReadyAt(event: ESPNEvent): number {
  const start = Date.parse(event.date);
  const local = involves(event, ["GS", "GSW", "SAC"]);
  const national = broadcastsOf(event).some(name => /^(ABC|ESPN(?:2)?|NBC|Peacock|Prime Video|Amazon Prime Video)$/i.test(name));
  // Allow 3h for the game itself, then the local blackout or overnight processing.
  if (local && !national) return start + 75 * 60 * 60 * 1000;
  const processing = start + 12 * 60 * 60 * 1000;
  if (!national) return processing;
  const tomorrow = new Date(Date.parse(`${isoDateInTz(start, "America/New_York")}T12:00:00Z`) + MS_PER_DAY);
  const offsetText = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(tomorrow).find(part => part.type === "timeZoneName")?.value ?? "GMT-5";
  const offsetHours = Number(offsetText.replace("GMT", ""));
  const sixAmEastern = Date.parse(`${tomorrow.toISOString().slice(0, 10)}T06:00:00Z`) - offsetHours * 3600000;
  return Math.max(processing, sixAmEastern);
}
