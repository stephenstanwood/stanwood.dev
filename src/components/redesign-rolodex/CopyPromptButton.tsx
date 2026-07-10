import { useCallback } from "react";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";

export default function CopyPromptButton({ prompt }: { prompt: string }) {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = useCallback(() => copy(prompt), [copy, prompt]);

  return (
    <button
      className={`rr-copy-btn ${copied ? "rr-copy-copied" : ""}`}
      onClick={handleCopy}
      type="button"
    >
      {copied ? "Copied!" : "Copy Prompt"}
    </button>
  );
}
