/**
 * Wording shared by the /workouts page and its live script. No imports, so the script bundle stays
 * tiny. Times skip AM/PM: the page says weekdays are afternoons and weekends are mornings.
 */

const NOON = 12 * 60;

/** 990 → "4:30", 480 → "8:00". */
export function clockLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 12 || 12;
  return `${hour}:${String(minutes % 60).padStart(2, "0")}`;
}

/** When a class lets out: "5:20", or "noon". */
export function endLabel(minutes: number): string {
  return minutes === NOON ? "noon" : clockLabel(minutes);
}

/** A window edge as said aloud: 900 → "3", 1050 → "5:30", 720 → "noon". */
function edgeWords(minutes: number): string {
  if (minutes === NOON) return "noon";
  return minutes % 60 === 0 ? String(Math.floor(minutes / 60) % 12 || 12) : clockLabel(minutes);
}

/** "3 and 5:30", "8 and noon". */
export function windowWords(startMin: number, endMin: number): string {
  return `${edgeWords(startMin)} and ${edgeWords(endMin)}`;
}

const SMALL = [
  "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty"];

/** Counts open sentences, so they're spelled out: 4 → "Four", 23 → "Twenty-three". */
export function countWord(n: number): string {
  if (n < SMALL.length) return SMALL[n];
  const tens = TENS[Math.floor(n / 10)];
  if (!tens) return String(n);
  return n % 10 ? `${tens}-${SMALL[n % 10].toLowerCase()}` : tens;
}

export interface SummaryClass {
  start: number;
  name: string;
}

/** Today's one-line summary: how many classes are left and when the next one starts. */
export function daySummary(upcoming: SummaryClass[], started: number): string {
  if (!upcoming.length) return started ? "Nothing else starts today." : "That’s it for today.";
  const first = upcoming[0];
  const at = clockLabel(first.start);
  if (started) {
    return upcoming.length === 1
      ? `One more: ${first.name} at ${at}.`
      : `${countWord(upcoming.length)} more, the next at ${at}.`;
  }
  if (upcoming.length === 1) return `One class: ${first.name} at ${at}.`;
  const sameTime = upcoming.every((item) => item.start === first.start);
  return `${countWord(upcoming.length)} classes, ${sameTime ? "all" : "the first"} at ${at}.`;
}
