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
import { formatMonthDayYear } from "../../lib/dateFormat";
import { pluralize } from "../../lib/text";

export default function MoneyDashboard() {
  const [data, setData] = useState<MoneyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/money", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status}`);
        return response.json();
      })
      .then((json) => setData(json))
      .catch((cause) => setError(String(cause)));
  }, []);

  if (error) {
    return (
      <div className="mo-state">
        <div className="mo-state-emoji">🔒</div>
        <div className="mo-state-msg">
          {error.includes("401") ? "Please sign in again." : "Couldn’t load your spending. Try refreshing the page."}
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
  const updated = data.lastUpdated ? formatMonthDayYear(data.lastUpdated) : "never";

  return (
    <>
      {/* ── MASTHEAD ── */}
      <header className="mo-masthead">
        <h1 className="mo-title">Money</h1>
        <span className="mo-updated">Updated {updated}</span>
      </header>

      {/* ── HERO TOTAL ── */}
      <div className="mo-hero">
        <div className="mo-hero-label">Monthly spend</div>
        <div className="mo-hero-amount">{formatCents(monthly)}</div>
        <div className="mo-hero-sub">
          {formatCents(apiTotal)} variable APIs + {formatCents(subsTotal)} subscriptions
        </div>
      </div>

      {/* ── ANNUAL BANNER ── */}
      <div className="mo-annual">
        <span>estimated annual spend:</span>
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


    </>
  );
}

function domainPriceLabel(annualCents: number | null): string {
  if (annualCents === null) return "?";
  if (annualCents === 0) return "$0";
  return formatDollars(annualCents) + "/yr";
}

function ApiSection({ month, total }: { month: MonthEntry | null; total: number }) {
  if (!month) return null;
  return (
    <section className="mo-section">
      <div className="mo-section-head">
        <h2 className="mo-section-title">API usage</h2>
        <span className="mo-section-sub">this month</span>
        <span className="mo-section-total">{formatCents(total)}</span>
      </div>
      <div className="mo-cards">
        {[...SERVICE_ORDER]
          .sort((a, b) => {
            // Highest spend first; services with no data (?? -1) sort below $0.
            const spend = (svc: string) => month.services[svc]?.totalCents ?? -1;
            return spend(b) - spend(a);
          })
          .map((svc) => {
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
                  style={{ background: "#f5f4ee", color: "#252127", borderColor: "#aaa" }}
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
        <h2 className="mo-section-title">Subscriptions</h2>
        <span className="mo-section-sub">subscriptions + charges</span>
        <span className="mo-section-total">{formatCents(total)}/mo</span>
      </div>
      <div className="mo-cards">
        {[...subs].sort((a, b) => (b.cents ?? -1) - (a.cents ?? -1)).map((sub) => {
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
                    background: "#f5f4ee",
                    color: "#252127",
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
                    opacity: 0.85,
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
        <h2 className="mo-section-title">Domains</h2>
        <span className="mo-section-sub">renewals</span>
        <span className="mo-section-total">{formatCents(total)}/yr</span>
      </div>
      <div className="mo-domains">
        {sorted.map((domain) => {
          const days = daysUntil(domain.renewsAt);
          let renewalClass = "mo-domain-renewal";
          if (days !== null) {
            if (days < 30) renewalClass += " mo-domain-renewal--very-soon";
            else if (days < 90) renewalClass += " mo-domain-renewal--soon";
          }
          return (
            <div key={domain.name} className="mo-domain-row">
              <div>
                <div className="mo-domain-name">{domain.name}</div>
                <div className="mo-domain-registrar">{domain.registrar}</div>
              </div>
              <div className={renewalClass}>
                {domain.renewsAt ? (
                  <>
                    {formatRenewalDate(domain.renewsAt)}
                    {days !== null && days >= 0 && (
                      <div style={{ fontSize: 9, opacity: 0.6 }}>
                        in {days} {pluralize(days, "day")}
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
                  (domain.annualCents === 0 ? " mo-domain-price--zero" : "")
                }
              >
                {domainPriceLabel(domain.annualCents)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.85,
                  fontStyle: "italic",
                }}
              >
                {domain.note || ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
