import { useState, useCallback, useRef } from "react";
import { US_STATE_PATHS } from "../../data/usStatePaths";
import {
  stateData,
  LEGISLATION_COLORS,
  LEGISLATION_LABELS,
  type LegislationStatus,
} from "../../data/driverless/data";

const stateMap = new Map(stateData.map((s) => [s.code, s]));

// Exclude AK and HI from the SVG — they render as text labels below
const EXCLUDED_STATES = new Set(["AK", "HI"]);

const legendItems: { status: LegislationStatus; color: string; label: string }[] = [
  { status: "active", color: LEGISLATION_COLORS.active, label: LEGISLATION_LABELS.active },
  { status: "permitted", color: LEGISLATION_COLORS.permitted, label: LEGISLATION_LABELS.permitted },
  { status: "testing", color: LEGISLATION_COLORS.testing, label: LEGISLATION_LABELS.testing },
  { status: "none", color: LEGISLATION_COLORS.none, label: LEGISLATION_LABELS.none },
];

const extraStates = [
  { code: "AK", name: "Alaska" },
  { code: "HI", name: "Hawaii" },
];

export default function USMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    status: string;
    avCount?: number;
  } | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGPathElement>, code: string) => {
      const state = stateMap.get(code);
      if (!state || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        name: state.name,
        status: LEGISLATION_LABELS[state.legislation],
        avCount: state.avCount,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="dl-panel dl-full">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Where It's Legal</h2>
        <span className="dl-panel-subtitle">Self-driving car laws by state</span>
      </div>
      <div className="dl-map-wrap" ref={wrapRef}>
        <svg viewBox="280 0 950 610" className="dl-map-svg" aria-label="US self-driving car legislation map">
          {Object.entries(US_STATE_PATHS).map(([code, { name, path }]) => {
            if (EXCLUDED_STATES.has(code)) return null;
            const state = stateMap.get(code);
            const fill = state
              ? LEGISLATION_COLORS[state.legislation]
              : LEGISLATION_COLORS.none;
            return (
              <path
                key={code}
                d={path}
                fill={fill}
                onMouseEnter={(e) => handleMouseMove(e, code)}
                onMouseMove={(e) => handleMouseMove(e, code)}
                onMouseLeave={handleMouseLeave}
                aria-label={name}
              />
            );
          })}
        </svg>
        {tooltip && (
          <div
            className="dl-map-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <strong>{tooltip.name}</strong>
            <br />
            {tooltip.status}
            {tooltip.avCount != null && (
              <>
                <br />
                {tooltip.avCount.toLocaleString()} self-driving cars
              </>
            )}
          </div>
        )}
      </div>
      <div className="dl-extra-states">
        {extraStates.map(({ code, name }) => {
          const state = stateMap.get(code);
          const status = state ? state.legislation : "none";
          return (
            <span key={code} className="dl-extra-state">
              <span className="dl-legend-dot" style={{ background: LEGISLATION_COLORS[status] }} />
              {name}: {LEGISLATION_LABELS[status]}
            </span>
          );
        })}
      </div>
      <div className="dl-legend">
        {legendItems.map((item) => (
          <div key={item.status} className="dl-legend-item">
            <span className="dl-legend-dot" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
