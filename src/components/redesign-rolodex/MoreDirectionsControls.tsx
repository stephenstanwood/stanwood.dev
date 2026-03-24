import { useState, useEffect } from "react";
import type { MoreModifier } from "../../lib/redesignRolodex/types";

const LOADING_MESSAGES = [
  "exploring new aesthetics...",
  "raiding the font library...",
  "finding fresh directions...",
  "reshuffling reality...",
];

export default function MoreDirectionsControls({
  onMore,
  loading,
}: {
  onMore: (modifier: MoreModifier) => void;
  loading: boolean;
}) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!loading) return;
    setMsgIdx(0);
    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className="rr-more-controls">
      {loading ? (
        <div className="rr-more-loading">
          <div className="rr-more-spinner" />
          <span className="rr-more-loading-text">{LOADING_MESSAGES[msgIdx]}</span>
        </div>
      ) : (
        <>
          <button
            className="rr-more-btn"
            onClick={() => onMore("more")}
            type="button"
          >
            More directions
          </button>
          <button
            className="rr-more-btn rr-more-weirder"
            onClick={() => onMore("weirder")}
            type="button"
          >
            Go weirder
          </button>
          <button
            className="rr-more-btn rr-more-calmer"
            onClick={() => onMore("calmer")}
            type="button"
          >
            Back toward reality
          </button>
        </>
      )}
    </div>
  );
}
