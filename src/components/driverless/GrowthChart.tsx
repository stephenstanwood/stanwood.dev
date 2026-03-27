import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { growthData } from "../../data/driverless/data";

interface ChartPayloadEntry { value: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: ChartPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
      <strong>{label}</strong>
      <div style={{ color: "#3b82f6" }}>{payload[0].value.toLocaleString()}K rides/week</div>
    </div>
  );
}

export default function GrowthChart() {
  return (
    <div className="dl-panel">
      <div className="dl-panel-header">
        <h2 className="dl-panel-title">Waymo Rides Per Week</h2>
        <span className="dl-panel-subtitle">From zero to 500K since Dec 2018</span>
      </div>
      <div className="dl-chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={growthData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={45} tickFormatter={(v) => `${v}K`} domain={[0, 550]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="ridesK"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#growthGrad)"
            />
            <ReferenceDot
              x="Mar '26"
              y={500}
              r={5}
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
