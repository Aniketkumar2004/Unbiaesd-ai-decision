import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle } from "lucide-react";

const COLORS = [
  "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono">
        <div className="text-white">{payload[0]?.name}</div>
        <div className="text-cyan-400">{(payload[0]?.value * 100).toFixed(1)}%</div>
      </div>
    );
  }
  return null;
};

export default function DistributionChart({ attribute, stats }) {
  const dist = stats?.distribution || {};
  const data = Object.entries(dist).map(([name, value]) => ({ name, value }));
  const flagged = stats?.imbalance_flagged;

  if (data.length === 0) return null;

  // Use bar chart for many categories, pie for fewer
  const usePie = data.length <= 5;

  return (
    <div
      className={`rounded-xl border p-5 ${
        flagged ? "border-amber-500/30 bg-amber-500/5" : "border-slate-800 bg-navy-800/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          {flagged ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-display font-600 text-sm text-white capitalize">
            {attribute}
          </span>
        </div>
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
            flagged
              ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}
        >
          {flagged ? "⚠ Imbalanced" : "✓ Balanced"}
        </span>
      </div>

      <p className="text-xs text-slate-500 ml-6 mb-3">
        {stats?.unique_values} unique values · {stats?.missing_pct ?? 0}% missing
        {flagged && ` · Dominant group: ${stats?.dominant_group}`}
      </p>

      {/* Chart */}
      {usePie ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs font-mono text-slate-400 flex-1 truncate">
                  {item.name}
                </span>
                <span className="text-xs font-mono text-white">
                  {(item.value * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(data.length * 24 + 30, 80)}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: "#64748b", fontSize: 9, fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: "#94a3b8", fontSize: 9, fontFamily: "IBM Plex Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(6,182,212,0.05)" }} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
