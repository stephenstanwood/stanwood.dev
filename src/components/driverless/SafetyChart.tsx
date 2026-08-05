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
import ChartTooltipBox from "./ChartTooltipBox";
import PanelHeader from "./PanelHeader";

const chartData = safetyData.map((d) => ({
  ...d,
  label: `-${d.reduction}%`,
}));

interface SafetyPayloadEntry { dataKey: string; value: number }

function SafetyTooltip({ active, payload, label }: { active?: boolean; payload?: SafetyPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const human = payload.find((p) => p.dataKey === "humanRate");
  const waymo = payload.find((p) => p.dataKey === "waymoRate");
  return (
    <ChartTooltipBox>
      <strong>{label}</strong>
      {human && <div style={{ color: "#ef4444" }}>Human drivers: baseline</div>}
      {waymo && <div style={{ color: "#22c55e" }}>Waymo: {waymo.value}% of human rate</div>}
    </ChartTooltipBox>
  );
}

export default function SafetyChart() {
  return (
    <div className="dl-panel">
      <PanelHeader title="Safety: Waymo vs Human Drivers" subtitle="Peer-reviewed, 56.7M rider miles" />
      <div className="dl-chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} domain={[0, 110]} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<SafetyTooltip />} />
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
