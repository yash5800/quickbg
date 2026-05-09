import { useEffect, useState, useRef } from "react";
import { JobStatus } from "@/types/job";

interface JobStatusState {
  status: JobStatus | "unknown";
  progress: number;
  error?: string;
}

export function useJobStatus(jobId: string | null, intervalMs: number = 2000) {
  const [state, setState] = useState<JobStatusState>({
    status: "unknown",
    progress: 0,
  });

  useEffect(() => {
    if (!jobId || jobId === "direct") {
      if (jobId === "direct") {
        setState({ status: "completed", progress: 100 });
      } else {
        setState({ status: "unknown", progress: 0 });
      }
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const resp = await fetch(`/api/status/${jobId}`, { cache: "no-store" });
        if (!resp.ok) return;
        
        const data = await resp.json();
        if (!isMounted) return;

        setState({
          status: data.status || "unknown",
          progress: data.progress ?? 0,
          error: data.error,
        });

        if (data.status === "completed" || data.status === "failed" || data.status === "error") {
          return; // Stop polling
        }

        timerId = setTimeout(checkStatus, intervalMs);
      } catch (err) {
        console.error("Status check error:", err);
        if (isMounted) {
            timerId = setTimeout(checkStatus, intervalMs);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [jobId, intervalMs]);

  return state;
}
