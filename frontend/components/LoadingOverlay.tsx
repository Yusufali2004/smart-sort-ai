"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Scan, BrainCircuit, CheckCircle2 } from "lucide-react";

interface LoadingOverlayProps {
  previewUrl: string | null;
}

const STEPS = [
  {
    title: "Uploading Image",
    desc: "Encrypting and transmitting image frame to analysis pipeline...",
    icon: Scan,
  },
  {
    title: "Gemini Vision Detection",
    desc: "Analyzing visual scene to identify multiple distinct waste items...",
    icon: BrainCircuit,
  },
  {
    title: "Stream Categorization",
    desc: "Formulating municipal stream rules and recycling disposal instructions...",
    icon: Sparkles,
  },
];

export function LoadingOverlay({ previewUrl }: LoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 1600);
    const timer2 = setTimeout(() => setCurrentStep(2), 3400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 text-white shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Image Preview with Laser Scanner */}
      {previewUrl && (
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Scanning image"
            className="w-full h-full object-cover filter brightness-90"
          />

          {/* Scanner Line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-line top-0" />

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98115_1px,transparent_1px),linear-gradient(to_bottom,#10b98115_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        </div>
      )}

      {/* Spinner & Main Status */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <h3 className="text-lg font-bold tracking-tight text-white">
          Analyzing Waste Objects...
        </h3>
      </div>

      <p className="text-xs text-zinc-400 max-w-sm text-center mb-8">
        Google Gemini Vision is scanning for bottles, cans, paper, biological waste, and packaging.
      </p>

      {/* Step Progress Indicators */}
      <div className="w-full max-w-sm space-y-3">
        {STEPS.map((step, idx) => {
          const isDone = currentStep > idx;
          const isActive = currentStep === idx;
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-zinc-800/90 border border-emerald-500/40"
                  : isDone
                  ? "bg-zinc-800/40 border border-transparent opacity-75"
                  : "bg-transparent border border-transparent opacity-40"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isDone
                    ? "bg-emerald-500 text-black"
                    : isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-zinc-200">
                  {step.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
