import { useState, useEffect, useCallback, useRef } from "react";

interface ProviderStatus {
  id: "chatgpt" | "claude";
  name: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage" | "unknown";
  summary: string;
  incidentTitle?: string;
  incidentSummary?: string;
  statusPageUrl: string;
  checkedAt: string;
  brandColor: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  operational: { label: "All good", color: "#22c55e", icon: "●" },
  degraded: { label: "A little off", color: "#f59e0b", icon: "◐" },
  partial_outage: { label: "Half broken", color: "#ef4444", icon: "◑" },
  major_outage: { label: "Very broken", color: "#dc2626", icon: "○" },
  unknown: { label: "Who knows", color: "#9ca3af", icon: "?" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

function LogoSvg({ id }: { id: string }) {
  if (id === "chatgpt") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3.005l-2.607 1.5-2.602-1.5z" fill="currentColor"/>
      </svg>
    );
  }
  // Claude/Anthropic logo
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.98 7.59L12.61 20.41H15.76L20.13 7.59H16.98ZM8.24 7.59L3.87 20.41H7.02L8.76 15.35H13.22L11.48 20.41H14.63L19.0 7.59H8.24ZM9.67 12.72L11.48 7.59L13.29 12.72H9.67Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" transform="translate(-1, -2)"/>
    </svg>
  );
}

const ROTATE_MS = 5000;

export default function AIStatusTile() {
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Fetch status
  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then((d: ProviderStatus[]) => setProviders(d))
      .catch(() => null);
  }, []);

  // Auto-rotate
  const rotate = useCallback(() => {
    if (!providers || providers.length < 2) return;
    setTransitioning(true);
    setTimeout(() => {
      setActive((a) => (a + 1) % providers.length);
      setTransitioning(false);
    }, 200);
  }, [providers]);

  useEffect(() => {
    if (paused || !providers || providers.length < 2 || prefersReducedMotion.current) return;
    timerRef.current = setInterval(rotate, ROTATE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, providers, rotate]);

  // Keyboard nav for dots
  const handleDotKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActive(idx);
    }
  };

  // Loading state
  if (!providers) {
    return (
      <div className="proj-tile ais-tile" aria-label="AI Status loading">
        <div className="ais-inner">
          <div className="ais-header-row">
            <span className="ais-title">AI Status</span>
          </div>
          <div className="ais-loading">
            <span className="ais-loading-dot" />
            <span className="ais-loading-text">checking…</span>
          </div>
        </div>
      </div>
    );
  }

  const p = providers[active];
  if (!p) return null;

  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.unknown;
  const hasIssue = p.status !== "operational";

  return (
    <div
      className="proj-tile ais-tile"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label={`AI Status: ${p.name} is ${cfg.label}`}
    >
      <div className="ais-inner">
        {/* Header */}
        <div className="ais-header-row">
          <span className="ais-title">AI Status</span>
          <span className="ais-checked">{timeAgo(p.checkedAt)}</span>
        </div>

        {/* Provider card */}
        <div
          className={`ais-card${transitioning ? " ais-card--out" : ""}`}
          style={{ "--brand": p.brandColor, "--status-color": cfg.color } as React.CSSProperties}
        >
          <div className="ais-provider-row">
            <span className="ais-logo" style={{ color: p.brandColor }}>
              <LogoSvg id={p.id} />
            </span>
            <span className="ais-provider-name">{p.name}</span>
            <span className="ais-status-badge" aria-label={`Status: ${cfg.label}`}>
              <span className="ais-pulse" style={{ background: cfg.color }} />
              {cfg.label}
            </span>
          </div>

          <div className="ais-summary">{p.summary}</div>

          {hasIssue && p.incidentTitle && (
            <div className="ais-incident">
              <span className="ais-incident-label">Latest:</span>{" "}
              {p.incidentTitle}
            </div>
          )}
        </div>

        {/* Footer: dots + link */}
        <div className="ais-footer">
          <div className="ais-dots" role="tablist" aria-label="Switch provider">
            {providers.map((pr, i) => (
              <button
                key={pr.id}
                className={`ais-dot${i === active ? " ais-dot--active" : ""}`}
                onClick={() => setActive(i)}
                onKeyDown={(e) => handleDotKey(e, i)}
                role="tab"
                aria-selected={i === active}
                aria-label={pr.name}
                title={pr.name}
                style={{ "--dot-color": pr.brandColor } as React.CSSProperties}
              />
            ))}
          </div>
          {hasIssue && (
            <a
              className="ais-link"
              href={p.statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              view status →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
