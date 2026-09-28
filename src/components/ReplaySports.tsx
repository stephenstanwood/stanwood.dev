import { useEffect, useState } from "react";
import RecapMatchup from "./RecapMatchup";
import { REPLAY_SLOTS, type ReplayFeed } from "../lib/tvReplays";

const CACHE_KEY = "tv-replays-v1";
export default function ReplaySports() {
  const [feed, setFeed] = useState<ReplayFeed | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let previous: ReplayFeed | null = null;
    try {
      previous = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
      if (previous?.cards) setFeed(previous);
      setShowScores(localStorage.getItem("tv-replay-scores") === "show");
    } catch { /* storage may be unavailable */ }
    fetch("/api/tv/replays").then(async res => {
      if (!res.ok) throw new Error("Replay feed unavailable");
      const next: ReplayFeed = await res.json();
      if (!Array.isArray(next.cards)) throw new Error("Invalid replay feed");
      next.cards = next.cards.map(c => c.unavailable && !c.game ? { ...c, game: previous?.cards.find(p => p.slot === c.slot)?.game ?? null } : c);
      if (!active) return;
      setFeed(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* optional cache */ }
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const best = feed?.cards.find(c => c.slot === "wnba-best")?.game;
    const launcher = document.getElementById("best-wnba-launcher");
    if (best && launcher instanceof HTMLAnchorElement) {
      launcher.href = best.href;
      launcher.title = `Best other WNBA game: ${best.away.shortName} @ ${best.home.shortName}`;
      launcher.setAttribute("aria-label", launcher.title);
    }
  }, [feed]);

  return <>
    <div className="replay-controls">
      <span>Full game replays</span>
      <button type="button" aria-pressed={showScores} onClick={() => {
        setShowScores(!showScores);
        try { localStorage.setItem("tv-replay-scores", showScores ? "hide" : "show"); } catch { /* optional */ }
      }}>{showScores ? "Hide scores" : "Show scores"}</button>
    </div>
    <div className="recap-grid replay-grid">
      {REPLAY_SLOTS.map(([slot, label, accent]) => {
        const item = feed?.cards.find(c => c.slot === slot), g = item?.game;
        const date = g ? new Date(g.date).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" }) : "";
        return g ? <a key={slot} className="recap-tile" href={g.href} target="_blank" rel="noopener"
          data-replay-slot={slot} data-wnba-auth-launch={g.league === "basketball/wnba" ? "true" : undefined}
          style={{ borderLeftColor: accent }}>
          <div className="replay-slot"><span>{label}</span><span>{date}</span></div>
          <RecapMatchup away={g.away} home={g.home} renderScore={team => showScores ? <span className="recap-score">{team.score}</span> : null} />
          <div className="recap-meta"><span className="recap-final">{g.service}</span><span className="recap-watch">Full replay ↗</span></div>
          <span className="replay-note">{failed || item?.unavailable ? "Showing the saved replay · refresh temporarily unavailable" : g.note}</span>
        </a> : <div key={slot} className="recap-tile replay-pending" data-replay-slot={slot} style={{ borderLeftColor: accent }}>
          <div className="replay-slot">{label}</div>
          <p>{failed || item?.unavailable ? "Replays temporarily unavailable. Try reloading shortly." : item?.empty ?? (feed ? "Waiting for a completed game" : "Finding the latest replay…")}</p>
        </div>;
      })}
    </div>
  </>;
}
