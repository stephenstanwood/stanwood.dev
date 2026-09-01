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
import ChartTooltipBox, {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  type ChartTooltipProps,
} from "./ChartTooltipBox";
import PanelHeader from "./PanelHeader";
import { DL_MONO } from "./FilterPill";

const HUMAN_COLOR = "var(--dl-red)";
const WAYMO_COLOR = "var(--dl-green)";

const chartData = safetyData.map((d) => ({
  ...d,
  label: `-${d.reduction}%`,
}));

interface SafetyPayloadEntry { dataKey: string; value: number }

function SafetyTooltip({ active, payload, label }: ChartTooltipProps<SafetyPayloadEntry>) {
  if (!active || !payload?.length) return null;
  const human = payload.find((p) => p.dataKey === "humanRate");
  const waymo = payload.find((p) => p.dataKey === "waymoRate");
  return (
    <ChartTooltipBox>
      <strong>{label}</strong>
      {human && <div style={{ color: HUMAN_COLOR }}>Human drivers: baseline</div>}
      {waymo && <div style={{ color: WAYMO_COLOR }}>Waymo: {waymo.value}% of human rate</div>}
    </ChartTooltipBox>
  );
}

export default function SafetyChart() {
  return (
    <div className="dl-panel">
      <PanelHeader title="Safety: Waymo vs Human Drivers" subtitle="Waymo safety data, 220.6M rider-only miles" />
      <div className="dl-chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="category" tick={CHART_AXIS_TICK} />
            <YAxis tick={CHART_AXIS_TICK} width={40} domain={[0, 110]} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<SafetyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="humanRate" name="Human Drivers" fill={HUMAN_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="waymoRate" name="Waymo" fill={WAYMO_COLOR} radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="label"
                position="top"
                style={{ fontSize: 12, fontWeight: 600, fill: "var(--dl-accent)", fontFamily: DL_MONO }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
