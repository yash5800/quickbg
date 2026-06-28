const WORKER_API_BASE = process.env.NEXT_PUBLIC_WORKER_API_URL?.replace(/\/+$/, "") || null;
const APP_API_BASE = "/api";
const WORKER_API_BASE_OR_FALLBACK = WORKER_API_BASE || APP_API_BASE;

export type JobStatus =
  | "queued"
  | "starting"
  | "running"
  | "uploading_result"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled"
  | "error";

export interface JobQueuedResponse {
  job_id: string;
  status: JobStatus;
  imageBlob?: Blob;
  remaining?: number;
  reset_in_seconds?: number;
}

export interface UploadSlotResponse {
  uploads_used: number;
  uploads_limit: number;
  remaining: number;
  retry_after?: number;
  reset_in_seconds?: number;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  error: string | null;
  queue_position?: number | null;
  estimated_wait_seconds?: number | null;
}

export interface QueueStatus {
  queue_length: number;
  running_jobs: number;
  uploads_used: number;
  uploads_limit: number;
  remaining: number;
  reset_in_seconds?: number;
}

export class WorkerApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "WorkerApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Consume one credit for `imageId`. Idempotent on the server — calling it twice
 * for the same imageId charges once. Throws WorkerApiError(403) when the hourly
 * limit is reached.
 */
export async function consumeCredit(imageId: string): Promise<UploadSlotResponse> {
  const response = await fetch(`${APP_API_BASE}/credits/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to consume credit" }));
    const message = error.message || error.detail || `HTTP ${response.status}`;
    throw new WorkerApiError(message, response.status, error);
  }

  return response.json();
}

/**
 * Refund the credit previously consumed for `imageId`. Idempotent — a no-op if
 * the image was never charged. Never throws on the "nothing to refund" case.
 */
export async function refundCredit(imageId: string): Promise<UploadSlotResponse> {
  const response = await fetch(`${APP_API_BASE}/credits/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageId }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to refund credit" }));
    const message = error.message || error.detail || `HTTP ${response.status}`;
    throw new WorkerApiError(message, response.status, error);
  }

  return response.json();
}

export async function uploadImage(file: File): Promise<JobQueuedResponse> {
  if (!WORKER_API_BASE) {
    throw new Error("NEXT_PUBLIC_WORKER_API_URL is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${WORKER_API_BASE}/remove`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    const message = error.message || error.detail || `HTTP ${response.status}`;
    throw new WorkerApiError(message, response.status, error);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("image")) {
    const blob = await response.blob();
    return {
      job_id: "direct",
      status: "completed",
      imageBlob: blob,
    };
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${WORKER_API_BASE_OR_FALLBACK}/status/${jobId}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }
  const data = await response.json();
  console.log("[Worker API] Job status:", jobId, data);
  return data;
}

export async function getJobResult(jobId: string): Promise<Blob> {
  const response = await fetch(`${WORKER_API_BASE_OR_FALLBACK}/result/${jobId}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Result retrieval failed: ${response.status}`);
  }
  return response.blob();
}

export async function getQueueStatus(): Promise<QueueStatus> {
  const response = await fetch(`${APP_API_BASE}/queue-status`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to get queue status");
  }
  return response.json();
}

export async function watchJobStatus(
  jobId: string,
  onProgress: (data: JobStatusResponse) => void,
  pollIntervalMs: number = 1500
): Promise<JobStatusResponse> {
  while (true) {
    const status = await getJobStatus(jobId);
    onProgress(status);

    if (
      status.status === "completed" ||
      status.status === "failed" ||
      status.status === "expired" ||
      status.status === "cancelled" ||
      status.status === "error"
    ) {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}
