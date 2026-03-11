import { useState, useEffect } from "react";

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  error?: string;
}

export default function ShipClockTile() {
  const [data, setData] = useState<DeployData | null>(null);

  useEffect(() => {
    fetch("/api/ship-clock")
      .then((r) => r.json())
      .then((d: DeployData) => setData(d))
      .catch(() => null);
  }, []);

  const days = data?.daysSince;
  const isToday = days === 0;
  const label = isToday ? "shipped today 🚀" : days != null ? `${days}d ago` : "⏱️";

  return (
    <a className="proj-tile ship-clock-tile" href="/ship-clock">
      <span className="sct-number">{label}</span>
      <div className="proj-info">
        <div className="proj-name">Ship Clock</div>
        <div className="proj-tag">deploy tracker</div>
      </div>
    </a>
  );
}
