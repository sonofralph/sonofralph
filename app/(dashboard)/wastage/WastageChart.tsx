"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  units: number;
  value: number;
}

export function WastageChart({ data }: { data: DataPoint[] }) {
  if (data.every((d) => d.units === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        No wastage data in this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          formatter={(value, name) =>
            name === "value"
              ? [`$${Number(value).toFixed(2)}`, "Value Lost"]
              : [value, "Units"]
          }
        />
        <Bar dataKey="units" fill="#f87171" radius={[3, 3, 0, 0]} name="units" />
      </BarChart>
    </ResponsiveContainer>
  );
}
