import SportsView from "./SportsView";

export default function OverviewView() {
  return (
    <>
      {/* Sports section — show the full scoreboard on overview for now */}
      <SportsView />

      {/* Future: events preview, government digest preview */}
      <div style={{ marginTop: 32 }} className="sb-overview-grid">
        <div className="sb-overview-section">
          <h3>Events</h3>
          <p style={{ color: "var(--sb-muted)", fontSize: 13, margin: 0 }}>
            Local events calendar coming soon. Farmers markets, festivals, city
            programs, and more across all 11 cities.
          </p>
        </div>
        <div className="sb-overview-section">
          <h3>Government</h3>
          <p style={{ color: "var(--sb-muted)", fontSize: 13, margin: 0 }}>
            Council meeting summaries, budget updates, and public notices coming
            soon. AI-powered digests of what your city council is up to.
          </p>
        </div>
      </div>
    </>
  );
}
