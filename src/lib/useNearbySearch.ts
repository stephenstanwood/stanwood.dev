import { useState } from "react";

type NearbyState<T> =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; data: T }
  | { kind: "error"; message: string };

/**
 * Handles geolocation + a POST to a nearby-search API endpoint.
 * Callers provide the API path and optionally extra body fields (e.g. { mode: "outside" }).
 * T is the shape of the full JSON response body.
 */
export function useNearbySearch<T>(apiPath: string, extraBody?: Record<string, unknown>) {
  const [state, setState] = useState<NearbyState<T>>({ kind: "idle" });

  function search(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!("geolocation" in navigator)) {
      setState({ kind: "error", message: "Location not supported" });
      return;
    }

    setState({ kind: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(apiPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              ...extraBody,
            }),
          });
          if (!res.ok) throw new Error("API error");
          const data: T = await res.json();
          setState({ kind: "result", data });
        } catch {
          setState({ kind: "error", message: "Couldn\u2019t search nearby" });
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ kind: "error", message: "Location access denied" });
        } else {
          setState({ kind: "error", message: "Couldn\u2019t get location" });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return { state, search };
}
