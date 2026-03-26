import { useState, useEffect } from "react";
import type { RecentArrest } from "../../lib/sonoma/types";

export default function ArrestBlotter() {
  const [arrests, setArrests] = useState<RecentArrest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sonoma/arrests?limit=50")
      .then((r) => (r.ok ? r.json() : Promise.reject(`API returned ${r.status}`)))
      .then((d) => setArrests(d.arrests ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Compute quick stats from live data
  const felonyCount = arrests.filter((a) => a.degree.toLowerCase().includes("felony")).length;
  const misdCount = arrests.length - felonyCount;
  const cities = [...new Set(arrests.map((a) => a.city))];
  const topCity = cities
    .map((c) => ({ city: c, count: arrests.filter((a) => a.city === c).length }))
    .sort((a, b) => b.count - a.count)[0];

  function formatCharge(raw: string): string {
    return raw
      .replace(/<br\s*\/?>/gi, " | ")
      .replace(/\s*----------\s*/g, "")
      .replace(/\|\s*\|/g, "|")
      .replace(/^\s*\|\s*/, "")
      .trim();
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="da-panel da-blotter">
        <div className="da-panel-header">
          <h3 className="da-panel-title">Live Arrest Blotter</h3>
        </div>
        <div className="da-loading">Loading from Sonoma County Open Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="da-panel da-blotter">
        <div className="da-panel-header">
          <h3 className="da-panel-title">Live Arrest Blotter</h3>
        </div>
        <div className="da-empty">Failed to load: {error}</div>
      </div>
    );
  }

  return (
    <div className="da-panel da-blotter">
      <div className="da-panel-header">
        <h3 className="da-panel-title">Live Arrest Blotter</h3>
        <span className="da-live-badge">
          <span className="da-live-dot" /> Live from Sonoma County
        </span>
      </div>

      {arrests.length > 0 && (
        <div className="da-stat-row">
          <div className="da-stat-card">
            <div className="da-stat-label">Total</div>
            <div className="da-stat-value">{arrests.length}</div>
          </div>
          <div className="da-stat-card">
            <div className="da-stat-label">Felony</div>
            <div className="da-stat-value da-felony-val">{felonyCount}</div>
          </div>
          <div className="da-stat-card">
            <div className="da-stat-label">Misdemeanor</div>
            <div className="da-stat-value">{misdCount}</div>
          </div>
          {topCity && (
            <div className="da-stat-card">
              <div className="da-stat-label">Top City</div>
              <div className="da-stat-value da-city-val">{topCity.city}</div>
            </div>
          )}
        </div>
      )}

      {arrests.length === 0 ? (
        <div className="da-empty">No recent arrests in the feed</div>
      ) : (
        <div className="da-arrest-list">
          {arrests.map((a, i) => (
            <div key={i} className="da-arrest-row">
              <div className="da-arrest-meta">
                <span className="da-arrest-date">{formatDate(a.date)}</span>
                <span className="da-arrest-time">{formatTime(a.date)}</span>
                <span className={`da-degree ${a.degree.toLowerCase().includes("felony") ? "felony" : "misd"}`}>
                  {a.degree}
                </span>
              </div>
              <div className="da-arrest-charge">{formatCharge(a.charge)}</div>
              <div className="da-arrest-detail">
                {a.city}{a.age ? ` · ${a.gender}, ${a.age}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="da-note">
        Source: Sonoma County Sheriff's Office via{" "}
        <a href="https://data.sonomacounty.ca.gov/Public-Safety/Sonoma-County-Sheriff-s-Office-Arrest-Data/f6uf-eqmk" target="_blank" rel="noopener noreferrer">
          Sonoma County Open Data
        </a>. Shows currently available records (rolling feed, not historical archive).
      </p>
    </div>
  );
}
