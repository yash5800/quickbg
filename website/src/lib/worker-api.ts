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

export async function submitImage(file: File): Promise<JobQueuedResponse> {
  console.log("[submitImage] 📤 Starting upload:", file.name, `(${(file.size / 1024).toFixed(2)}KB)`);

  if (!WORKER_API_BASE) {
    throw new Error("NEXT_PUBLIC_WORKER_API_URL is not configured");
  }

  const reservationFormData = new FormData();
  reservationFormData.append("reserveOnly", "true");

  console.log("[submitImage] 🔐 Reserving upload slot via server...");
  const reservationResponse = await fetch(`${APP_API_BASE}/remove-background`, {
    method: "POST",
    body: reservationFormData,
  });

  if (!reservationResponse.ok) {
    const error = await reservationResponse.json().catch(() => ({ message: "Failed to reserve upload slot" }));
    const message = error.message || error.detail || `HTTP ${reservationResponse.status}`;
    console.error("[submitImage] ❌ Reservation failed:", message);
    throw new WorkerApiError(message, reservationResponse.status, error);
  }

  const reservation = await reservationResponse.json().catch(() => ({} as Partial<JobQueuedResponse>));
  console.log("[submitImage] ✅ Slot reserved. Credits remaining:", reservation.remaining);

  const formData = new FormData();
  formData.append("file", file);

  const workerUrl = `${WORKER_API_BASE}/remove`;
  console.log(`[submitImage] 📨 Uploading to WORKER at: ${workerUrl}`);
  const response = await fetch(workerUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    const message = error.message || error.detail || `HTTP ${response.status}`;
    console.error("[submitImage] ❌ Upload to worker failed:", message);
    throw new WorkerApiError(message, response.status, error);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("image")) {
    const blob = await response.blob();
    console.log(`[submitImage] ⚡ Result received immediately (synchronous processing): ${blob.size} bytes`);
    return {
      job_id: "direct",
      status: "completed",
      imageBlob: blob,
      remaining: reservation.remaining,
      reset_in_seconds: reservation.reset_in_seconds,
    };
  }

  const queuedResponse = await response.json();
  console.log(`[submitImage] ✅ Job queued with ID: ${queuedResponse.job_id}, Status: ${queuedResponse.status}`);
  return {
    ...queuedResponse,
    remaining: reservation.remaining,
    reset_in_seconds: reservation.reset_in_seconds,
  };
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const url = `${WORKER_API_BASE_OR_FALLBACK}/status/${jobId}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    console.error(`[getJobStatus] HTTP ${response.status} from ${url}`);
    throw new Error(`Status check failed: ${response.status}`);
  }
  const data = await response.json();
  console.log(`[getJobStatus] Job ${jobId}: ${data.status} (${data.progress}% complete, queue pos: ${data.queue_position ?? 'N/A'})`);
  return data;
}

export async function getJobResult(jobId: string): Promise<Blob> {
  const url = `${WORKER_API_BASE_OR_FALLBACK}/result/${jobId}`;
  console.log(`[getJobResult] Fetching result from: ${url}`);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    console.error(`[getJobResult] HTTP ${response.status} from ${url}`);
    throw new Error(`Result retrieval failed: ${response.status}`);
  }
  console.log(`[getJobResult] ✅ Received blob (${response.headers.get('content-length')} bytes) from ${url}`);
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
