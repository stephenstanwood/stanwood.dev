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
          background: "linear-gradient(160deg, #f5f5f0 50%, #e8e5dd 50%)",
        }}
      >
        <div className="aw-hero">
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
          background: "linear-gradient(160deg, #eceff1 50%, #cfd8dc 50%)",
        }}
      >
        <div className="aw-hero">
          <div className="aw-hero-title">Aesthetic Weather</div>
          <div className="aw-hero-sub">check the vibe →</div>
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
        background: `linear-gradient(160deg, ${data.gradient[0]} 50%, ${data.gradient[1]} 50%)`,
      }}
    >
      {/* Hero section — gradient bg */}
      <div className="aw-hero">
        <div className="aw-hero-label">
          {data.emoji} aesthetic weather
        </div>
        <div className="aw-hero-title">{data.title}</div>
        <div className="aw-hero-sub">{data.subtitle}</div>
      </div>

      {/* Content card — black outline, white bg */}
      <div className="aw-card">
        <div className="aw-card-section">
          <div className="aw-card-label">the read</div>
          <div className="aw-card-prose">{data.prose}</div>
        </div>
        <div className="aw-card-section">
          <div className="aw-card-label">best use of today</div>
          <div className="aw-card-bestuse">{data.bestUse}</div>
        </div>
        <div className="aw-card-footer">
          <span>{data.weatherEmoji} {data.temp}° · {data.weatherDesc.toLowerCase()}</span>
          <span>{data.location}</span>
        </div>
      </div>
    </a>
  );
}
