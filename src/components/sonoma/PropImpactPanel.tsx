import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";
import type { CrimeYear } from "../../lib/sonoma/types";
import { percent } from "../../lib/sonoma/utils";
import StatCard from "./StatCard";

interface Props {
  data: CrimeYear[];
}

type CrimeType = "violent" | "property";

export default function PropImpactPanel({ data }: Props) {
  const [crimeType, setCrimeType] = useState<CrimeType>("property");

  const getValue = (d: CrimeYear) => crimeType === "violent" ? d.totalViolent : d.totalProperty;
  const label = crimeType === "violent" ? "Violent Crime" : "Property Crime";

  // Prop 47 before/after: 2010-2014 avg vs 2015-2019 avg
  const pre47 = data.filter((d) => d.year >= 2010 && d.year <= 2014);
  const post47 = data.filter((d) => d.year >= 2015 && d.year <= 2019);
  const avg = (arr: CrimeYear[]) => arr.length ? arr.reduce((s, d) => s + getValue(d), 0) / arr.length : 0;
  const pre47Avg = avg(pre47);
  const post47Avg = avg(post47);
  const prop47Change = pre47Avg ? ((post47Avg - pre47Avg) / pre47Avg) * 100 : 0;

  // Clearance rate for latest year
  const latest = data.at(-1);
  const clearanceRate = crimeType === "violent"
    ? percent(latest?.violentCleared ?? 0, latest?.totalViolent)
    : percent(latest?.propertyCleared ?? 0, latest?.totalProperty);

  return (
    <div className="da-panel">
      <div className="da-panel-header">
        <h3 className="da-panel-title">Proposition Impact</h3>
        <div className="da-toggle-group">
          <button className={`da-toggle ${crimeType === "property" ? "active" : ""}`} onClick={() => setCrimeType("property")}>Property</button>
          <button className={`da-toggle ${crimeType === "violent" ? "active" : ""}`} onClick={() => setCrimeType("violent")}>Violent</button>
        </div>
      </div>

      <div className="da-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={55} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x={2014} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "Prop 47", position: "top", fontSize: 10, fill: "#dc2626" }} />
            <ReferenceLine x={2024} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: "Prop 36", position: "top", fontSize: 10, fill: "#7c3aed" }} />
            <Line type="monotone" dataKey={crimeType === "violent" ? "totalViolent" : "totalProperty"} stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3 }} name={label} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="da-stat-row">
        <StatCard label="Prop 47 Impact" value={`${prop47Change > 0 ? "+" : ""}${prop47Change.toFixed(1)}%`} changeLabel="5yr avg" />
        <StatCard label="Pre-47 Avg" value={Math.round(pre47Avg).toLocaleString()} />
        <StatCard label="Post-47 Avg" value={Math.round(post47Avg).toLocaleString()} />
        <StatCard label="Clearance Rate" value={`${clearanceRate}%`} />
      </div>

      <p className="da-note">
        Prop 47 (2014) reclassified certain felonies as misdemeanors. Prop 36 (Nov 2024) tightened theft/drug penalties.
        Source: CA DOJ Crimes & Clearances.
      </p>
    </div>
  );
}
