import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  DownloadCloud,
  RefreshCw,
  Shield,
  BarChart2,
  Database,
} from "lucide-react";
import MetricCard from "./MetricCard.jsx";
import ShapChart from "./ShapChart.jsx";
import DistributionChart from "./DistributionChart.jsx";
import { getReportUrl } from "../api/client.js";

const RISK_CONFIG = {
  High: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
    dot: "bg-red-400",
  },
  Medium: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    dot: "bg-amber-400",
  },
  Low: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    dot: "bg-emerald-400",
  },
};

export default function Dashboard({ result, onReset }) {
  const isModel = result.type === "model";
  const summary = result.summary || {};
  const risk = summary.bias_risk || summary.risk || "Low";
  const rc = RISK_CONFIG[risk] || RISK_CONFIG.Low;

  return (
    <div className="space-y-8">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-800 text-white">
            Audit Results
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            ID: {result.audit_id} · {result.rows?.toLocaleString()} rows ·{" "}
            {isModel ? "Model Audit" : "Dataset Audit"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getReportUrl(result.audit_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-sm font-mono transition-all"
          >
            <DownloadCloud className="w-4 h-4" />
            Download PDF Report
          </a>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 text-sm font-mono transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            New Audit
          </button>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Risk level */}
        <div
          className={`rounded-xl border p-5 ${rc.border} ${rc.bg} fade-in-up`}
        >
          <div className="flex items-center gap-2 mb-2">
            {rc.icon}
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Bias Risk
            </span>
          </div>
          <div className={`text-3xl font-display font-800 ${rc.color}`}>
            {risk}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${rc.dot} animate-pulse`} />
            <span className="text-xs text-slate-500 font-mono">
              {isModel
                ? `${summary.total_flags || 0} metric flags`
                : `${summary.flagged_imbalances || 0} imbalances flagged`}
            </span>
          </div>
        </div>

        {/* Dataset info */}
        <div className="rounded-xl border border-slate-800 bg-navy-800/50 p-5 fade-in-up delay-1">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Dataset
            </span>
          </div>
          <div className="text-3xl font-display font-800 text-white">
            {result.rows?.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">rows analysed</p>
        </div>

        {/* Sensitive attributes */}
        <div className="rounded-xl border border-slate-800 bg-navy-800/50 p-5 fade-in-up delay-2">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Attributes Checked
            </span>
          </div>
          <div className="text-3xl font-display font-800 text-white">
            {(result.detected_sensitive_attributes || result.sensitive_attributes || []).length}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(result.detected_sensitive_attributes || result.sensitive_attributes || [])
              .slice(0, 4)
              .map((a) => (
                <span
                  key={a}
                  className="text-xs font-mono text-cyan-400/70 bg-cyan-500/10 px-1.5 py-0.5 rounded"
                >
                  {a}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* ── Recommendation ──────────────────────────────────────────────── */}
      {summary.recommendation && (
        <div
          className={`rounded-xl border p-5 ${rc.border} ${rc.bg} fade-in-up delay-2`}
        >
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
            Recommendation
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            {summary.recommendation}
          </p>
        </div>
      )}

      {/* ── Model Fairness Metrics ───────────────────────────────────────── */}
      {isModel && result.fairness_metrics && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-700 text-white text-lg">
              Fairness Metrics
            </h3>
          </div>

          {Object.entries(result.fairness_metrics).map(([attr, metrics]) => (
            <div key={attr} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-cyan-500 rounded-full" />
                <h4 className="font-mono text-sm text-cyan-300 font-medium">
                  Attribute:{" "}
                  <span className="text-white capitalize">{attr}</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Object.entries(metrics).map(([key, metric]) => (
                  <MetricCard key={key} metricKey={key} metric={metric} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SHAP Feature Importance ─────────────────────────────────────── */}
      {result.shap_feature_importance && (
        <ShapChart data={result.shap_feature_importance} />
      )}

      {/* ── Dataset Distribution Charts ──────────────────────────────────── */}
      {!isModel && result.dataset_stats && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-700 text-white text-lg">
              Distribution Analysis
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result.dataset_stats).map(([attr, stats]) => (
              <DistributionChart key={attr} attribute={attr} stats={stats} />
            ))}
          </div>
        </div>
      )}

      {/* ── Class distribution ───────────────────────────────────────────── */}
      {result.class_distribution &&
        Object.keys(result.class_distribution).length > 0 && (
          <div className="rounded-xl border border-slate-800 bg-navy-800/50 p-5">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
              Target Class Distribution
            </p>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(result.class_distribution).map(([cls, pct], i) => (
                <div key={cls} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: i === 0 ? "#06b6d4" : "#8b5cf6",
                    }}
                  />
                  <span className="text-sm font-mono text-slate-300">
                    {cls}:{" "}
                    <span className="text-white font-medium">
                      {(pct * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <div className="text-xs font-mono text-slate-600 text-center pb-6 border-t border-slate-900 pt-6">
        Metrics aligned with OECD AI Principles · EU AI Act · Google Responsible AI ·
        Thresholds: Parity/FNR/PP diff &gt; 0.10 flagged · Disparate Impact &lt; 0.80 flagged
      </div>
    </div>
  );
}
