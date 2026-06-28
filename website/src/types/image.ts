  export type ImageWaitingReason = "credits_exhausted" | "queue_full";

export interface ImageItem {
  id: string;
  file: File;
  preview: string;
  /** True once a credit has been consumed for this image (idempotency guard). */
  charged?: boolean;
  /** @deprecated legacy reserve/release flag; retained for persisted state compat. */
  creditReserved?: boolean;
  status:
    | "pending"
    | "uploading"
    | "queued"
    | "running"
    | "processing"
    | "completed"
    | "failed"
    | "error";
  result?: string;
  error?: string;
  startTime?: number;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  jobId?: string;
  progress?: number;
  queuePosition?: number | null;
  estimatedWaitSeconds?: number | null;
  waitingReason?: ImageWaitingReason | null;
  creditResetAt?: number | null;
  queueRetryAt?: number | null;
  terminalAt?: number | null;
}
