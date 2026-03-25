interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

export default function StatCard({ label, value, change, changeLabel }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="da-stat-card">
      <div className="da-stat-label">{label}</div>
      <div className="da-stat-value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {change !== undefined && (
        <div className={`da-stat-change ${isPositive ? "up" : isNegative ? "down" : ""}`}>
          {isPositive ? "\u2191" : isNegative ? "\u2193" : "\u2014"}{" "}
          {Math.abs(change).toFixed(1)}%{changeLabel ? ` ${changeLabel}` : ""}
        </div>
      )}
    </div>
  );
}
