import { useState, useCallback } from "react";

export default function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [prompt]);

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
