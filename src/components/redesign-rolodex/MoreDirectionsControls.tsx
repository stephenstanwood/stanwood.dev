import type { MoreModifier } from "../../lib/redesignRolodex/types";
import { useCyclingIndex } from "../../hooks/useCyclingIndex";

const LOADING_MESSAGES = [
  "exploring new aesthetics...",
  "raiding the font library...",
  "finding fresh directions...",
  "reshuffling reality...",
];

const MODIFIERS: { modifier: MoreModifier; label: string; className: string }[] = [
  { modifier: "more", label: "More directions", className: "rr-more-btn" },
  { modifier: "weirder", label: "Go weirder", className: "rr-more-btn rr-more-weirder" },
  { modifier: "calmer", label: "Back toward reality", className: "rr-more-btn rr-more-calmer" },
];

export default function MoreDirectionsControls({
  onMore,
  loading,
  disabled = false,
}: {
  onMore: (modifier: MoreModifier) => void;
  loading: boolean;
  disabled?: boolean;
}) {
  const msgIdx = useCyclingIndex(LOADING_MESSAGES.length, 2000, {
    enabled: loading,
    resetKey: loading,
  });

  return (
    <div className="rr-more-controls">
      {loading ? (
        <div className="rr-more-loading">
          <div className="rr-more-spinner" />
          <span className="rr-more-loading-text">{LOADING_MESSAGES[msgIdx]}</span>
        </div>
      ) : (
        MODIFIERS.map((m) => (
          <button
            key={m.modifier}
            className={m.className}
            onClick={() => onMore(m.modifier)}
            disabled={disabled}
            type="button"
          >
            {m.label}
          </button>
        ))
      )}
    </div>
  );
}
