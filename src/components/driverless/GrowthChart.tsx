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
import ChartTooltipBox, {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  type ChartTooltipProps,
} from "./ChartTooltipBox";
import PanelHeader from "./PanelHeader";

const GROWTH_COLOR = "var(--dl-blue)";

interface GrowthPayloadEntry { value: number }

function GrowthTooltip({ active, payload, label }: ChartTooltipProps<GrowthPayloadEntry>) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltipBox>
      <strong>{label}</strong>
      <div style={{ color: GROWTH_COLOR }}>{payload[0].value.toLocaleString()}K rides/week</div>
    </ChartTooltipBox>
  );
}

export default function GrowthChart() {
  return (
    <div className="dl-panel">
      <PanelHeader title="Waymo Rides Per Week" subtitle="From zero to 500K since Dec 2018" />
      <div className="dl-chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={growthData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GROWTH_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={GROWTH_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="date" tick={CHART_AXIS_TICK} />
            <YAxis tick={CHART_AXIS_TICK} width={45} tickFormatter={(v) => `${v}K`} domain={[0, 550]} />
            <Tooltip content={<GrowthTooltip />} />
            <Area
              type="monotone"
              dataKey="ridesK"
              stroke={GROWTH_COLOR}
              strokeWidth={2.5}
              fill="url(#growthGrad)"
            />
            <ReferenceDot
              x="Mar '26"
              y={500}
              r={5}
              fill={GROWTH_COLOR}
              stroke="#fff"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
