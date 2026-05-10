const API_BASE = "/api";

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface JobQueuedResponse {
  job_id: string;
  status: JobStatus;
  imageBlob?: Blob;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  error: string | null;
}

export interface QueueStatus {
  queue_length: number;
  running_jobs: number;
  uploads_used: number;
  uploads_limit: number;
  remaining: number;
  reset_in_seconds?: number;
}

export async function submitImage(file: File): Promise<JobQueuedResponse> {
  console.log("[Worker API] submitImage called:", file.name, file.size);
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/remove-background`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("image")) {
    const blob = await response.blob();
    return { job_id: "direct", status: "completed", imageBlob: blob };
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE}/status/${jobId}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }
  const data = await response.json();
  console.log("[Worker API] Job status:", jobId, data);
  return data;
}

export async function getJobResult(jobId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/result/${jobId}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Result retrieval failed: ${response.status}`);
  }
  return response.blob();
}

export async function getQueueStatus(): Promise<QueueStatus> {
  const response = await fetch(`${API_BASE}/queue-status`, { cache: "no-store" });
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

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}