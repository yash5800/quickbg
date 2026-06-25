import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCreditsStore } from "./credits";
import { getQueueStatus } from "@/lib/worker-api";

export function useCreditsSync() {
  const restoreFromStorage = useCreditsStore((state) => state.restoreFromStorage);
  const query = useQuery({
    queryKey: ["queue-status"],
    queryFn: getQueueStatus,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });

  // Restore persisted credits from localStorage on mount (client-side only)
  useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  return query;
}
