import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Cpu,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { auditDataset, auditModel } from "../api/client.js";

const SENSITIVE_SUGGESTIONS = [
  "gender", "age", "race", "ethnicity", "religion",
  "disability", "income", "education", "zipcode", "nationality",
];

export default function UploadSection({ onResult }) {
  const [step, setStep] = useState(1); // 1=dataset, 2=configure, 3=model
  const [csvFile, setCsvFile] = useState(null);
  const [modelFile, setModelFile] = useState(null);
  const [targetCol, setTargetCol] = useState("");
  const [sensitiveAttrs, setSensitiveAttrs] = useState("");
  const [predictionCol, setPredictionCol] = useState("");
  const [auditType, setAuditType] = useState("dataset"); // dataset | model
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const csvRef = useRef();
  const modelRef = useRef();

  const handleCsvDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f && f.name.endsWith(".csv")) {
      setCsvFile(f);
      setStep(2);
      setError("");
    } else {
      setError("Please upload a .csv file.");
    }
  };

  const addSuggestion = (kw) => {
    const parts = sensitiveAttrs.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.includes(kw)) {
      setSensitiveAttrs([...parts, kw].join(", "));
    }
  };

  const handleSubmit = async () => {
    if (!csvFile || !targetCol.trim()) {
      setError("Please provide a dataset file and target column name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let result;
      if (auditType === "dataset") {
        result = await auditDataset(csvFile, targetCol.trim(), sensitiveAttrs.trim());
      } else {
        if (!modelFile && !predictionCol.trim()) {
          setError("For model audit, upload a model file or specify a prediction column.");
          setLoading(false);
          return;
        }
        result = await auditModel(
          csvFile,
          targetCol.trim(),
          sensitiveAttrs.trim(),
          modelFile,
          predictionCol.trim()
        );
      }
      onResult(result);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || "Audit failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border transition-all ${
                step >= s
                  ? "bg-cyan-500 border-cyan-500 text-navy-950"
                  : "border-slate-700 text-slate-600"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-px transition-all ${
                  step > s ? "bg-cyan-500" : "bg-slate-800"
                }`}
              />
            )}
          </React.Fragment>
        ))}
        <div className="ml-2 text-xs font-mono text-slate-500">
          {step === 1 && "Upload dataset"}
          {step === 2 && "Configure audit"}
          {step === 3 && "Add model (optional)"}
        </div>
      </div>

      {/* Step 1: Upload CSV */}
      <div
        className={`mb-6 transition-all ${step >= 1 ? "opacity-100" : "opacity-40 pointer-events-none"}`}
      >
        <label className="block text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
          01 / Dataset File (CSV)
        </label>
        <div
          className={`drop-zone border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer ${
            dragging ? "active" : ""
          } ${csvFile ? "border-cyan-500/40 bg-cyan-500/5" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleCsvDrop}
          onClick={() => csvRef.current.click()}
        >
          <input
            ref={csvRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCsvDrop}
          />
          {csvFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="font-mono text-sm text-cyan-300">{csvFile.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setCsvFile(null); setStep(1); }}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Drop your CSV here or click to browse</p>
              <p className="text-slate-600 text-xs mt-1">Supports tabular datasets with headers</p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Configuration */}
      {step >= 2 && (
        <div className="mb-6 fade-in-up space-y-5">
          <label className="block text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
            02 / Configure
          </label>

          {/* Audit type toggle */}
          <div className="flex gap-3">
            {["dataset", "model"].map((t) => (
              <button
                key={t}
                onClick={() => { setAuditType(t); setStep(t === "model" ? 3 : 2); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-mono font-medium border transition-all ${
                  auditType === t
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                    : "border-slate-700 text-slate-500 hover:border-slate-600"
                }`}
              >
                {t === "dataset" ? "📊 Dataset Audit" : "🤖 Model Audit"}
              </button>
            ))}
          </div>

          {/* Target column */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Target / Label Column <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              placeholder="e.g. hired, approved, diagnosis"
              className="w-full bg-navy-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
          </div>

          {/* Sensitive attributes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Sensitive Attribute Columns{" "}
              <span className="text-slate-600">(comma-separated, blank = auto-detect)</span>
            </label>
            <input
              type="text"
              value={sensitiveAttrs}
              onChange={(e) => setSensitiveAttrs(e.target.value)}
              placeholder="e.g. gender, age, race"
              className="w-full bg-navy-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SENSITIVE_SUGGESTIONS.map((kw) => (
                <button
                  key={kw}
                  onClick={() => addSuggestion(kw)}
                  className="text-xs font-mono text-slate-500 bg-navy-800 border border-slate-700 px-2 py-0.5 rounded hover:border-cyan-500/40 hover:text-cyan-400 transition-all"
                >
                  + {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Model upload (optional) */}
      {step >= 3 && auditType === "model" && (
        <div className="mb-6 fade-in-up space-y-4">
          <label className="block text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
            03 / Model File (optional)
          </label>

          <div
            className={`drop-zone border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer ${
              modelFile ? "border-cyan-500/40 bg-cyan-500/5" : ""
            }`}
            onClick={() => modelRef.current.click()}
          >
            <input
              ref={modelRef}
              type="file"
              accept=".pkl,.pickle"
              className="hidden"
              onChange={(e) => setModelFile(e.target.files?.[0] || null)}
            />
            {modelFile ? (
              <div className="flex items-center justify-center gap-3">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span className="font-mono text-sm text-cyan-300">{modelFile.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setModelFile(null); }}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Cpu className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Upload pickled sklearn model (.pkl)</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="font-mono">OR use prediction column</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <input
            type="text"
            value={predictionCol}
            onChange={(e) => setPredictionCol(e.target.value)}
            placeholder="Column name containing pre-computed predictions"
            className="w-full bg-navy-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 text-sm fade-in-up">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      {step >= 2 && (
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-navy-950 font-display font-700 py-3.5 rounded-xl transition-all text-sm tracking-wide glow-cyan"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running audit…
            </>
          ) : (
            <>
              Run Bias Audit
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
