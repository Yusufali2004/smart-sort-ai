"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  selectedFile: File | Blob | null;
  previewUrl: string | null;
  onFileSelected: (file: File, previewUrl: string) => void;
  onClear: () => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE_MB = 15;

export function ImageUploader({
  selectedFile,
  previewUrl,
  onFileSelected,
  onClear,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setValidationError(null);

    // Validate MIME type
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setValidationError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setValidationError(`Image exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
      return;
    }

    const url = URL.createObjectURL(file);
    onFileSelected(file, url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* If No Image is Selected: Dropzone */}
      {!previewUrl && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer w-full rounded-2xl border-2 border-dashed transition-all duration-200 p-8 sm:p-10 flex flex-col items-center justify-center text-center ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
              : "border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/80 hover:border-emerald-500/50"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Choose an image or drop it here
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
            Supports JPG, PNG, and WEBP files up to 15MB.
          </p>

          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors">
            <ImageIcon className="w-3.5 h-3.5" />
            Browse Files
          </span>
        </div>
      )}

      {/* If Image Preview is Active */}
      {previewUrl && (
        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Waste to analyze"
            className="w-full max-h-[50vh] sm:max-h-[60vh] object-contain mx-auto"
          />

          {/* Top Bar Info & Remove Button */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition-colors shadow-md"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedFile instanceof File && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-zinc-300">
              <span className="truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFile.name}
              </span>
              <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
        </div>
      )}

      {/* Validation Error Message */}
      {validationError && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
