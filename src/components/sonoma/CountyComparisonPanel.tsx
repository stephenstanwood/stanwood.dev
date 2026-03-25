import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ArrestYear, CountyData, CountyKey } from "../../lib/sonoma/types";
import { COUNTY_COLORS, COUNTY_LABELS } from "../../lib/sonoma/types";
import StatCard from "./StatCard";

interface Props {
  data: CountyData<ArrestYear>;
}

type Metric = "total" | "felonyRate" | "violentRate";

export default function CountyComparisonPanel({ data }: Props) {
  const [metric, setMetric] = useState<Metric>("total");

  const counties: CountyKey[] = ["sonoma", "marin", "napa", "mendocino"];
  const years = data.sonoma.slice(-5).map((d) => d.year);

  const chartData = years.map((year) => {
    const row: Record<string, number> = { year };
    for (const county of counties) {
      const d = data[county].find((r) => r.year === year);
      if (!d) continue;
      if (metric === "total") row[county] = d.total;
      else if (metric === "felonyRate") row[county] = parseFloat(((d.felony / d.total) * 100).toFixed(1));
      else row[county] = parseFloat(((d.violent / d.total) * 100).toFixed(1));
    }
    return row;
  });

  const unit = metric === "total" ? "" : "%";
  const metricLabel = metric === "total" ? "Total Arrests" : metric === "felonyRate" ? "Felony Rate" : "Violent Rate";

  const latestStats = counties.map((county) => {
    const d = data[county][data[county].length - 1];
    let val: number;
    if (metric === "total") val = d.total;
    else if (metric === "felonyRate") val = parseFloat(((d.felony / d.total) * 100).toFixed(1));
    else val = parseFloat(((d.violent / d.total) * 100).toFixed(1));
    return { county, val };
  });

  return (
    <div className="da-panel">
      <div className="da-panel-header">
        <h3 className="da-panel-title">County Comparison</h3>
        <div className="da-toggle-group">
          <button className={`da-toggle ${metric === "total" ? "active" : ""}`} onClick={() => setMetric("total")}>Total</button>
          <button className={`da-toggle ${metric === "felonyRate" ? "active" : ""}`} onClick={() => setMetric("felonyRate")}>Felony %</button>
          <button className={`da-toggle ${metric === "violentRate" ? "active" : ""}`} onClick={() => setMetric("violentRate")}>Violent %</button>
        </div>
      </div>

      <div className="da-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={45} unit={unit} />
            <Tooltip formatter={(v) => `${v}${unit}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {counties.map((county) => (
              <Bar key={county} dataKey={county} fill={COUNTY_COLORS[county]} name={COUNTY_LABELS[county]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="da-stat-row">
        {latestStats.map((s) => (
          <StatCard key={s.county} label={COUNTY_LABELS[s.county]} value={metric === "total" ? s.val : `${s.val}%`} />
        ))}
      </div>

      <p className="da-note">{metricLabel} across North Bay counties (last 5 years). Source: CA DOJ OpenJustice.</p>
    </div>
  );
}
