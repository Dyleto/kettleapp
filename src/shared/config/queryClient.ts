import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration globale de React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // La donnée est tenue pour fraîche pendant 5 minutes.
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Le cache est gardé 10 minutes.
      gcTime: 10 * 60 * 1000,

      // Retry 3 times on error.
      retry: 3,

      // Delay between retries (exponential).
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Relecture automatique au retour du focus sur la fenêtre.
      refetchOnWindowFocus: true,

      // Pas de relecture au montage quand la donnée est fraîche.
      refetchOnMount: true,
    },
    mutations: {
      // Deux reprises pour les mutations (POST/PUT/DELETE).
      retry: 2,
    },
  },
});
