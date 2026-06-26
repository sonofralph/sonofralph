"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface MovementChartProps {
  data: { date: string; receipts: number; issues: number; wastage: number }[];
}

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#3b82f6"];

export function MovementAreaChart({ data }: MovementChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReceipts" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
        <Area type="monotone" dataKey="receipts" name="Receipts" stroke="#6366f1" strokeWidth={2} fill="url(#colorReceipts)" />
        <Area type="monotone" dataKey="issues" name="Issues" stroke="#f59e0b" strokeWidth={2} fill="url(#colorIssues)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CategoryChartProps {
  data: { name: string; value: number }[];
}

export function CategoryPieChart({ data }: CategoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(value: number) => [`${value} items`, ""]} />
        <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
