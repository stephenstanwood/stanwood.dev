import type { MediaType, Era } from "../../lib/showSwipe/types";

interface Props {
  mediaType: MediaType;
  era: Era;
  onMediaChange: (mt: MediaType) => void;
  onEraChange: (era: Era) => void;
}

const MEDIA_OPTIONS: { value: MediaType; label: string; icon: string }[] = [
  { value: "tv", label: "Shows", icon: "📺" },
  { value: "movie", label: "Movies", icon: "🎬" },
];

const ERA_OPTIONS: { value: Era; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "all", label: "All Time" },
];

/** A row of mutually exclusive pill buttons; the one matching `value` is active. */
function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className = "ss-toggle",
}: {
  options: { value: T; label: string; icon?: string }[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`ss-toggle-btn ${value === option.value ? "ss-toggle-active" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <span className="ss-toggle-icon">{option.icon}</span>}
          {/* Leading space only when an icon precedes the label. */}
          {option.icon ? ` ${option.label}` : option.label}
        </button>
      ))}
    </div>
  );
}

export default function MediaToggle({
  mediaType,
  era,
  onMediaChange,
  onEraChange,
}: Props) {
  return (
    <div className="ss-toggles">
      <ToggleGroup
        options={MEDIA_OPTIONS}
        value={mediaType}
        onChange={onMediaChange}
      />
      <ToggleGroup
        options={ERA_OPTIONS}
        value={era}
        onChange={onEraChange}
        className="ss-toggle ss-toggle-sm"
      />
    </div>
  );
}
