"use client";

import React, { useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Info,
  PackageCheck,
} from "lucide-react";
import { WasteAnalysisResult, CATEGORY_DETAILS, WasteCategory } from "@/lib/types";

interface ResultsDisplayProps {
  result: WasteAnalysisResult;
  previewUrl: string | null;
  onReset: () => void;
}

export function ResultsDisplay({ result, previewUrl, onReset }: ResultsDisplayProps) {
  const { items, total_items, summary } = result;

  // Group summary by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of items) {
      counts[it.category] = (counts[it.category] || 0) + (it.quantity || 1);
    }
    return Object.entries(counts);
  }, [items]);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/20">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Scan Completed
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Scan Results
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              {summary || "AI vision detected individual waste items and generated sorting instructions."}
            </p>
          </div>

          {/* Total Items Hero Badge */}
          <div className="flex sm:flex-col items-center justify-between sm:justify-center bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3 sm:text-center min-w-[130px]">
            <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
              Total Items
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white">
              {total_items}
            </span>
          </div>
        </div>

        {/* Category Breakdown Chips */}
        {categoryCounts.length > 0 && (
          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-emerald-200/80 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Stream Breakdown:
            </span>
            {categoryCounts.map(([catKey, count]) => {
              const meta = CATEGORY_DETAILS[catKey as WasteCategory] || {
                label: catKey,
              };
              return (
                <span
                  key={catKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/20"
                >
                  <span className="capitalize">{meta.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-black/25 text-[11px]">
                    × {count}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Snapshot Thumbnail Preview if Available */}
      {previewUrl && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Scanned item thumbnail"
            className="w-16 h-16 rounded-xl object-cover border border-zinc-300 dark:border-zinc-700 shrink-0"
          />
          <div className="text-xs">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              Analyzed Image Frame
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
              Identified {items.length} unique waste groups ({total_items} objects total)
            </p>
          </div>
        </div>
      )}

      {/* Empty State: No Waste Identified */}
      {items.length === 0 && (
        <div className="text-center py-12 px-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500 mx-auto flex items-center justify-center mb-4">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            No Recognizable Waste Detected
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
            The AI vision assistant could not confidently identify any waste objects in this photo.
            Ensure items are well lit and fully in frame, or try snapping from a closer angle.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30"
          >
            <RotateCcw className="w-4 h-4" />
            Try Another Scan
          </button>
        </div>
      )}

      {/* Detailed Detected Items List */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Detected Objects</span>
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                ({items.length} distinct classifications)
              </span>
            </h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">
              Estimated by AI Vision
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, idx) => {
              const meta = CATEGORY_DETAILS[item.category] || {
                label: item.category,
                badgeBg: "bg-zinc-100 dark:bg-zinc-800",
                badgeText: "text-zinc-800 dark:text-zinc-200",
                borderColor: "border-zinc-300 dark:border-zinc-700",
                description: "",
              };

              const confidencePct = Math.round(item.confidence * 100);

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md ${meta.borderColor}`}
                >
                  {/* Card Header: Name & Quantity */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 capitalize">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Category Badge */}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.badgeBg} ${meta.badgeText}`}
                        >
                          {meta.label}
                        </span>

                        {/* Recyclability Badge */}
                        {item.recyclable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Recyclable
                          </span>
                        ) : item.category === "battery" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Special Disposal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            <XCircle className="w-3 h-3 text-zinc-500" />
                            Landfill Trash
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Pill */}
                    <div className="flex items-center justify-center min-w-[42px] h-[32px] px-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-extrabold text-sm shadow-sm">
                      × {item.quantity}
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                      <span>Detection Confidence</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {confidencePct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          confidencePct >= 85
                            ? "bg-emerald-500"
                            : confidencePct >= 65
                            ? "bg-teal-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Disposal Method Action Card */}
                  <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 block mb-0.5">
                      Disposal Instruction:
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {item.disposal_method}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Limitations Notice Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="font-semibold">AI Guidance &amp; Limitations Notice</p>
          <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
            AI vision analysis performs probabilistic object estimation. Tiny, occluded, or overlapping items may be merged or misidentified. This system does not claim physical pixel-level instance segmentation. Always observe municipal disposal symbols.
          </p>
        </div>
      </div>

      {/* Footer Action: Scan Another */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Another Waste Item
        </button>
      </div>
    </div>
  );
}
