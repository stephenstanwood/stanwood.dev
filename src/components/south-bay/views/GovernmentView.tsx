import { useState, useEffect, useCallback } from "react";
import DigestCard from "../cards/DigestCard";
import type { DigestData } from "../cards/DigestCard";
import type { City } from "../../../lib/south-bay/types";

interface Props {
  selectedCities: Set<City>;
}

export default function GovernmentView({ selectedCities }: Props) {
  const [configuredCities, setConfiguredCities] = useState<City[]>([]);
  const [digests, setDigests] = useState<Map<string, DigestData>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [initialized, setInitialized] = useState(false);

  // Fetch list of configured cities on mount
  useEffect(() => {
    fetch("/api/south-bay/digest")
      .then((res) => res.json())
      .then((data) => {
        setConfiguredCities(data.cities ?? []);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, []);

  // Fetch digest for a city
  const fetchDigest = useCallback(async (city: City) => {
    setLoading((prev) => new Set(prev).add(city));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(city);
      return next;
    });

    try {
      const res = await fetch(`/api/south-bay/digest?city=${city}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `Failed (${res.status})`);
      }
      const digest: DigestData = await res.json();
      setDigests((prev) => new Map(prev).set(city, digest));
    } catch (e) {
      setErrors((prev) =>
        new Map(prev).set(
          city,
          e instanceof Error ? e.message : "Failed to load",
        ),
      );
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(city);
        return next;
      });
    }
  }, []);

  // Auto-fetch digests for configured + selected cities
  useEffect(() => {
    if (!initialized) return;
    for (const city of configuredCities) {
      if (selectedCities.has(city) && !digests.has(city) && !loading.has(city)) {
        fetchDigest(city);
      }
    }
  }, [initialized, configuredCities, selectedCities, digests, loading, fetchDigest]);

  if (!initialized) {
    return (
      <div className="sb-loading">
        <div className="sb-spinner" />
        <div className="sb-loading-text">Loading...</div>
      </div>
    );
  }

  // Filter to selected cities
  const visibleCities = configuredCities.filter((c) => selectedCities.has(c));
  const unconfiguredSelected = [...selectedCities].filter(
    (c) => !configuredCities.includes(c),
  );

  const loadingCount = [...loading].filter((c) => configuredCities.includes(c as City)).length;
  const totalCities = 11; // South Bay city count

  function cityLabel(city: string) {
    return city
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");
  }

  return (
    <>
      {/* ── Section header ── */}
      <div className="sb-section-header" style={{ marginBottom: 4 }}>
        <span className="sb-section-title">Council Digests</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--sb-accent)",
            background: "#FEF2F2",
            padding: "2px 8px",
            borderRadius: 3,
            letterSpacing: "0.03em",
          }}
        >
          {configuredCities.length} of {totalCities} cities
        </span>
      </div>

      {/* ── Explainer ── */}
      <p
        style={{
          fontSize: 12,
          color: "var(--sb-muted)",
          marginTop: 0,
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        AI-generated plain-English summaries of city council meeting agendas —
        what was discussed, what was decided, and why it matters.
        Select a city above to see its digest.
      </p>

      {/* ── Loading indicator when multiple cities are fetching ── */}
      {loadingCount > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--sb-primary-light)",
            border: "1px solid var(--sb-border-light)",
            borderRadius: "var(--sb-radius)",
            marginBottom: 16,
            fontSize: 13,
            color: "var(--sb-muted)",
          }}
        >
          <div className="sb-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
          Generating {loadingCount} digests — this takes a moment…
        </div>
      )}

      {visibleCities.length === 0 && unconfiguredSelected.length === 0 && (
        <div className="sb-empty">
          <div className="sb-empty-title">No cities selected</div>
          <div className="sb-empty-sub">
            Select cities above to see council meeting digests
          </div>
        </div>
      )}

      {/* Configured cities with digests */}
      {visibleCities.map((city) => {
        const digest = digests.get(city);
        const isLoading = loading.has(city);
        const error = errors.get(city);

        if (isLoading && loadingCount <= 1) {
          return (
            <div key={city} className="sb-digest-loading">
              <div className="sb-spinner" />
              <div className="sb-loading-text">
                Generating {cityLabel(city)} digest…
              </div>
            </div>
          );
        }

        if (isLoading) {
          // When multiple are loading, show minimal placeholder
          return (
            <div
              key={city}
              style={{
                padding: "14px 16px",
                border: "1px solid var(--sb-border-light)",
                borderRadius: "var(--sb-radius)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--sb-muted)",
                fontSize: 13,
              }}
            >
              <div className="sb-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              {cityLabel(city)}
            </div>
          );
        }

        if (error) {
          return (
            <div key={city} className="sb-digest-error">
              <span>
                <strong>{cityLabel(city)}:</strong> {error}
              </span>
              <button onClick={() => fetchDigest(city)}>Retry</button>
            </div>
          );
        }

        if (digest) {
          return <DigestCard key={city} digest={digest} />;
        }

        return null;
      })}

      {/* Unconfigured cities */}
      {unconfiguredSelected.length > 0 && (
        <div className="sb-gov-upcoming">
          <p>
            Digests not yet available for:{" "}
            {unconfiguredSelected.map(cityLabel).join(", ")}.
            {" "}Currently covering:{" "}
            {configuredCities.length > 0
              ? configuredCities.map(cityLabel).join(", ")
              : "—"}
          </p>
        </div>
      )}
    </>
  );
}
