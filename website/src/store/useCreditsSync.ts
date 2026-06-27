import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCreditsStore } from "./credits";
import { getQueueStatus } from "@/lib/worker-api";

export function useCreditsSync() {
  const restoreFromStorage = useCreditsStore((state) => state.restoreFromStorage);
  const setCredits = useCreditsStore((state) => state.setCredits);
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

  // Apply the authoritative server balance to the store whenever the query
  // resolves. Without this the badge sits on its default until the first upload.
  useEffect(() => {
    const data = query.data;
    if (!data || typeof data.remaining !== "number") {
      return;
    }
    setCredits(data.remaining, data.reset_in_seconds ?? 3600);
  }, [query.data, setCredits]);

  return query;
}
