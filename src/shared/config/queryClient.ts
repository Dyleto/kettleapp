import { QueryClient } from '@tanstack/react-query';

/**
 * Les réglages de React Query, à une seule adresse.
 *
 * Ce qui est écrit ici vaut pour toutes les requêtes de l'application :
 * un écran qui aurait besoin d'autre chose le dit sur sa requête, pas en
 * changeant ce fichier.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // La donnée est tenue pour fraîche pendant 5 minutes.
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Le cache est gardé 10 minutes.
      gcTime: 10 * 60 * 1000,

      // Trois tentatives : un réseau de salle de sport coupe souvent une
      // requête sans que rien ne soit en panne.
      retry: 3,

      // L'attente double à chaque tentative, plafonnée à 30 s : enchaîner
      // trois requêtes immédiates sur un réseau qui tombe n'aide pas.
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
