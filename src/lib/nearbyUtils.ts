/**
 * Shared utilities for Nearest Coffee page.
 * Contains geolocation, progress bar, distance/walk helpers,
 * map styling, and carousel setup logic.
 */

// ── Distance & walk helpers ──

export function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

export function estimateWalk(meters: number): string {
  const mins = Math.round(meters / 80); // ~80 m/min walking
  if (mins < 1) return "< 1 min walk";
  return `${mins} min walk`;
}

// ── Map helpers ──

export function computeZoom(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  // Logarithmic scale calibrated so 0.1 km → zoom 19, 1 km → zoom 15, 10 km → zoom 12.
  // Clamped to the range visible on the Nearest Coffee static map (12–17).
  const zoom = Math.round(15.5 - Math.log2(Math.max(km, 0.1)));
  return Math.min(Math.max(zoom, 12), 17);
}

/** Dark map styles for Nearest Coffee map display. */
export const DARK_MAP_STYLES = [
  "feature:all|element:geometry|color:0x1a1c2e",
  "feature:all|element:labels.text.fill|color:0x8a8f9e",
  "feature:all|element:labels.text.stroke|color:0x111318",
  "feature:road|element:geometry|color:0x2a2d40",
  "feature:road|element:geometry.stroke|color:0x1a1c2e",
  "feature:water|element:geometry|color:0x141628",
  "feature:poi|visibility:off",
  "feature:transit|visibility:off",
];

// ── Progress bar ──

export interface ProgressController {
  start: () => void;
  finish: () => void;
}

export interface ProgressLabel {
  at: number;
  text: string;
}

const DEFAULT_LABELS: ProgressLabel[] = [
  { at: 0, text: "Finding your location\u2026" },
  { at: 25, text: "Searching nearby\u2026" },
  { at: 55, text: "Checking what\u2019s open\u2026" },
  { at: 80, text: "Almost there\u2026" },
];

/**
 * Creates a progress bar controller that drives `#progressFill` and
 * `#progressLabel` elements. Call `start()` to begin and `finish()` to
 * jump to 100%.
 */
export function createProgress(
  labels: ProgressLabel[] = DEFAULT_LABELS,
): ProgressController {
  let interval: number | undefined;
  let pct = 0;

  function start() {
    pct = 0;
    clearInterval(interval);

    interval = window.setInterval(() => {
      const fill = document.getElementById("progressFill");
      const label = document.getElementById("progressLabel");
      if (!fill || !label) {
        clearInterval(interval);
        return;
      }

      if (pct < 30) pct += 2 + Math.random() * 8;
      else if (pct < 60) pct += 0.5 + Math.random() * 3;
      else if (pct < 85) pct += 0.2 + Math.random() * 1.5;
      else if (pct < 95) pct += 0.05 + Math.random() * 0.4;

      pct = Math.min(pct, 95);
      fill.style.width = `${pct}%`;

      for (const l of labels) {
        if (pct >= l.at) label.textContent = l.text;
      }
    }, 300);
  }

  function finish() {
    clearInterval(interval);
    const fill = document.getElementById("progressFill");
    if (fill) fill.style.width = "100%";
  }

  return { start, finish };
}

// ── Geolocation ──

export interface GeoCallbacks {
  onLoading: () => void;
  onPosition: (lat: number, lng: number) => void;
  onPermissionDenied: () => void;
  onError: (title: string, message: string) => void;
}

export function requestGeolocation(callbacks: GeoCallbacks): void {
  callbacks.onLoading();

  if (!("geolocation" in navigator)) {
    callbacks.onError("No GPS", "Your browser doesn\u2019t support geolocation.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      callbacks.onPosition(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        callbacks.onPermissionDenied();
      } else {
        callbacks.onError(
          "Location Unavailable",
          "Unable to determine your location. Please ensure GPS is enabled.",
        );
      }
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

/**
 * Auto-init geolocation: if the permissions API is available, check
 * first; otherwise call requestGeolocation immediately.
 */
export function initGeolocation(
  callbacks: GeoCallbacks & { onPermissionScreen: () => void },
): void {
  if ("permissions" in navigator) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "denied") {
        callbacks.onPermissionScreen();
      } else {
        requestGeolocation(callbacks);
      }
    });
  } else {
    requestGeolocation(callbacks);
  }
}

