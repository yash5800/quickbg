export type JobStatus =
  | "queued"
  | "starting"
  | "running"
  | "uploading_result"
  | "completed"
  | "failed"
  | "expired"
  | "cancelled";

export interface JobRecord {
  job_id: string;
  status: JobStatus;
  progress: number;
  error?: string;
  // optional fields for UI display
  fileName?: string;
  createdAt?: string;
  clientKey?: string;
}