import React, { useState } from "react";
import Header from "./components/Header.jsx";
import UploadSection from "./components/UploadSection.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { Scale, ArrowRight, Github, PlayCircle } from "lucide-react";

const METRICS = [
  { label: "Demographic Parity", description: "Equal positive prediction rates across groups" },
  { label: "Equalized Odds", description: "Equal TPR & FPR across groups" },
  { label: "Disparate Impact", description: "80% rule — legal compliance metric" },
  { label: "Predictive Parity", description: "Equal precision across groups" },
  { label: "FNR Difference", description: "Equal false negative rates across groups" },
];

export default function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />

      {!result ? (
        <>
          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section className="relative overflow-hidden">
            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }}
            />
            {/* Radial glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />

            <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-navy-800 border border-slate-700 rounded-full px-4 py-1.5 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-slate-400">
                  Google Solutions Challenge 2026
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-6xl font-800 text-white leading-tight mb-6">
                Detect Bias.
                <br />
                <span className="text-cyan-400">Ensure Fairness.</span>
                <br />
                Before It Harms.
              </h1>

              <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                Audit your datasets and ML models for hidden discrimination across gender,
                race, age, and more. Get actionable metrics and a PDF report — before
                deployment.
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={() => document.getElementById("audit").scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-navy-950 font-display font-700 px-6 py-3 rounded-xl transition-all glow-cyan text-sm"
                >
                  Start Auditing
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="https://youtu.be/your-demo-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-slate-700 text-slate-300 hover:border-slate-600 font-mono px-6 py-3 rounded-xl transition-all text-sm"
                >
                  <PlayCircle className="w-4 h-4" />
                  Watch Demo
                </a>
              </div>
            </div>
          </section>

          {/* ── Feature metrics strip ─────────────────────────────────────── */}
          <section className="border-y border-slate-800/60 bg-navy-900/30 py-6 overflow-hidden">
            <div className="max-w-5xl mx-auto px-6">
              <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
                {METRICS.map((m, i) => (
                  <div key={i} className="shrink-0 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <div>
                      <p className="text-xs font-display font-600 text-white whitespace-nowrap">
                        {m.label}
                      </p>
                      <p className="text-xs font-mono text-slate-500 whitespace-nowrap">
                        {m.description}
                      </p>
                    </div>
                    {i < METRICS.length - 1 && (
                      <div className="ml-4 w-px h-8 bg-slate-800 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Audit tool ────────────────────────────────────────────────── */}
          <section id="audit" className="max-w-5xl mx-auto px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl font-800 text-white mb-2">
                Run Your Bias Audit
              </h2>
              <p className="text-slate-500 text-sm">
                Upload a CSV dataset. Optionally add a trained model for full fairness
                metric computation.
              </p>
            </div>

            <div className="bg-navy-900/60 border border-slate-800 rounded-2xl p-8 glow-border">
              <UploadSection onResult={setResult} />
            </div>
          </section>

          {/* ── How it works ──────────────────────────────────────────────── */}
          <section className="max-w-5xl mx-auto px-6 pb-20">
            <h2 className="font-display text-xl font-700 text-white mb-8 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  title: "Upload & Detect",
                  body: "Upload your CSV. We auto-detect sensitive attributes like gender, race, and age — or specify your own.",
                  color: "text-cyan-400",
                },
                {
                  step: "02",
                  title: "Compute & Flag",
                  body: "We compute 5 industry-standard fairness metrics, flag violations, and explain which features drive predictions.",
                  color: "text-violet-400",
                },
                {
                  step: "03",
                  title: "Report & Fix",
                  body: "Download a PDF audit report with severity ratings, group breakdowns, and concrete mitigation steps.",
                  color: "text-amber-400",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-navy-800/50 border border-slate-800 rounded-xl p-6"
                >
                  <div className={`font-mono text-xs font-bold mb-3 ${card.color}`}>
                    {card.step}
                  </div>
                  <h3 className="font-display font-700 text-white text-sm mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <footer className="border-t border-slate-800 py-8">
            <div className="max-w-5xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400" />
                <span className="font-display text-sm font-600 text-slate-400">
                  Unbiased AI Decision
                </span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/yourhandle/unbiased-ai-decision"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub
                </a>
                <span className="text-xs font-mono text-slate-700">·</span>
                <span className="text-xs font-mono text-slate-600">
                  Google Solutions Challenge 2026
                </span>
              </div>
            </div>
          </footer>
        </>
      ) : (
        /* ── Results dashboard ────────────────────────────────────────────── */
        <main className="max-w-6xl mx-auto px-6 py-10">
          <Dashboard result={result} onReset={() => setResult(null)} />
        </main>
      )}
    </div>
  );
}
