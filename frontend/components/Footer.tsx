"use client";

import React from "react";
import { Recycle } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 py-8 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white/40 dark:bg-zinc-950/40">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Recycle className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            SmartSort AI
          </span>
          <span>— FYP Intelligent Waste Sorting Assistant</span>
        </div>
        <p className="text-[11px] text-zinc-400">
          Powered by Google Gemini Vision &amp; FastAPI • Keep our planet clean 🌍
        </p>
      </div>
    </footer>
  );
}
