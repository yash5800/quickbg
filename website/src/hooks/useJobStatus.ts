import { useEffect, useState, useRef } from "react";
import { JobStatus } from "@/types/job";

interface JobStatusState {
  status: JobStatus | "unknown";
  progress: number;
  error?: string;
}

export function useJobStatus(jobId: string | null) {
  const [state, setState] = useState<JobStatusState>({
    status: "unknown",
    progress: 0,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) {
      setState({ status: "unknown", progress: 0 });
      return;
    }

    const eventSource = new EventSource(`/events/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState({
          status: data.status || "unknown",
          progress: data.progress ?? 0,
          error: data.error,
        });
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      // If the connection closes after terminal state, it's fine
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  return state;
}
