import { useState } from "react";
import { formatDistance, estimateWalk } from "../lib/nearbyUtils";

interface CoffeeShop {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  rating: number | null;
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; shop: CoffeeShop }
  | { kind: "error"; message: string };

export default function NearestCoffeeTile() {
  const [state, setState] = useState<State>({ kind: "idle" });

  function handleFind(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!("geolocation" in navigator)) {
      setState({ kind: "error", message: "Location not supported" });
      return;
    }

    setState({ kind: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/nearby-coffee", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
          if (!res.ok) throw new Error("API error");
          const data = await res.json();
          const shops: CoffeeShop[] = data.results || [];
          if (shops.length === 0) {
            setState({ kind: "error", message: "No open coffee nearby" });
            return;
          }
          setState({ kind: "result", shop: shops[0] });
        } catch {
          setState({ kind: "error", message: "Couldn\u2019t search nearby" });
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ kind: "error", message: "Location access denied" });
        } else {
          setState({ kind: "error", message: "Couldn\u2019t get location" });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const mapsUrl =
    state.kind === "result"
      ? `https://www.google.com/maps/dir/?api=1&destination=${state.shop.lat},${state.shop.lng}&travelmode=walking`
      : undefined;

  return (
    <a
      className="feat-card feat-card--editorial"
      href="/nearest-coffee"
      style={{ background: "#FAFAF8" }}
    >
      <div className="feat-body">
        <div className="feat-tag">Utility &middot; Location</div>
        <div className="feat-title">Nearest Coffee</div>

        {state.kind === "idle" && (
          <div className="nct-idle">
            <button
              className="nct-find-btn"
              onClick={handleFind}
              type="button"
            >
              Find Nearest Open
            </button>
          </div>
        )}

        {state.kind === "loading" && (
          <div className="nct-loading">
            <span className="nct-dot" />
            Locating&hellip;
          </div>
        )}

        {state.kind === "result" && (
          <div className="nct-result">
            <div className="nct-status">
              <span className="nct-status-dot" />
              Open Now
            </div>
            <div className="nct-shop">{state.shop.name}</div>
            <div className="nct-meta">
              {formatDistance(state.shop.distance)} &middot;{" "}
              {estimateWalk(state.shop.distance)}
            </div>
            <a
              className="nct-maps"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Open in Maps
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}

        {state.kind === "error" && (
          <div className="nct-error">
            <div className="nct-error-msg">{state.message}</div>
            <button
              className="nct-retry"
              onClick={handleFind}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        <div className="feat-arrow">open &rarr;</div>
      </div>
    </a>
  );
}
