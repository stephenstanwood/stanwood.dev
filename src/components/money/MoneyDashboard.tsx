import { useEffect, useState } from "react";
import {
  type MoneyData,
  type MonthEntry,
  type Subscription,
  type Domain,
  SERVICE_META,
  SERVICE_ORDER,
  CATEGORY_META,
  formatCents,
  formatDollars,
  getLatestMonth,
  getApiTotalForMonth,
  getSubscriptionsTotal,
  getAnnualDomainsTotal,
  getAnnualRunRate,
  daysUntil,
  formatRenewalDate,
  sortDomainsByRenewal,
} from "../../lib/money";

const TAGLINES = [
  "money out the door 💸",
  "the damage, itemized",
  "what's eating your wallet",
  "receipts from the void",
  "the books, kinda",
];

function pickTagline(): string {
  const i = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) % TAGLINES.length;
  return TAGLINES[i];
}

export default function MoneyDashboard() {
  const [data, setData] = useState<MoneyData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/money", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) {
    return (
      <div className="mo-state">
        <div className="mo-state-emoji">🔒</div>
        <div className="mo-state-msg">
          {err.includes("401") ? "password please" : `error: ${err}`}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mo-state">
        <div className="mo-state-emoji">💰</div>
        <div className="mo-state-msg">counting...</div>
      </div>
    );
  }

  const latest = getLatestMonth(data);
  const apiTotal = getApiTotalForMonth(latest);
  const subsTotal = getSubscriptionsTotal(data.subscriptions);
  const monthly = apiTotal + subsTotal;
  const annualDomains = getAnnualDomainsTotal(data.domains);
  const annualRunRate = getAnnualRunRate(data);
  const updated = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "never";

  return (
    <>
      {/* ── MASTHEAD ── */}
      <header className="mo-masthead">
        <h1 className="mo-title">$$$</h1>
        <div>
          <span className="mo-tagline">{pickTagline()}</span>
        </div>
        <span className="mo-updated">last collected: {updated}</span>
      </header>

      {/* ── HERO TOTAL ── */}
      <div className="mo-hero">
        <div className="mo-hero-label">this month's damage</div>
        <div className="mo-hero-amount">{formatCents(monthly)}</div>
        <div className="mo-hero-sub">
          {formatCents(apiTotal)} variable APIs + {formatCents(subsTotal)} subscriptions
        </div>
      </div>

      {/* ── ANNUAL BANNER ── */}
      <div className="mo-annual">
        <span>annual run rate:</span>
        <strong>{formatCents(annualRunRate)}</strong>
        <span>
          (monthly ×12 + {formatCents(annualDomains)} domains)
        </span>
      </div>

      {/* ── VARIABLE APIs ── */}
      <ApiSection month={latest} total={apiTotal} />

      {/* ── SUBSCRIPTIONS ── */}
      <SubsSection subs={data.subscriptions} total={subsTotal} />

      {/* ── DOMAINS ── */}
      <DomainsSection domains={data.domains} total={annualDomains} />

      <div className="mo-footer">collected via scripts/collect-money.mjs</div>
    </>
  );
}

function ApiSection({ month, total }: { month: MonthEntry | null; total: number }) {
  if (!month) return null;
  return (
    <section className="mo-section">
      <div className="mo-section-head">
        <h2 className="mo-section-title">🔌 variable apis</h2>
        <span className="mo-section-sub">the wild west</span>
        <span className="mo-section-total">{formatCents(total)}</span>
      </div>
      <div className="mo-cards">
        {SERVICE_ORDER.map((svc) => {
          const entry = month.services[svc];
          if (!entry) return null;
          const meta = SERVICE_META[svc];
          const hasData = entry.totalCents !== null;
          return (
            <a
              key={svc}
              href={meta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mo-card mo-card--api"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="mo-card-head">
                <span className="mo-card-name">
                  <span style={{ marginRight: 6 }}>{meta.emoji}</span>
                  {meta.label}
                </span>
                <span
                  className="mo-chip"
                  style={{ background: meta.color, color: "#fff", borderColor: "#000" }}
                >
                  API
                </span>
              </div>
              {hasData ? (
                <>
                  <div className="mo-card-amount mo-card-amount--big">
                    {formatCents(entry.totalCents!)}
                  </div>
                  {entry.breakdown && entry.breakdown.length > 0 && (
                    <div className="mo-card-breakdown">
                      {entry.breakdown.slice(0, 5).map((b) => (
                        <div key={b.name} className="mo-card-breakdown-row">
                          <span>{b.name}</span>
                          <span>{formatCents(b.cents)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mo-card-amount" style={{ opacity: 0.3 }}>
                    —
                  </div>
                  <div className="mo-card-note">{entry.note}</div>
                </>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function SubsSection({ subs, total }: { subs: Subscription[]; total: number }) {
  return (
    <section className="mo-section">
      <div className="mo-section-head">
        <h2 className="mo-section-title">📦 subscriptions</h2>
        <span className="mo-section-sub">the regulars</span>
        <span className="mo-section-total">{formatCents(total)}/mo</span>
      </div>
      <div className="mo-cards">
        {subs.map((sub) => {
          const cat = CATEGORY_META[sub.category] || {
            label: sub.category.toUpperCase(),
            color: "#666",
            bg: "#f0f0f0",
          };
          return (
            <a
              key={sub.name}
              href={sub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mo-card mo-card--sub"
              style={{ textDecoration: "none", color: "inherit", background: cat.bg }}
            >
              <div className="mo-card-head">
                <span className="mo-card-name">{sub.name}</span>
                <span
                  className="mo-chip"
                  style={{
                    background: cat.color,
                    color: "#fff",
                    borderColor: "#000",
                  }}
                >
                  {cat.label}
                </span>
              </div>
              <div className="mo-card-amount">
                {sub.cents === null ? "?" : formatCents(sub.cents)}
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    opacity: 0.5,
                    marginLeft: 4,
                  }}
                >
                  /mo
                </span>
              </div>
              {sub.note && <div className="mo-card-note">{sub.note}</div>}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function DomainsSection({ domains, total }: { domains: Domain[]; total: number }) {
  const sorted = sortDomainsByRenewal(domains);
  return (
    <section className="mo-section">
      <div className="mo-section-head">
        <h2 className="mo-section-title">🌐 domains</h2>
        <span className="mo-section-sub">annual rent</span>
        <span className="mo-section-total">{formatCents(total)}/yr</span>
      </div>
      <div className="mo-domains">
        {sorted.map((d) => {
          const days = daysUntil(d.renewsAt);
          let renewalClass = "mo-domain-renewal";
          if (days !== null) {
            if (days < 30) renewalClass += " mo-domain-renewal--very-soon";
            else if (days < 90) renewalClass += " mo-domain-renewal--soon";
          }
          return (
            <div key={d.name} className="mo-domain-row">
              <div>
                <div className="mo-domain-name">{d.name}</div>
                <div className="mo-domain-registrar">{d.registrar}</div>
              </div>
              <div className={renewalClass}>
                {d.renewsAt ? (
                  <>
                    {formatRenewalDate(d.renewsAt)}
                    {days !== null && days >= 0 && (
                      <div style={{ fontSize: 9, opacity: 0.6 }}>
                        in {days} day{days === 1 ? "" : "s"}
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ opacity: 0.4 }}>—</span>
                )}
              </div>
              <div
                className={
                  "mo-domain-price" +
                  (d.annualCents === 0 ? " mo-domain-price--zero" : "")
                }
              >
                {d.annualCents === null
                  ? "?"
                  : d.annualCents === 0
                    ? "$0"
                    : formatDollars(d.annualCents) + "/yr"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.5,
                  fontStyle: "italic",
                }}
              >
                {d.note || ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
