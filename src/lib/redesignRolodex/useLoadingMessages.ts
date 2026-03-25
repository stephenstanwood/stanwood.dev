import { useState, useEffect } from "react";

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
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [phase]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % pool.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [pool]);

  return pool[idx];
}
