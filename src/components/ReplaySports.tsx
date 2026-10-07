import { useEffect, useState } from "react";
import RecapMatchup from "./RecapMatchup";
import { REPLAY_SLOTS, type ReplayFeed } from "../lib/tvReplays";
import { formatMonthDayInTz, PACIFIC_TZ } from "../lib/dateFormat";
import { safeGet, safeGetString, safeSet, safeSetString } from "../lib/localStorage";

const CACHE_KEY = "tv-replays-v1";
const SCORES_STORAGE_KEY = "tv-replay-scores";

export default function ReplaySports() {
  const [feed, setFeed] = useState<ReplayFeed | null>(null);
  const [showScores, setShowScores] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const previous = safeGet<ReplayFeed>(CACHE_KEY);
    if (previous?.cards) setFeed(previous);
    setShowScores(safeGetString(SCORES_STORAGE_KEY) === "show");
    fetch("/api/tv/replays")
      .then(async (response) => {
        if (!response.ok) throw new Error("Replay feed unavailable");
        const next: ReplayFeed = await response.json();
        if (!Array.isArray(next.cards)) throw new Error("Invalid replay feed");
        next.cards = next.cards.map((card) => {
          if (!card.unavailable || card.game) return card;
          const savedGame = previous?.cards.find((savedCard) => savedCard.slot === card.slot)?.game;
          return { ...card, game: savedGame ?? null };
        });
        if (!active) return;
        setFeed(next);
        safeSet(CACHE_KEY, next);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const best = feed?.cards.find((card) => card.slot === "wnba-best")?.game;
    const launcher = document.getElementById("best-wnba-launcher");
    if (best && launcher instanceof HTMLAnchorElement) {
      launcher.href = best.href;
      launcher.title = `Best other WNBA game: ${best.away.shortName} @ ${best.home.shortName}`;
      launcher.setAttribute("aria-label", launcher.title);
    }
  }, [feed]);

  return (
    <>
      <div className="replay-controls">
        <span>Full game replays</span>
        <button type="button" aria-pressed={showScores} onClick={() => {
          setShowScores(!showScores);
          safeSetString(SCORES_STORAGE_KEY, showScores ? "hide" : "show");
        }}>
          {showScores ? "Hide scores" : "Show scores"}
        </button>
      </div>
      <div className="recap-grid replay-grid">
        {REPLAY_SLOTS.map(([slot, label, accent]) => {
          const item = feed?.cards.find((card) => card.slot === slot);
          const game = item?.game;
          const unavailable = failed || item?.unavailable;

          if (!game) {
            let message = item?.empty;
            if (unavailable) {
              message = "Replays temporarily unavailable. Try reloading shortly.";
            } else if (message == null) {
              message = feed ? "Waiting for a completed game" : "Finding the latest replay…";
            }
            return (
              <div key={slot} className="recap-tile replay-pending" data-replay-slot={slot}
                style={{ borderLeftColor: accent }}>
                <div className="replay-slot">{label}</div>
                <p>{message}</p>
              </div>
            );
          }

          const date = formatMonthDayInTz(game.date, PACIFIC_TZ);
          return (
            <a key={slot} className="recap-tile" href={game.href} target="_blank" rel="noopener"
              data-replay-slot={slot}
              data-wnba-auth-launch={game.league === "basketball/wnba" ? "true" : undefined}
              style={{ borderLeftColor: accent }}>
              <div className="replay-slot"><span>{label}</span><span>{date}</span></div>
              <RecapMatchup away={game.away} home={game.home} renderScore={(team) =>
                showScores ? <span className="recap-score">{team.score}</span> : null
              } />
              <div className="recap-meta">
                <span className="recap-final">{game.service}</span>
                <span className="recap-watch">Full replay ↗</span>
              </div>
              <span className="replay-note">
                {unavailable ? "Showing the saved replay · refresh temporarily unavailable" : game.note}
              </span>
            </a>
          );
        })}
      </div>
    </>
  );
}
