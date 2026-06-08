import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCreditsStore } from "./credits";
import { getQueueStatus } from "@/lib/worker-api";

export function useCreditsSync() {
  const setCredits = useCreditsStore((state) => state.setCredits);
  const restoreFromStorage = useCreditsStore((state) => state.restoreFromStorage);
  const query = useQuery({
    queryKey: ["queue-status"],
    queryFn: getQueueStatus,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  // Restore persisted credits from localStorage on mount (client-side only)
  useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  useEffect(() => {
    if (query.data && Number.isFinite(query.data.remaining)) {
      setCredits(query.data.remaining, query.data.reset_in_seconds ?? 3600);
    }
  }, [query.data, setCredits]);

  return query;
}
