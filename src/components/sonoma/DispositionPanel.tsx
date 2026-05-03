import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DispositionYear } from "../../lib/sonoma/types";
import { percent } from "../../lib/sonoma/utils";
import StatCard from "./StatCard";

interface Props {
  data: DispositionYear[];
}

export default function DispositionPanel({ data }: Props) {
  const latest = data.at(-1);
  const prev = data.at(-2);

  const pct = (n: number) => percent(n, latest?.total);
  const complaintPct = pct(latest?.complaintSought ?? 0);
  const prevComplaintPct = percent(prev?.complaintSought ?? 0, prev?.total);

  return (
    <div className="da-panel">
      <div className="da-panel-header">
        <h3 className="da-panel-title">Arrest Dispositions</h3>
        <span className="da-panel-subtitle">What happens after arrest</span>
      </div>

      <div className="da-chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={50} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="complaintSought" stackId="a" fill="#1e3a5f" name="Complaint Sought" />
            <Bar dataKey="released" stackId="a" fill="#94a3b8" name="Released" />
            <Bar dataKey="toOtherAgency" stackId="a" fill="#0d9488" name="To Other Agency" />
            <Bar dataKey="juvenileProbation" stackId="a" fill="#d97706" name="Juvenile Probation" />
            <Bar dataKey="withinDepartment" stackId="a" fill="#d4d4d8" name="Within Dept" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="da-stat-row">
        <StatCard
          label="Complaint Sought"
          value={`${complaintPct}%`}
          change={complaintPct - prevComplaintPct}
          changeLabel="YoY"
        />
        <StatCard label="Released" value={`${pct(latest?.released ?? 0)}%`} />
        <StatCard label="Other Agency" value={`${pct(latest?.toOtherAgency ?? 0)}%`} />
      </div>

      <p className="da-note">
        "Complaint Sought" means the case was referred for prosecution. Source: CA DOJ CJSC Arrest Dispositions.
      </p>
    </div>
  );
}
