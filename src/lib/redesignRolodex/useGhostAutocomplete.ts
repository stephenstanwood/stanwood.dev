import { useEffect, useState } from "react";
import { ghostMatch } from "./topSites";

/** Below this many characters the suggestion is too speculative to show or accept. */
const MIN_CHARS_TO_SHOW = 2;

export interface GhostAutocomplete {
  /** Whether the suggestion is confident enough to render behind the input. */
  showGhost: boolean;
  /** The un-typed tail of the suggestion, to render greyed out after the typed text. */
  ghostSuffix: string;
  /** Tab-to-accept handler for the URL input. */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** The URL to submit — the suggestion when one is showing, otherwise what was typed. */
  resolvedUrl: string;
  clearGhost: () => void;
}

/**
 * Inline "ghost" completion for the URL input, shared by the full Redesign Rolodex page
 * and its homepage tile. Tab accepts the suggestion; submitting accepts it implicitly.
 */
export function useGhostAutocomplete(
  url: string,
  setUrl: (next: string) => void,
): GhostAutocomplete {
  const [ghost, setGhost] = useState<string | null>(null);

  useEffect(() => {
    setGhost(ghostMatch(url));
  }, [url]);

  const showGhost = !!ghost && url.length >= MIN_CHARS_TO_SHOW;

  return {
    showGhost,
    ghostSuffix: showGhost ? ghost.slice(url.length) : "",
    resolvedUrl: showGhost ? ghost : url,
    clearGhost: () => setGhost(null),
    handleKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !ghost) return;
      e.preventDefault();
      setUrl(ghost);
      setGhost(null);
    },
  };
}
