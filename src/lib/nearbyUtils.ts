/**
 * Shared utilities for Nearest Coffee and Nearest Fun pages.
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
  const zoom = Math.round(15.5 - Math.log2(Math.max(km, 0.1)));
  return Math.min(Math.max(zoom, 12), 17);
}

/** Dark map styles shared by both Nearest Coffee and Nearest Fun. */
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

// ── Carousel setup ──

export interface CarouselConfig<T> {
  /** The container element to render into. */
  container: HTMLElement;
  /** The full array of items (shops, places, etc.). */
  items: T[];
  /** Builds the HTML for a single card. */
  buildCard: (
    item: T,
    rank: number,
    direction: "none" | "left" | "right",
  ) => string;
  /** Optional: preload resources for an adjacent item. */
  preload?: (item: T) => void;
}

/**
 * Initializes a carousel inside `container`.
 * Renders the first card immediately and sets up arrows, dots,
 * keyboard, and touch-swipe navigation when there are multiple items.
 */
export function setupCarousel<T>(config: CarouselConfig<T>): void {
  const { container, items, buildCard, preload } = config;
  let currentIdx = 0;

  const navHtml =
    items.length > 1
      ? `
    <div class="carousel-nav">
      <button class="carousel-arrow" id="carousel-prev" aria-label="Previous result" disabled>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <div class="carousel-center">
        <div class="carousel-dots" id="carousel-dots"></div>
        <span class="carousel-counter" id="carousel-counter"></span>
      </div>
      <button class="carousel-arrow" id="carousel-next" aria-label="Next result">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>
    </div>
  `
      : "";

  container.innerHTML = `
    <div id="card-viewport">${buildCard(items[0], 1, "none")}</div>
    ${navHtml}
  `;

  if (items.length <= 1) return;

  // Preload adjacent
  if (preload && items[1]) preload(items[1]);

  const viewport = document.getElementById("card-viewport")!;
  const dotsEl = document.getElementById("carousel-dots")!;
  const counterEl = document.getElementById("carousel-counter")!;
  const prevBtn = document.getElementById("carousel-prev")! as HTMLButtonElement;
  const nextBtn = document.getElementById("carousel-next")! as HTMLButtonElement;

  function showCard(idx: number, direction: "left" | "right") {
    viewport.innerHTML = buildCard(items[idx], idx + 1, direction);

    dotsEl.innerHTML = items
      .map(
        (_, i) =>
          `<div class="carousel-dot ${i === idx ? "active" : ""}" data-idx="${i}"></div>`,
      )
      .join("");

    counterEl.textContent = `${idx + 1} of ${items.length}`;

    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === items.length - 1;

    if (preload) {
      if (items[idx - 1]) preload(items[idx - 1]);
      if (items[idx + 1]) preload(items[idx + 1]);
    }
  }

  // Initial dots + counter
  dotsEl.innerHTML = items
    .map(
      (_, i) =>
        `<div class="carousel-dot ${i === 0 ? "active" : ""}" data-idx="${i}"></div>`,
    )
    .join("");
  counterEl.textContent = `1 of ${items.length}`;

  prevBtn.addEventListener("click", () => {
    if (currentIdx > 0) {
      currentIdx--;
      showCard(currentIdx, "left");
    }
  });
  nextBtn.addEventListener("click", () => {
    if (currentIdx < items.length - 1) {
      currentIdx++;
      showCard(currentIdx, "right");
    }
  });

  // Click dots to jump
  dotsEl.addEventListener("click", (e) => {
    const dot = (e.target as HTMLElement).closest("[data-idx]");
    if (!dot) return;
    const newIdx = parseInt(dot.getAttribute("data-idx")!, 10);
    if (newIdx === currentIdx) return;
    const dir = newIdx > currentIdx ? "right" : "left";
    currentIdx = newIdx;
    showCard(currentIdx, dir);
  });

  // Keyboard navigation
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && currentIdx > 0) {
      currentIdx--;
      showCard(currentIdx, "left");
    } else if (e.key === "ArrowRight" && currentIdx < items.length - 1) {
      currentIdx++;
      showCard(currentIdx, "right");
    }
  };
  document.addEventListener("keydown", keyHandler);

  // Touch swipe
  let touchStartX = 0;
  viewport.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true },
  );
  viewport.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && currentIdx < items.length - 1) {
        currentIdx++;
        showCard(currentIdx, "right");
      } else if (dx > 0 && currentIdx > 0) {
        currentIdx--;
        showCard(currentIdx, "left");
      }
    },
    { passive: true },
  );
}
