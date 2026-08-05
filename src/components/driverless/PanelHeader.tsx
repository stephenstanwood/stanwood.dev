// Shared title/subtitle header for every dl-panel on /driverless. Each panel
// keeps its own outer wrapper (the dl-full / dl-myths / … modifiers differ),
// so only the header block is shared.
export default function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="dl-panel-header">
      <h2 className="dl-panel-title">{title}</h2>
      <span className="dl-panel-subtitle">{subtitle}</span>
    </div>
  );
}
