import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

const METRIC_META = {
  demographic_parity: {
    label: "Demographic Parity",
    description: "Are positive prediction rates equal across groups?",
    valueKey: "difference",
    valueLabel: "Difference",
    threshold: 0.10,
    lower_is_better: true,
  },
  equalized_odds: {
    label: "Equalized Odds",
    description: "Are TPR and FPR equal across groups?",
    valueKey: "tpr_difference",
    valueLabel: "TPR Diff",
    threshold: 0.10,
    lower_is_better: true,
  },
  disparate_impact: {
    label: "Disparate Impact",
    description: "Ratio of positive rates (≥ 0.80 = passes 80% rule)",
    valueKey: "ratio",
    valueLabel: "Ratio",
    threshold: 0.80,
    lower_is_better: false,
  },
  predictive_parity: {
    label: "Predictive Parity",
    description: "Is precision equal across groups?",
    valueKey: "difference",
    valueLabel: "Difference",
    threshold: 0.10,
    lower_is_better: true,
  },
  fnr_difference: {
    label: "FNR Difference",
    description: "Are false negative rates equal across groups?",
    valueKey: "difference",
    valueLabel: "Difference",
    threshold: 0.10,
    lower_is_better: true,
  },
};

export default function MetricCard({ metricKey, metric }) {
  const meta = METRIC_META[metricKey] || { label: metricKey, description: "", valueKey: "value" };
  const flagged = metric?.flagged;
  const value = metric?.[meta.valueKey];

  // Build group breakdown rows
  const groupData = (() => {
    if (metricKey === "demographic_parity") return metric?.rates_by_group;
    if (metricKey === "equalized_odds") return metric?.tpr_by_group;
    if (metricKey === "disparate_impact") return metric?.rates_by_group;
    if (metricKey === "predictive_parity") return metric?.precision_by_group;
    if (metricKey === "fnr_difference") return metric?.fnr_by_group;
    return null;
  })();

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        flagged
          ? "border-red-500/30 bg-red-500/5"
          : "border-slate-800 bg-navy-800/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {flagged ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-display font-600 text-sm text-white">
              {meta.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 ml-6">{meta.description}</p>
        </div>

        {/* Main value badge */}
        {value !== undefined && (
          <div
            className={`font-mono text-sm font-bold px-3 py-1 rounded-lg shrink-0 ml-3 ${
              flagged
                ? "text-red-400 bg-red-500/10 border border-red-500/20"
                : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            {typeof value === "number" ? value.toFixed(4) : value}
          </div>
        )}
      </div>

      {/* Flag badge */}
      <div className="mb-3">
        <span
          className={`inline-flex items-center text-xs font-mono px-2 py-0.5 rounded-full border ${
            flagged
              ? "text-red-400 bg-red-500/10 border-red-500/20"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}
        >
          {flagged ? "⚠ FLAGGED" : "✓ PASS"}
        </span>
        {metricKey === "disparate_impact" && metric?.interpretation && (
          <span className="ml-2 text-xs text-slate-500 font-mono">
            {metric.interpretation}
          </span>
        )}
      </div>

      {/* Group breakdown */}
      {groupData && Object.keys(groupData).length > 0 && (
        <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/60">
          <p className="text-xs font-mono text-slate-600 mb-2 uppercase tracking-wide">
            By group
          </p>
          {Object.entries(groupData).map(([group, val]) => (
            <div key={group} className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 w-28 truncate">{group}</span>
              <div className="flex-1 h-1.5 bg-navy-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    flagged ? "bg-red-400/60" : "bg-cyan-500/60"
                  }`}
                  style={{ width: `${Math.min(val * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-slate-400 w-14 text-right">
                {typeof val === "number" ? (val * 100).toFixed(1) + "%" : val}
              </span>
            </div>
          ))}

          {/* FPR for equalized odds */}
          {metricKey === "equalized_odds" && metric?.fpr_by_group && (
            <>
              <p className="text-xs font-mono text-slate-600 mt-3 mb-1 uppercase tracking-wide">
                FPR by group
              </p>
              {Object.entries(metric.fpr_by_group).map(([group, val]) => (
                <div key={group} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500 w-28 truncate">{group}</span>
                  <div className="flex-1 h-1.5 bg-navy-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500/60 rounded-full"
                      style={{ width: `${Math.min(val * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400 w-14 text-right">
                    {(val * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
