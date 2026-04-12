import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { safetyData } from "../../data/driverless/data";

const chartData = safetyData.map((d) => ({
  ...d,
  label: `-${d.reduction}%`,
}));

interface ChartPayloadEntry { dataKey: string; value: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: ChartPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const human = payload.find((p) => p.dataKey === "humanRate");
  const waymo = payload.find((p) => p.dataKey === "waymoRate");
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
      <strong>{label}</strong>
      {human && <div style={{ color: "#ef4444" }}>Human drivers: baseline</div>}
      {waymo && <div style={{ color: "#22c55e" }}>Waymo: {waymo.value}% of human rate</div>}
    </div>
  );
}

export default function SafetyChart() {
  return (
    <div className="dl-panel">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Safety: Waymo vs Human Drivers</h2>
        <span className="dl-panel-subtitle">Peer-reviewed, 56.7M rider miles</span>
      </div>
      <div className="dl-chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} domain={[0, 110]} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="humanRate" name="Human Drivers" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="waymoRate" name="Waymo" fill="#22c55e" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="label"
                position="top"
                style={{ fontSize: 12, fontWeight: 600, fill: "#16a34a", fontFamily: "JetBrains Mono, monospace" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
