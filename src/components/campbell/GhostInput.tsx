import { useMemo, type KeyboardEvent } from "react";

interface GhostInputProps {
  value: string;
  onValueChange: (value: string) => void;
  candidates: string[];
  placeholder: string;
  /** Existing input class (e.g. cb-event-search) so the ghost shares its metrics. */
  className: string;
  ariaLabel?: string;
}

/**
 * Text input that ghost-completes the top matching candidate inline.
 * Tab (or ArrowRight with the caret at the end) accepts the completion.
 */
export default function GhostInput({
  value,
  onValueChange,
  candidates,
  placeholder,
  className,
  ariaLabel,
}: GhostInputProps) {
  const suggestion = useMemo(() => {
    const needle = value.toLowerCase();
    if (needle.trim().length < 2) return "";
    return (
      candidates.find(
        (candidate) => candidate.length > value.length && candidate.toLowerCase().startsWith(needle),
      ) ?? ""
    );
  }, [candidates, value]);
  const suffix = suggestion ? suggestion.slice(value.length) : "";

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suffix || event.shiftKey) return;
    const input = event.currentTarget;
    const caretAtEnd = input.selectionStart === value.length && input.selectionEnd === value.length;
    if (event.key === "Tab" || (event.key === "ArrowRight" && caretAtEnd)) {
      event.preventDefault();
      onValueChange(suggestion);
    }
  }

  return (
    <span className="cb-ghost-wrap">
      {suffix && (
        <span className={`${className} cb-ghost-text`} aria-hidden="true">
          <i>{value}</i>
          {suffix}
        </span>
      )}
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
      />
    </span>
  );
}
