"use client";

import React, { useState } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Recycle,
  HelpCircle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { CameraCapture } from "@/components/CameraCapture";
import { ImageUploader } from "@/components/ImageUploader";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { analyzeWasteImage } from "@/lib/api";
import { WasteAnalysisResult } from "@/lib/types";

type InputMode = "idle" | "camera" | "upload";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("idle");
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<WasteAnalysisResult | null>(null);

  // Handle capture from camera
  const handleCameraCapture = (blob: Blob, url: string) => {
    setSelectedFile(blob);
    setPreviewUrl(url);
    setMode("idle");
    setErrorMessage(null);
  };

  // Handle file selection from uploader
  const handleFileSelected = (file: File, url: string) => {
    setSelectedFile(file);
    setPreviewUrl(url);
    setMode("idle");
    setErrorMessage(null);
  };

  // Clear current image selection
  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setMode("idle");
  };

  // Reset entire flow
  const handleResetAll = () => {
    handleClearImage();
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  // Trigger Gemini Analysis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await analyzeWasteImage(selectedFile);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setErrorMessage(
        err.message ||
          "Could not complete analysis. Please verify your GEMINI_API_KEY in backend/.env."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load a quick sample image for desktop demo convenience
  const handleLoadSample = async (type: "mixed" | "bottles") => {
    try {
      setErrorMessage(null);
      // Create a canvas with labeled items as demo visual
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, 0, 640, 480);

      // Draw simulated items
      if (type === "mixed") {
        // Can 1
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(80, 160, 100, 180);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("ALUMINUM CAN", 85, 250);

        // Plastic Bottle
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(240, 120, 110, 220);
        ctx.fillStyle = "#0369a1";
        ctx.fillText("PLASTIC BOTTLE", 245, 230);

        // Glass bottle
        ctx.fillStyle = "#34d399";
        ctx.fillRect(410, 100, 120, 240);
        ctx.fillStyle = "#065f46";
        ctx.fillText("GLASS BOTTLE", 420, 220);
      } else {
        // 3 Plastic bottles
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(100, 140, 90, 200);
        ctx.fillRect(260, 140, 90, 200);
        ctx.fillRect(420, 140, 90, 200);
        ctx.fillStyle = "#0369a1";
        ctx.font = "bold 14px sans-serif";
        ctx.fillText("PET BOTTLE 1", 105, 240);
        ctx.fillText("PET BOTTLE 2", 265, 240);
        ctx.fillText("PET BOTTLE 3", 425, 240);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setSelectedFile(blob);
          setPreviewUrl(url);
          setMode("idle");
        }
      }, "image/jpeg", 0.9);
    } catch (e) {
      console.error("Failed to load sample:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Navigation & Status */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
        {/* If Results are Ready */}
        {analysisResult && (
          <ResultsDisplay
            result={analysisResult}
            previewUrl={previewUrl}
            onReset={handleResetAll}
          />
        )}

        {/* If Analyzing with Gemini Vision */}
        {isAnalyzing && (
          <div className="my-auto">
            <LoadingOverlay previewUrl={previewUrl} />
          </div>
        )}

        {/* Normal Input & Review Flow (when not analyzing and no results) */}
        {!analysisResult && !isAnalyzing && (
          <div className="space-y-6">
            {/* Hero Heading */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Multi-Object Intelligent Vision
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Snap your waste. <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Know where it goes.
                </span>
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                SmartSort AI identifies separate waste objects, counts quantities, detects recyclability, and provides instant municipal disposal guidance.
              </p>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Analysis Failed</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-xs font-medium underline text-red-600 dark:text-red-400 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Active Camera View */}
            {mode === "camera" && (
              <div className="animate-fadeIn">
                <CameraCapture
                  onCapture={handleCameraCapture}
                  onFallbackToUpload={() => setMode("upload")}
                  onCancel={() => setMode("idle")}
                />
              </div>
            )}

            {/* Active Upload View (when mode is upload or preview exists) */}
            {mode === "upload" && !previewUrl && (
              <div className="space-y-3 animate-fadeIn">
                <ImageUploader
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onFileSelected={handleFileSelected}
                  onClear={handleClearImage}
                />
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode("idle")}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                  >
                    Back to choices
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview Card (when photo is chosen/captured) */}
            {previewUrl && (
              <div className="space-y-4 animate-fadeIn">
                <div className="relative rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-xl max-h-[50vh] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Captured waste ready for analysis"
                    className="w-full h-full max-h-[48vh] object-contain"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-medium backdrop-blur-md transition-colors"
                    >
                      Retake / Change
                    </button>
                  </div>
                </div>

                {/* Big Action: Analyze Waste */}
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-xl shadow-emerald-900/30 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5"
                >
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  Analyze Waste with Gemini
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Idle Mode: Selection Triggers */}
            {mode === "idle" && !previewUrl && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Open Live Camera */}
                  <button
                    type="button"
                    onClick={() => setMode("camera")}
                    className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-emerald-500/30 hover:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8" />
                    </div>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Scan with Camera
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px]">
                      Capture waste directly using phone or webcam
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Open Camera &rarr;
                    </span>
                  </button>

                  {/* Option 2: Upload File */}
                  <button
                    type="button"
                    onClick={() => setMode("upload")}
                    className="group relative flex flex-col items-center justify-center p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 shadow-sm hover:shadow-md text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Upload Image
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[200px]">
                      Select JPG, PNG, or WEBP photo from gallery
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      Browse Files &rarr;
                    </span>
                  </button>
                </div>

                {/* Quick Desktop Samples */}
                <div className="pt-2">
                  <div className="p-4 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Testing on desktop without a camera? Load demo waste snapshot:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadSample("mixed")}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors"
                      >
                        Sample: Mixed Can + Plastic + Glass
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSample("bottles")}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors"
                      >
                        Sample: 3 Plastic Bottles
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-left">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Multi-Object Counting
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Distinguishes and tallies separate items rather than generic whole-scene tagging.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-left">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                      <Recycle className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      10 Standard Streams
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Sorted into Plastic, Paper, Cardboard, Glass, Metal, Biological, Battery, and more.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-left">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Conservative AI
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Realistic confidence scores with explicit guidance on overlapping or occluded objects.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 px-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>
          SmartSort AI &bull; Production-Quality Rapid MVP &bull; Powered by Google Gemini Vision
        </p>
        <p className="text-[11px] mt-1 text-zinc-400/80">
          AI estimates do not substitute for local municipal solid waste guidelines.
        </p>
      </footer>
    </div>
  );
}
