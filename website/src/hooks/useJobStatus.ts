import { useQuery } from "@tanstack/react-query";
import { JobStatus } from "@/types/job";
import { getProgressFromStatus } from "@/lib/mongodb";

interface JobStatusState {
  status: JobStatus | "unknown";
  progress: number;
  error?: string;
}

export function useJobStatus(jobId: string | null, intervalMs: number = 2000) {
  const query = useQuery({
    queryKey: ["job-status", jobId],
    enabled: !!jobId && jobId !== "direct",
    queryFn: async () => {
      const resp = await fetch(`/api/status/${jobId}`, { cache: "no-store" });
      if (!resp.ok) throw new Error(`Status check failed: ${resp.status}`);
      return resp.json();
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" || status === "error" ? false : intervalMs;
    },
  });

  if (jobId === "direct") return { status: "completed" as const, progress: 100 };
  if (!jobId) return { status: "unknown" as const, progress: 0 };

  const status = (query.data?.status || "unknown") as JobStatus | "unknown";
  // Progress is now derived from status instead of stored separately
  const progress = status !== "unknown" ? getProgressFromStatus(status) : 0;

  return {
    status,
    progress,
    error: query.data?.error,
  } satisfies JobStatusState;
}
