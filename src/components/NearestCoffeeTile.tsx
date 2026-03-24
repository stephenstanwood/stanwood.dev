import { formatDistance, estimateWalk } from "../lib/nearbyUtils";
import { useNearbySearch } from "../lib/useNearbySearch";

interface CoffeeShop {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  rating: number | null;
}

export default function NearestCoffeeTile() {
  const { state, search } = useNearbySearch<{ results: CoffeeShop[] }>("/api/nearby-coffee");

  const shop = state.kind === "result" ? state.data.results[0] ?? null : null;

  const openInMaps = () => {
    if (!shop) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}&travelmode=walking`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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
              onClick={search}
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

        {state.kind === "result" && shop && (
          <div className="nct-result">
            <div className="nct-status">
              <span className="nct-status-dot" />
              Open Now
            </div>
            <div className="nct-shop">{shop.name}</div>
            <div className="nct-meta">
              {formatDistance(shop.distance)} &middot;{" "}
              {estimateWalk(shop.distance)}
            </div>
            {/* button instead of <a> to avoid nested anchor (tile is already <a>) */}
            <button
              className="nct-maps"
              onClick={(e) => { e.stopPropagation(); openInMaps(); }}
              type="button"
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
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div className="nct-error">
            <div className="nct-error-msg">{state.message}</div>
            <button
              className="nct-retry"
              onClick={search}
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
