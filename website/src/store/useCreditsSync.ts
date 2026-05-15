import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCreditsStore } from "./credits";
import { getQueueStatus } from "@/lib/worker-api";

export function useCreditsSync() {
  const setCredits = useCreditsStore((state) => state.setCredits);
  const query = useQuery({
    queryKey: ["queue-status"],
    queryFn: getQueueStatus,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (query.data && Number.isFinite(query.data.remaining)) {
      setCredits(query.data.remaining, query.data.reset_in_seconds ?? 3600);
    }
  }, [query.data, setCredits]);

  return query;
}
