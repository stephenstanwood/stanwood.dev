import { useState, useEffect, useCallback, useRef } from "react";
import type { ProviderStatus } from "../pages/api/ai-status";

const BRAND: Record<string, { bg: string; logoColor: string }> = {
  chatgpt: { bg: "#0d0d0d", logoColor: "#10a37f" },
  claude: { bg: "#e8763a", logoColor: "#e8763a" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  operational: { label: "All good", color: "#22c55e" },
  degraded: { label: "A little off", color: "#f59e0b" },
  partial_outage: { label: "Half broken", color: "#ef4444" },
  major_outage: { label: "Very broken", color: "#dc2626" },
  unknown: { label: "Who knows", color: "#9ca3af" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

function LogoSvg({ id, size = 36 }: { id: string; size?: number }) {
  if (id === "chatgpt") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v3.005l-2.607 1.5-2.602-1.5z" fill="currentColor"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" fill="currentColor"/>
    </svg>
  );
}

const ROTATE_MS = 5000;

export default function AIStatusTile() {
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then((d: ProviderStatus[]) => setProviders(d))
      .catch(() => null);
  }, []);

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
    const id = setInterval(rotate, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, providers, rotate]);

  const handleDotKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActive(idx);
    }
  };

  if (!providers) {
    return (
      <div className="proj-tile ais-tile">
        <div className="ais-head">
          <div className="ais-loading">
            <span className="ais-loading-dot" />
            <span className="ais-loading-text">checking…</span>
          </div>
        </div>
        <div className="ais-body" style={{ background: BRAND.claude.bg }} />
      </div>
    );
  }

  const provider = providers[active];
  if (!provider) return null;

  const brand = BRAND[provider.id] ?? BRAND.claude;
  const cfg = STATUS_CONFIG[provider.status] ?? STATUS_CONFIG.unknown;
  const hasIssue = provider.status !== "operational";

  return (
    <div
      className={`proj-tile ais-tile${transitioning ? " ais-tile--out" : ""}`}
      onClick={rotate}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ cursor: "pointer" }}
      aria-label={`AI Status: ${provider.name} is ${cfg.label}`}
    >
      {/* White zone: logo, name, status */}
      <div className="ais-head">
        <span className="ais-logo" style={{ color: brand.logoColor }}>
          <LogoSvg id={provider.id} size={40} />
        </span>
        <div className="ais-head-text">
          <span className="ais-name">{provider.name}</span>
          <div className="ais-status-row">
            <span className="ais-pulse" style={{ background: cfg.color }} />
            <span className="ais-status-label" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Brand color zone: summary, incident, footer */}
      <div className="ais-body" style={{ background: brand.bg }}>
        <div className="ais-summary">
          {provider.summary}
        </div>
        {hasIssue && provider.incidentTitle && (
          <div className="ais-incident">
            {provider.incidentTitle}
          </div>
        )}
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
              />
            ))}
          </div>
          <div className="ais-meta">
            <span className="ais-checked">
              {timeAgo(provider.checkedAt)}
            </span>
            {hasIssue && (
              <a
                className="ais-link"
                href={provider.statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                status page →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
