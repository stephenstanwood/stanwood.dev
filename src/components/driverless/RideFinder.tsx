import { useState } from "react";
import { cityRideData } from "../../data/driverless/data";
import type { RideAvailability } from "../../data/driverless/data";

const AVAILABILITY_CONFIG: Record<RideAvailability, { label: string; color: string; bg: string }> = {
  available: { label: "Book Now", color: "#16a34a", bg: "#f0fdf4" },
  "invite-only": { label: "Invite Only", color: "#d97706", bg: "#fffbeb" },
  "coming-soon": { label: "Coming Soon", color: "#3b82f6", bg: "#eff6ff" },
};

export default function RideFinder() {
  const [selectedCity, setSelectedCity] = useState<string>("");

  const cityInfo = cityRideData.find((c) => c.city === selectedCity);

  return (
    <div className="dl-panel dl-full dl-ride-finder">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Can I ride one today?</h2>
        <span className="dl-panel-subtitle">Pick your city to find out</span>
      </div>

      <div className="dl-city-select-wrap">
        <select
          className="dl-city-select"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">— Select a city —</option>
          {cityRideData.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}, {c.state}
            </option>
          ))}
        </select>
      </div>

      {!selectedCity && (
        <div className="dl-ride-empty">
          <p>Self-driving taxis currently operate in 7 US cities, with 3 more launching in 2026.</p>
        </div>
      )}

      {cityInfo && (
        <div className="dl-ride-results">
          {cityInfo.options.map((opt) => {
            const config = AVAILABILITY_CONFIG[opt.availability];
            return (
              <div key={opt.service} className="dl-ride-card">
                <div className="dl-ride-card-top">
                  <span className="dl-ride-service">{opt.service}</span>
                  <span
                    className="dl-ride-badge"
                    style={{ color: config.color, background: config.bg }}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="dl-ride-how">{opt.howToBook}</div>
                {opt.note && <div className="dl-ride-note">{opt.note}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
