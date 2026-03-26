import ArrestBlotter from "./ArrestBlotter";
import CaseLoadPanel from "./CaseLoadPanel";
import DispositionPanel from "./DispositionPanel";
import CountyComparisonPanel from "./CountyComparisonPanel";
import PropImpactPanel from "./PropImpactPanel";
import type { ArrestYear, DispositionYear, CrimeYear, CountyData } from "../../lib/sonoma/types";

import arrestsData from "../../data/sonoma/arrests-by-year.json";
import dispositionsData from "../../data/sonoma/dispositions-by-year.json";
import crimesData from "../../data/sonoma/crimes-by-year.json";

export default function SonomaDashboard() {
  const arrests = arrestsData as CountyData<ArrestYear>;
  const dispositions = dispositionsData as CountyData<DispositionYear>;
  const crimes = crimesData as CountyData<CrimeYear>;

  return (
    <div className="da-page">
      <header className="da-header">
        <a href="/" className="da-back">&larr; stanwood.dev</a>
        <div>
          <h1 className="da-title">Sonoma County</h1>
          <p className="da-subtitle">Criminal Justice Dashboard</p>
        </div>
      </header>

      <div className="da-grid">
        <CaseLoadPanel data={arrests.sonoma} />
        <DispositionPanel data={dispositions.sonoma} />
        <CountyComparisonPanel data={arrests} />
        <PropImpactPanel data={crimes.sonoma} />
      </div>

      <ArrestBlotter />

      <footer className="da-footer">
        <p>
          Historical data: CA DOJ OpenJustice (2005–2024). Live arrests: Sonoma County Open Data Portal.
          All data is public record.
        </p>
      </footer>
    </div>
  );
}
