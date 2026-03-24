import type { MoreModifier } from "../../lib/redesignRolodex/types";

export default function MoreDirectionsControls({
  onMore,
  loading,
}: {
  onMore: (modifier: MoreModifier) => void;
  loading: boolean;
}) {
  return (
    <div className="rr-more-controls">
      <button
        className="rr-more-btn"
        onClick={() => onMore("more")}
        disabled={loading}
        type="button"
      >
        {loading ? "Generating..." : "More directions"}
      </button>
      <button
        className="rr-more-btn rr-more-weirder"
        onClick={() => onMore("weirder")}
        disabled={loading}
        type="button"
      >
        Go weirder
      </button>
      <button
        className="rr-more-btn rr-more-calmer"
        onClick={() => onMore("calmer")}
        disabled={loading}
        type="button"
      >
        Back toward reality
      </button>
    </div>
  );
}
