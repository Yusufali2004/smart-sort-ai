import { AnalyzeApiResponse, WasteAnalysisResult } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rawData?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Sends an image file or blob to the SmartSort AI backend for analysis.
 */
export async function analyzeWasteImage(
  imageBlob: Blob | File,
  fileName: string = "waste_snapshot.jpg"
): Promise<WasteAnalysisResult> {
  const formData = new FormData();

  if (imageBlob instanceof File) {
    formData.append("image", imageBlob, imageBlob.name);
    formData.append("file", imageBlob, imageBlob.name);
  } else {
    // If it's a blob from camera canvas
    formData.append("image", imageBlob, fileName);
    formData.append("file", imageBlob, fileName);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (netErr: any) {
    throw new ApiError(
      `Cannot connect to SmartSort AI backend at ${API_BASE_URL}. Ensure the FastAPI server is running on port 8000. (${netErr?.message || "Network Error"})`
    );
  }

  let jsonResult: any;
  try {
    jsonResult = await response.json();
  } catch (parseErr) {
    throw new ApiError(
      `Server returned an invalid response (status ${response.status}).`,
      response.status
    );
  }

  if (!response.ok || !jsonResult.success) {
    const errorMsg =
      jsonResult.detail ||
      jsonResult.error ||
      jsonResult.message ||
      `Analysis failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, jsonResult);
  }

  return jsonResult.data;
}

/**
 * Checks backend health status.
 */
export async function checkBackendHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    throw new Error(`Backend unavailable: ${err.message}`);
  }
}
