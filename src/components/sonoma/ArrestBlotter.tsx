import { useState, useEffect, useMemo } from "react";
import type { RecentArrest } from "../../lib/sonoma/types";

export default function ArrestBlotter() {
  const [arrests, setArrests] = useState<RecentArrest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<"all" | "felony" | "misd">("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    fetch("/api/sonoma/arrests?limit=50")
      .then((r) => (r.ok ? r.json() : Promise.reject(`API returned ${r.status}`)))
      .then((d) => setArrests(d.arrests ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => {
    const all = [...new Set(arrests.map((a) => a.city).filter(Boolean))].sort();
    return all;
  }, [arrests]);

  const filtered = useMemo(() => {
    return arrests.filter((a) => {
      if (degreeFilter === "felony" && !a.degree.toLowerCase().includes("felony")) return false;
      if (degreeFilter === "misd" && a.degree.toLowerCase().includes("felony")) return false;
      if (cityFilter !== "all" && a.city !== cityFilter) return false;
      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        if (!a.charge.toLowerCase().includes(kw) && !a.city.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [arrests, degreeFilter, cityFilter, keyword]);

  // Stats computed from full dataset (not filtered)
  const felonyCount = arrests.filter((a) => a.degree.toLowerCase().includes("felony")).length;
  const misdCount = arrests.length - felonyCount;
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

  const hasActiveFilter = degreeFilter !== "all" || cityFilter !== "all" || keyword.trim() !== "";

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

      {/* Filter controls */}
      <div className="da-filters">
        <div className="da-toggle-group">
          <button className={`da-toggle ${degreeFilter === "all" ? "active" : ""}`} onClick={() => setDegreeFilter("all")}>All</button>
          <button className={`da-toggle ${degreeFilter === "felony" ? "active" : ""}`} onClick={() => setDegreeFilter("felony")}>Felony</button>
          <button className={`da-toggle ${degreeFilter === "misd" ? "active" : ""}`} onClick={() => setDegreeFilter("misd")}>Misd</button>
        </div>
        <select
          className="da-select"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <input
          className="da-search"
          type="text"
          placeholder="Search charge…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* Result count when filtering */}
      {hasActiveFilter && (
        <div className="da-filter-result">
          {filtered.length === 0
            ? "No matching arrests"
            : `${filtered.length} of ${arrests.length} arrests`}
          {" · "}
          <button className="da-clear-filters" onClick={() => { setDegreeFilter("all"); setCityFilter("all"); setKeyword(""); }}>
            clear filters
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="da-empty">No arrests match the current filters</div>
      ) : (
        <div className="da-arrest-list">
          {filtered.map((a, i) => (
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
                {a.city ? a.city.charAt(0).toUpperCase() + a.city.slice(1).toLowerCase() : ""}
                {a.age ? ` · ${a.gender}, ${a.age}` : ""}
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
