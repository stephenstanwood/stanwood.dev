import type { ReactNode } from "react";
import type { TeamSide } from "../lib/wtwtwSports";

/**
 * The away @ home row shared by LiveSports and YesterdaySports. The two differ
 * only in how a score renders — live games always show one, finals hide it for
 * basketball and colour it by win/loss — so scores come in via `renderScore`.
 */
export default function RecapMatchup<T extends TeamSide>({
  away,
  home,
  renderScore,
}: {
  away: T;
  home: T;
  renderScore: (team: T) => ReactNode;
}) {
  return (
    <div className="recap-matchup">
      <div className="recap-team">
        {away.logo && (
          <img className="recap-logo" src={away.logo} alt="" loading="lazy" />
        )}
        <div className="recap-team-text">
          <span className="recap-team-name">{away.shortName}</span>
          <span className="recap-team-abbr">{away.abbr}</span>
        </div>
        {renderScore(away)}
      </div>
      <div className="recap-vs">@</div>
      <div className="recap-team home">
        {renderScore(home)}
        <div className="recap-team-text">
          <span className="recap-team-name">{home.shortName}</span>
          <span className="recap-team-abbr">{home.abbr}</span>
        </div>
        {home.logo && (
          <img className="recap-logo" src={home.logo} alt="" loading="lazy" />
        )}
      </div>
    </div>
  );
}
