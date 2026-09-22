import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration globale de React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered "fresh" for 5 minutes.
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache kept for 10 minutes.
      gcTime: 10 * 60 * 1000,

      // Retry 3 times on error.
      retry: 3,

      // Delay between retries (exponential).
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Automatic refetch when the window regains focus.
      refetchOnWindowFocus: true,

      // No refetch on mount when the data is fresh.
      refetchOnMount: true,
    },
    mutations: {
      // Retry twice for mutations (POST/PUT/DELETE).
      retry: 2,
    },
  },
});
