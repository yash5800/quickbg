import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCreditsStore } from "./credits";
import { getQueueStatus } from "@/lib/worker-api";

/**
 * Keeps the display store in sync with the authoritative server balance.
 * `/api/queue-status` is polled on mount, on an interval, and on window focus —
 * there is no local cache or persistence, so the badge always reflects the
 * server. The service worker never caches `/api/*`, so each fetch is fresh.
 */
export function useCreditsSync() {
  const setFromServer = useCreditsStore((state) => state.setFromServer);
  const query = useQuery({
    queryKey: ["queue-status"],
    queryFn: getQueueStatus,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  // Apply the authoritative server balance whenever the query resolves.
  useEffect(() => {
    const data = query.data;
    if (!data || typeof data.remaining !== "number") {
      return;
    }
    setFromServer(data.remaining, data.reset_in_seconds ?? 3600);
  }, [query.data, setFromServer]);

  return query;
}
