import type { MediaType } from "../../lib/showSwipe/types";

interface Props {
  value: MediaType;
  onChange: (mt: MediaType) => void;
}

export default function MediaToggle({ value, onChange }: Props) {
  return (
    <div className="ss-toggle">
      <button
        className={`ss-toggle-btn ${value === "movie" ? "ss-toggle-active" : ""}`}
        onClick={() => onChange("movie")}
      >
        <span className="ss-toggle-icon">🎬</span> Movies
      </button>
      <button
        className={`ss-toggle-btn ${value === "tv" ? "ss-toggle-active" : ""}`}
        onClick={() => onChange("tv")}
      >
        <span className="ss-toggle-icon">📺</span> Shows
      </button>
    </div>
  );
}
