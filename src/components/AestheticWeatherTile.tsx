import { useState, useEffect } from "react";
import type { AestheticWeatherResponse } from "../lib/aestheticWeather";

export default function AestheticWeatherTile() {
  const [data, setData] = useState<AestheticWeatherResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/aesthetic-weather")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(true);
        } else {
          setData(d);
        }
      })
      .catch(() => setError(true));
  }, []);

  // Loading state
  if (!data && !error) {
    return (
      <a
        className="proj-tile aw-tile"
        href="/south-bay-aesthetic-weather"
        style={{
          background: "linear-gradient(135deg, #f5f5f0, #ebe8e0)",
        }}
      >
        <div className="aw-inner">
          <div className="aw-loading">reading the sky…</div>
        </div>
      </a>
    );
  }

  // Error — still link to the page
  if (error || !data) {
    return (
      <a
        className="proj-tile aw-tile"
        href="/south-bay-aesthetic-weather"
        style={{
          background: "linear-gradient(135deg, #eceff1, #cfd8dc)",
        }}
      >
        <div className="aw-inner">
          <div className="aw-title">Aesthetic Weather</div>
          <div className="aw-subtitle">check the vibe →</div>
        </div>
      </a>
    );
  }

  return (
    <a
      className="proj-tile aw-tile"
      href="/south-bay-aesthetic-weather"
      data-dark={data.isDark || undefined}
      style={{
        background: `linear-gradient(135deg, ${data.gradient[0]}, ${data.gradient[1]})`,
      }}
    >
      <div className="aw-inner">
        <div className="aw-label">
          <span className="aw-emoji">{data.emoji}</span> aesthetic weather
        </div>
        <div className="aw-title">{data.title}</div>
        <div className="aw-subtitle">{data.subtitle}</div>
        <div className="aw-meta">
          {data.temp}° · {data.location}
        </div>
      </div>
    </a>
  );
}
