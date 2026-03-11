import { useState, useEffect } from "react";

interface DeployData {
  lastDeploy: string | null;
  daysSince: number | null;
  hoursSince: number | null;
  error?: string;
}

export default function ShipClock() {
  const [data, setData] = useState<DeployData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ship-clock")
      .then((r) => r.json())
      .then((d: DeployData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData({ lastDeploy: null, daysSince: null, hoursSince: null, error: "fetch failed" });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="sc-card">
        <div className="sc-number">...</div>
        <div className="sc-label">loading mission data</div>
      </div>
    );
  }

  if (!data || data.error === "api error" || data.error === "fetch failed" || data.error === "missing config") {
    return (
      <div className="sc-card">
        <div className="sc-error">couldn't reach mission control</div>
        <div className="sc-label">try again later</div>
      </div>
    );
  }

  if (data.error === "no deploys" || data.lastDeploy === null) {
    return (
      <div className="sc-card">
        <div className="sc-number">—</div>
        <div className="sc-label">no deploys yet</div>
      </div>
    );
  }

  const deployDate = new Date(data.lastDeploy);
  const formattedDate = deployDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = deployDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const days = data.daysSince!;
  const isToday = days === 0;

  return (
    <div className="sc-card">
      {isToday ? (
        <>
          <div className="sc-number sc-today">shipped today 🚀</div>
          <div className="sc-label">days since last deploy</div>
        </>
      ) : (
        <>
          <div className="sc-number">{days}</div>
          <div className="sc-label">
            {days === 1 ? "day" : "days"} since last deploy
          </div>
        </>
      )}
      <div className="sc-meta">
        last deploy: {formattedDate} at {formattedTime}
      </div>
    </div>
  );
}
