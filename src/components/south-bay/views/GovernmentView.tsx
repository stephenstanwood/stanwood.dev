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

  return (
    <>
      <div className="sb-section-header">
        <span className="sb-section-title">Council Digests</span>
      </div>

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

        if (isLoading) {
          return (
            <div key={city} className="sb-digest-loading">
              <div className="sb-spinner" />
              <div className="sb-loading-text">
                Generating digest...
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div key={city} className="sb-digest-error">
              <span>{error}</span>
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
            More cities coming soon. Currently covering:{" "}
            {configuredCities.length > 0
              ? configuredCities
                  .map(
                    (c) =>
                      c
                        .split("-")
                        .map((w) => w[0].toUpperCase() + w.slice(1))
                        .join(" "),
                  )
                  .join(", ")
              : "Campbell"}
          </p>
        </div>
      )}
    </>
  );
}
