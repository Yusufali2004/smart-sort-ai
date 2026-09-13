"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, SwitchCamera, AlertTriangle, RefreshCw, Check, Upload, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  onFallbackToUpload: () => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onFallbackToUpload, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Check for camera devices
  const checkDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length > 1) {
        setHasMultipleCameras(true);
      }
    } catch {
      // Ignore enumeration issues
    }
  }, []);

  // Stop camera tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      setIsInitializing(true);
      setError(null);

      // Stop previous stream
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Your browser does not support in-app camera access. Please use file upload instead.");
        setIsInitializing(false);
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play();
        }
        await checkDevices();
      } catch (err: any) {
        console.error("Camera access error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("Camera permission denied. Please allow camera permissions in your browser or switch to image upload.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("No camera device was detected on your system.");
        } else {
          setError(`Unable to start camera: ${err.message || "Unknown error"}. You can upload an image instead.`);
        }
      } finally {
        setIsInitializing(false);
      }
    },
    [stream, checkDevices]
  );

  useEffect(() => {
    startCamera(cameraFacing);
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacing]);

  // Switch facing mode
  const handleToggleFacing = () => {
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture snapshot
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video stream natural resolution
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedBlob(blob);
          setCapturedUrl(url);
          stopStream();
        }
      },
      "image/jpeg",
      0.92
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedBlob(null);
    setCapturedUrl(null);
    startCamera(cameraFacing);
  };

  // Confirm photo
  const handleConfirm = () => {
    if (capturedBlob && capturedUrl) {
      onCapture(capturedBlob, capturedUrl);
    }
  };

  // If permission error or device missing
  if (error) {
    return (
      <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-zinc-100 flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold mb-2">Camera Unavailable</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          {error}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            type="button"
            onClick={onFallbackToUpload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-900/30"
          >
            <Upload className="w-4 h-4" />
            Upload File Instead
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black border border-zinc-800 shadow-xl flex flex-col items-center justify-center min-h-[380px] max-h-[70vh]">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Video Feed (if not yet captured) */}
      {!capturedUrl && (
        <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[380px]">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover rounded-2xl max-h-[65vh]"
          />

          {/* Aiming Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-emerald-400/60 rounded-2xl flex items-center justify-center">
              <span className="text-[11px] font-medium text-emerald-300/80 bg-zinc-950/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                Align waste objects here
              </span>
            </div>
          </div>

          {/* Top Controls Overlay */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button
              type="button"
              onClick={() => {
                stopStream();
                onCancel();
              }}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
              aria-label="Close camera"
            >
              <X className="w-5 h-5" />
            </button>

            {hasMultipleCameras && (
              <button
                type="button"
                onClick={handleToggleFacing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md transition-colors"
                title="Switch Camera (Front/Rear)"
              >
                <SwitchCamera className="w-4 h-4" />
                <span>{cameraFacing === "environment" ? "Back" : "Front"}</span>
              </button>
            )}
          </div>

          {/* Shutter bar */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center z-10 px-4">
            <button
              type="button"
              onClick={handleSnap}
              disabled={isInitializing}
              className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border-4 border-white p-1 hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
              aria-label="Take picture"
            >
              <div className="w-full h-full rounded-full bg-white group-hover:bg-emerald-400 transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* Captured Image Preview */}
      {capturedUrl && (
        <div className="relative w-full h-full flex flex-col items-center justify-center min-h-[380px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capturedUrl}
            alt="Captured waste snapshot"
            className="w-full h-full object-cover rounded-2xl max-h-[60vh]"
          />

          {/* Bottom Confirmation Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3 z-10">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-medium text-sm backdrop-blur-md border border-zinc-700 transition-colors shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Retake
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Check className="w-4 h-4" />
              Use Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
