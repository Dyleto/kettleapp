import { MINIMUM_LOADING_TIME_IN_MS } from "@/config/constants";
import { useState, useCallback } from "react";

export const useMinimumLoading = (
  minimumTime: number = MINIMUM_LOADING_TIME_IN_MS
) => {
  const [loading, setLoading] = useState(false);

  const executeWithMinimumLoading = useCallback(
    async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
      const startTime = Date.now();
      setLoading(true);
      try {
        const result = await asyncFunction();

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumTime - elapsedTime);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        return result;
      } finally {
        setLoading(false);
      }
    },
    [minimumTime]
  );

  return { loading, executeWithMinimumLoading };
};
