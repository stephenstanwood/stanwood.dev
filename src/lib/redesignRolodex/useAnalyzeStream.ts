import { useCallback, useRef, useState } from "react";
import type {
  WeirdnessMode,
  SiteAnalysis,
  DesignDirection,
} from "./types";

export type StreamPhase = "idle" | "screenshot" | "analyzing" | "directions" | "done" | "error";

interface StreamState {
  phase: StreamPhase;
  analysis: SiteAnalysis | null;
  screenshotBase64: string;
  directions: DesignDirection[];
  error: string;
}

export function useAnalyzeStream() {
  const [state, setState] = useState<StreamState>({
    phase: "idle",
    analysis: null,
    screenshotBase64: "",
    directions: [],
    error: "",
  });
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (url: string, mode: WeirdnessMode) => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({
      phase: "screenshot",
      analysis: null,
      screenshotBase64: "",
      directions: [],
      error: "",
    });

    try {
      const res = await fetch("/api/redesign-rolodex/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), mode }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState((s) => ({
          ...s,
          phase: "error",
          error: (data as { error?: string }).error || "Something went wrong.",
        }));
        return;
      }

      if (!res.body) {
        setState((s) => ({ ...s, phase: "error", error: "No response body" }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              handleEvent(eventType, data, setState);
            } catch {
              // Malformed JSON, skip
            }
            eventType = "";
          }
        }
      }

      // Check if we ended without a done event
      setState((s) => {
        if (s.phase !== "error" && s.phase !== "done") {
          const complete = s.directions.length > 0;
          return { ...s, phase: complete ? "done" : "error", error: complete ? "" : "Generation incomplete" };
        }
        return s;
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState((s) => ({
        ...s,
        phase: "error",
        error: "Network error. Check your connection and try again.",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      phase: "idle",
      analysis: null,
      screenshotBase64: "",
      directions: [],
      error: "",
    });
  }, []);

  return { ...state, analyze, reset };
}

function handleEvent(
  type: string,
  data: Record<string, unknown>,
  setState: React.Dispatch<React.SetStateAction<StreamState>>,
) {
  switch (type) {
    case "screenshot":
      setState((s) => ({
        ...s,
        phase: "analyzing",
        screenshotBase64: (data.screenshotBase64 as string) || "",
      }));
      break;
    case "analysis":
      setState((s) => ({
        ...s,
        phase: "directions",
        analysis: data as unknown as SiteAnalysis,
      }));
      break;
    case "direction":
      setState((s) => ({
        ...s,
        phase: "directions",
        directions: [...s.directions, data as unknown as DesignDirection],
      }));
      break;
    case "done":
      setState((s) => ({ ...s, phase: "done" }));
      break;
    case "error":
      setState((s) => ({
        ...s,
        phase: "error",
        error: (data.error as string) || "Something went wrong.",
      }));
      break;
  }
}
