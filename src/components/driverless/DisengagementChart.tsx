import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { disengagementData } from "../../data/driverless/data";
import ChartTooltipBox, {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  type ChartTooltipProps,
} from "./ChartTooltipBox";
import PanelHeader from "./PanelHeader";
import { DL_MONO } from "./FilterPill";

const chartData = disengagementData.map((d) => ({
  ...d,
  label: d.milesPerDisengagement.toLocaleString() + " mi",
}));

interface DisengagementPayloadEntry {
  payload: { company: string; milesPerDisengagement: number };
}

function DisengagementTooltip({ active, payload }: ChartTooltipProps<DisengagementPayloadEntry>) {
  if (!active || !payload?.length) return null;
  const { company, milesPerDisengagement } = payload[0].payload;
  return (
    <ChartTooltipBox>
      <strong>{company}</strong>
      <div>{milesPerDisengagement.toLocaleString()} miles between human takeovers</div>
    </ChartTooltipBox>
  );
}

export default function DisengagementChart() {
  return (
    <div className="dl-panel dl-full">
      <PanelHeader title="How Far Without a Human?" subtitle="Miles between human takeovers (CA DMV, Dec 2024–Nov 2025)" />
      <div className="dl-chart-wrap">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 70, bottom: 5, left: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} horizontal={false} />
            <XAxis type="number" tick={CHART_AXIS_TICK} tickFormatter={(v) => v.toLocaleString()} />
            <YAxis type="category" dataKey="company" tick={{ fontSize: 12, fontWeight: 500 }} width={55} />
            <Tooltip content={<DisengagementTooltip />} />
            <Bar dataKey="milesPerDisengagement" fill="var(--dl-accent)" radius={[0, 4, 4, 0]}>
              <LabelList
                dataKey="label"
                position="right"
                style={{ fontSize: 11, fill: "var(--dl-muted)", fontFamily: DL_MONO }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
