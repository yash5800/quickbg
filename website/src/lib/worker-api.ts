/**
 * Worker API Client
 * Uses Next.js API routes to proxy requests to worker service
 */

const API_BASE = "/api";

async function createRequestHeaders(): Promise<Headers> {
  return new Headers();
}

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface JobQueuedResponse {
  job_id: string;
  status: JobStatus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageBlob?: any;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  error: null | string;
}

export interface JobResultResponse {
  image: Blob;
}

/**
 * Upload image and start processing (async mode)
 * Returns job_id for polling/WebSocket updates
 */
export async function submitImage(file: File): Promise<JobQueuedResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const headers = await createRequestHeaders();

  const response = await fetch(`${API_BASE}/remove-background`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload failed" }));
    const err = new Error(error.detail || error.message || `HTTP ${response.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).code = error.error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).retryAfter = error.retry_after;
    throw err;
  }

  // Handle direct image response
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("image")) {
    const blob = await response.blob();
    // Return mock job response when image is direct
    return { job_id: "direct", status: "completed", imageBlob: blob };
  }

  return response.json();
}

/**
 * Poll job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE}/status/${jobId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Status check failed" }));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get processed image result
 */
export async function getJobResult(jobId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/result/${jobId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Result retrieval failed" }));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.blob();
}

function getWorkerApiBase(): string {
  return process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000";
}

/**
 * Connect to WebSocket for live progress updates
 * Connects directly to worker WebSocket (not routed through Next.js API)
 */
export function connectProgressWebSocket(
  jobId: string,
  onMessage: (data: JobStatusResponse) => void,
  onError: (error: Error) => void,
  onClose: () => void
): () => void {
  const workerBase = process.env.NEXT_PUBLIC_WORKER_API_URL || "http://localhost:8000";
  const protocol = workerBase.startsWith("https") ? "wss" : "ws";
  const wsUrl = workerBase.replace(/^https?/, protocol) + `/ws/${jobId}`;

  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.error) {
        onError(new Error(data.error));
      } else {
        onMessage(data);
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error("WebSocket parse error"));
    }
  };

  ws.onerror = () => {
    onError(new Error("WebSocket connection error"));
  };

  ws.onclose = () => {
    onClose();
  };

  // Return cleanup function
  return () => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
}

/**
 * Subscribe to live job updates via SSE with polling fallback.
 */
export async function watchJobStatus(
  jobId: string,
  onProgress: (data: JobStatusResponse) => void,
  maxAttempts: number = 1000,
  pollIntervalMs: number = 1000
): Promise<JobStatusResponse> {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return pollJobStatus(jobId, onProgress, maxAttempts, pollIntervalMs);
  }

  const workerBase = getWorkerApiBase();
  const eventSource = new EventSource(`${workerBase}/events/${jobId}`);
  let settled = false;
  let fallbackTimer: number | undefined;
  let fallbackPromise: Promise<JobStatusResponse> | null = null;

  return new Promise<JobStatusResponse>((resolve, reject) => {
    const cleanup = () => {
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = undefined;
      }
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };

    const rejectOnce = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };

    const startPollingFallback = () => {
      if (settled || fallbackPromise) {
        return;
      }

      fallbackPromise = pollJobStatus(jobId, onProgress, maxAttempts, pollIntervalMs)
        .then((data) => {
          settled = true;
          cleanup();
          return data;
        })
        .catch((error) => {
          rejectOnce(error instanceof Error ? error : new Error("Polling fallback failed"));
          throw error;
        });
    };

    fallbackTimer = window.setTimeout(() => {
      startPollingFallback();
    }, 10000);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as JobStatusResponse;
        onProgress(data);

        if (data.status === "completed" || data.status === "failed") {
          settled = true;
          cleanup();
          resolve(data);
        }
      } catch (error) {
        rejectOnce(error instanceof Error ? error : new Error("SSE parse error"));
      }
    };

    eventSource.onerror = () => {
      startPollingFallback();
    };
  }).catch(() => pollJobStatus(jobId, onProgress, maxAttempts, pollIntervalMs));
}

/**
 * Convert image blob to data URL for preview
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Start polling for job status
 */
export async function pollJobStatus(
  jobId: string,
  onProgress: (data: JobStatusResponse) => void,
  maxAttempts: number = 1000,
  pollIntervalMs: number = 1000
): Promise<JobStatusResponse> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (attempts >= maxAttempts) {
          reject(new Error("Polling timeout"));
          return;
        }

        const status = await getJobStatus(jobId);
        onProgress(status);

        if (status.status === "completed" || status.status === "failed") {
          resolve(status);
        } else {
          attempts++;
          setTimeout(poll, pollIntervalMs);
        }
      } catch (err) {
        reject(err);
      }
    };

    poll();
  });
}

export interface QueueStatus {
  queue_length: number;
  running_jobs: number;
  batch_size?: number;
  max_concurrency?: number;
  uploads_used: number;
  uploads_limit: number;
  remaining: number;
  in_queue: number;
  completed: number;
}

/**
 * Get queue status
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  const headers = await createRequestHeaders();
  const response = await fetch(`${API_BASE}/queue-status`, {
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to get queue status");
  }

  return response.json();
}
