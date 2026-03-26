import { stateData } from "../../data/driverless/data";

const keyStates = stateData.filter((s) => s.avCount != null && s.avCount > 0);

function formatVehicles(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function avPercent(av: number, total: number): string {
  const pct = (av / total) * 100;
  if (pct < 0.0001) return "<0.0001%";
  return pct.toFixed(4) + "%";
}

export default function StateBreakdown() {
  return (
    <div className="dl-panel dl-full">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">State Breakdown</h2>
        <span className="dl-panel-subtitle">States where self-driving cars are on the road today</span>
      </div>
      <div className="dl-state-grid">
        {keyStates.map((s) => (
          <div key={s.code} className="dl-state-card">
            <div className="dl-state-name">{s.name}</div>
            <div className="dl-state-stat">{s.avCount!.toLocaleString()}</div>
            <div className="dl-state-label">Self-Driving Cars</div>
            <div className="dl-state-sub">
              out of {formatVehicles(s.registeredVehicles)} total cars
            </div>
            {s.testMiles && (
              <div className="dl-state-sub">{formatVehicles(s.testMiles)} test miles/yr</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
