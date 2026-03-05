import type { MediaType, Era } from "../../lib/showSwipe/types";

interface Props {
  mediaType: MediaType;
  era: Era;
  onMediaChange: (mt: MediaType) => void;
  onEraChange: (era: Era) => void;
}

export default function MediaToggle({
  mediaType,
  era,
  onMediaChange,
  onEraChange,
}: Props) {
  return (
    <div className="ss-toggles">
      <div className="ss-toggle">
        <button
          className={`ss-toggle-btn ${mediaType === "tv" ? "ss-toggle-active" : ""}`}
          onClick={() => onMediaChange("tv")}
        >
          <span className="ss-toggle-icon">📺</span> Shows
        </button>
        <button
          className={`ss-toggle-btn ${mediaType === "movie" ? "ss-toggle-active" : ""}`}
          onClick={() => onMediaChange("movie")}
        >
          <span className="ss-toggle-icon">🎬</span> Movies
        </button>
      </div>
      <div className="ss-toggle ss-toggle-sm">
        <button
          className={`ss-toggle-btn ${era === "recent" ? "ss-toggle-active" : ""}`}
          onClick={() => onEraChange("recent")}
        >
          Recent
        </button>
        <button
          className={`ss-toggle-btn ${era === "all" ? "ss-toggle-active" : ""}`}
          onClick={() => onEraChange("all")}
        >
          All Time
        </button>
      </div>
    </div>
  );
}
