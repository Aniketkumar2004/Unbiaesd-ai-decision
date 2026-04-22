import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Zap } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono">
        <div className="text-cyan-400">{payload[0]?.payload?.feature}</div>
        <div className="text-white mt-0.5">
          Importance: {payload[0]?.value?.toFixed(5)}
        </div>
      </div>
    );
  }
  return null;
};

export default function ShapChart({ data }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.importance));

  return (
    <div className="bg-navy-800/50 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="font-display font-700 text-sm text-white">
          SHAP Feature Importance
        </h3>
        <span className="text-xs font-mono text-slate-500 ml-auto">
          Top {data.length} features
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Features with higher SHAP values drive predictions more. Sensitive
        attributes near the top may indicate proxy discrimination.
      </p>

      <ResponsiveContainer width="100%" height={data.length * 36 + 40}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "#64748b", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={120}
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(6,182,212,0.05)" }} />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {data.map((entry, idx) => {
              const ratio = entry.importance / maxVal;
              // Highlight if importance is very high (possible sensitive proxy)
              const isHigh = ratio > 0.8;
              return (
                <Cell
                  key={idx}
                  fill={
                    isHigh
                      ? "rgba(251,146,60,0.7)"
                      : `rgba(6,182,212,${0.3 + ratio * 0.5})`
                  }
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs font-mono text-amber-400/70 mt-3">
        🟠 High-importance features warrant review for sensitive attribute correlation.
      </p>
    </div>
  );
}
