import { useCyclingIndex } from "../../hooks/useCyclingIndex";

const MESSAGES: Record<string, string[]> = {
  screenshot: ["taking a snapshot...", "waiting for the page to load..."],
  analyzing: [
    "reading the room...",
    "inspecting the typography...",
    "finding alternate timelines...",
    "raiding the font library...",
    "restyling reality...",
    "picking palettes from parallel universes...",
    "loading the rolodex...",
  ],
};

/** Cycles through loading messages appropriate for the given phase. */
export function useLoadingMessages(phase: string): string {
  const pool = phase === "screenshot" ? MESSAGES.screenshot : MESSAGES.analyzing;
  const index = useCyclingIndex(pool.length, 2200, { resetKey: phase });
  return pool[index];
}
