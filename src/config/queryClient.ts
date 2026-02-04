import { QueryClient } from "@tanstack/react-query";

/**
 * Configuration globale de React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées "fraîches" pendant 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache conservé pendant 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry 3 fois en cas d'erreur
      retry: 3,

      // Délai entre les retries (exponentiel)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch automatique quand la fenêtre reprend le focus
      refetchOnWindowFocus: true,

      // Pas de refetch au mount si les données sont fraîches
      refetchOnMount: true,
    },
    mutations: {
      // Retry 2 fois pour les mutations (POST/PUT/DELETE)
      retry: 2,
    },
  },
});
