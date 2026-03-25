import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ArrestYear } from "../../lib/sonoma/types";
import StatCard from "./StatCard";

interface Props {
  data: ArrestYear[];
}

type ViewMode = "total" | "type";

export default function CaseLoadPanel({ data }: Props) {
  const [view, setView] = useState<ViewMode>("total");

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const yoyChange = prev ? ((latest.total - prev.total) / prev.total) * 100 : 0;
  const felonyPct = latest ? ((latest.felony / latest.total) * 100).toFixed(0) : "0";

  return (
    <div className="da-panel">
      <div className="da-panel-header">
        <h3 className="da-panel-title">Arrest Trends</h3>
        <div className="da-toggle-group">
          <button className={`da-toggle ${view === "total" ? "active" : ""}`} onClick={() => setView("total")}>Total</button>
          <button className={`da-toggle ${view === "type" ? "active" : ""}`} onClick={() => setView("type")}>By Type</button>
        </div>
      </div>

      <div className="da-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          {view === "total" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.15} name="Total Arrests" />
            </AreaChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={50} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="violent" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} name="Violent" />
              <Area type="monotone" dataKey="property" stackId="1" stroke="#d97706" fill="#d97706" fillOpacity={0.6} name="Property" />
              <Area type="monotone" dataKey="drug" stackId="1" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} name="Drug" />
              <Area type="monotone" dataKey="other" stackId="1" stroke="#64748b" fill="#64748b" fillOpacity={0.4} name="Other" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="da-stat-row">
        <StatCard label={`${latest?.year} Arrests`} value={latest?.total ?? 0} change={yoyChange} changeLabel="YoY" />
        <StatCard label="Felony Rate" value={`${felonyPct}%`} />
        <StatCard label="Felonies" value={latest?.felony ?? 0} />
      </div>
    </div>
  );
}
