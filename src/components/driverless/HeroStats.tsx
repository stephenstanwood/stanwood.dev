import { heroStats } from "../../data/driverless/data";

export default function HeroStats() {
  return (
    <div className="dl-hero-row">
      {heroStats.map((s) => (
        <div key={s.label} className="dl-hero-card">
          <div className="dl-hero-icon">{s.icon}</div>
          <div className="dl-hero-value">{s.value}</div>
          <div className="dl-hero-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
