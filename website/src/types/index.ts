export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  result?: string;
  error?: string;
}

export interface ProcessingStats {
  total: number;
  processing: number;
  completed: number;
  pending: number;
}