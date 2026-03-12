import { useState, useEffect, useCallback } from "react";
import type { AestheticWeatherResponse } from "../lib/aestheticWeather";

const LS_KEY = "aw-location";

interface SavedLocation {
  lat: number;
  lon: number;
}

function getSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
      return parsed;
    }
  } catch {}
  return null;
}

export default function AestheticWeatherPage() {
  const [data, setData] = useState<AestheticWeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingCustom, setUsingCustom] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const fetchWeather = useCallback(
    async (coords?: SavedLocation) => {
      setLoading(true);
      try {
        let url = "/api/aesthetic-weather";
        if (coords) {
          url += `?lat=${coords.lat}&lon=${coords.lon}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (!json.error) {
          setData(json);
          setUsingCustom(!!coords);
        }
      } catch {}
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    const saved = getSavedLocation();
    fetchWeather(saved ?? undefined);
  }, [fetchWeather]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        localStorage.setItem(LS_KEY, JSON.stringify(coords));
        setLocating(false);
        fetchWeather(coords);
      },
      () => {
        setLocating(false);
        setGeoError("Location unavailable — showing Campbell, CA");
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const handleResetLocation = () => {
    localStorage.removeItem(LS_KEY);
    setUsingCustom(false);
    setGeoError(null);
    fetchWeather();
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="aw-page">
        <div
          className="aw-page-header"
          style={{ background: "linear-gradient(135deg, #f5f5f0, #ebe8e0)" }}
        >
          <div className="aw-page-header-inner">
            <div className="aw-page-loading">reading the sky…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aw-page">
        <div
          className="aw-page-header"
          style={{ background: "linear-gradient(135deg, #eceff1, #cfd8dc)" }}
        >
          <div className="aw-page-header-inner">
            <div className="aw-page-loading">
              Weather unavailable right now. Try again in a bit.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gradientBg = `linear-gradient(135deg, ${data.gradient[0]}, ${data.gradient[1]})`;
  const textClass = data.isDark ? "aw-page--dark" : "";

  return (
    <div className={`aw-page ${textClass}`}>
      <div className="aw-page-header" style={{ background: gradientBg }}>
        <div className="aw-page-header-inner">
          {/* Location bar */}
          <div className="aw-page-loc-bar">
            <span className="aw-page-loc-label">
              📍 {data.location}
            </span>
            <span className="aw-page-loc-actions">
              {!usingCustom && (
                <button
                  className="aw-page-loc-btn"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                >
                  {locating ? "locating…" : "use my location"}
                </button>
              )}
              {usingCustom && (
                <button
                  className="aw-page-loc-btn"
                  onClick={handleResetLocation}
                >
                  back to Campbell
                </button>
              )}
            </span>
          </div>

          {geoError && <div className="aw-page-geo-note">{geoError}</div>}

          {/* Hero */}
          <div className="aw-page-emoji">{data.emoji}</div>
          <h1 className="aw-page-title">{data.title}</h1>
          <p className="aw-page-subtitle">{data.subtitle}</p>
        </div>
      </div>

      {/* Content card */}
      <div className="aw-page-card">
        <div className="aw-page-section">
          <div className="aw-page-section-label">the read</div>
          <p className="aw-page-prose">{data.prose}</p>
        </div>

        <div className="aw-page-section">
          <div className="aw-page-section-label">best use of today</div>
          <p className="aw-page-bestuse">{data.bestUse}</p>
        </div>

        <hr className="aw-page-divider" />

        <div className="aw-page-section">
          <div className="aw-page-section-label">the numbers</div>
          <div className="aw-page-numbers">
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">temp</span>
              <span className="aw-page-num-value">
                {data.temp}°F (feels {data.feelsLike}°F)
              </span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">conditions</span>
              <span className="aw-page-num-value">
                {data.weatherEmoji} {data.weatherDesc}
              </span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">humidity</span>
              <span className="aw-page-num-value">{data.humidity}%</span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">wind</span>
              <span className="aw-page-num-value">{data.windMph} mph</span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">uv index</span>
              <span className="aw-page-num-value">{data.uvIndex}</span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">cloud cover</span>
              <span className="aw-page-num-value">{data.cloudCover}%</span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">sunrise</span>
              <span className="aw-page-num-value">{data.sunrise}</span>
            </div>
            <div className="aw-page-num-row">
              <span className="aw-page-num-label">sunset</span>
              <span className="aw-page-num-value">{data.sunset}</span>
            </div>
          </div>
        </div>

        {data.laterToday && (
          <>
            <hr className="aw-page-divider" />
            <div className="aw-page-section">
              <div className="aw-page-section-label">later today</div>
              <p className="aw-page-later">{data.laterToday}</p>
            </div>
          </>
        )}

        {data.bestWindow && (
          <div className="aw-page-section">
            <div className="aw-page-section-label">best window</div>
            <p className="aw-page-later">{data.bestWindow}</p>
          </div>
        )}
      </div>
    </div>
  );
}
