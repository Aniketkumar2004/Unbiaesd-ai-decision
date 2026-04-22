import React from "react";
import { Scale, Github, ExternalLink } from "lucide-react";

export default function Header() {
  return (
    <header className="relative border-b border-slate-800 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-display font-700 text-white text-sm tracking-wide">
              Unbiased
            </span>
            <span className="font-display font-700 text-cyan-400 text-sm tracking-wide ml-1">
              AI Decision
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500 bg-navy-800 border border-slate-700 px-2 py-0.5 rounded-full ml-2">
            v1.0 MVP
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          <a
            href="https://github.com/yourhandle/unbiased-ai-decision"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://your-deck-link.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Deck</span>
          </a>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full">
            Google Solutions Challenge 2026
          </span>
        </nav>
      </div>
    </header>
  );
}
