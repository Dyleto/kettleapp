import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';
import { queryKeys } from '@/config/queryKeys';
import { toaster } from '@/components/ui/toasterInstance';
import { useAuth } from '@/contexts/useAuth';

export const useAccount = () =>
  useQuery({
    queryKey: queryKeys.account.get(),
    queryFn: accountService.get,
  });

/**
 * Enregistre la décision du client sur le partage de son ressenti.
 *
 * La réponse met à jour l'utilisateur en mémoire plutôt que de relancer une
 * requête : c'est elle qui lève la porte d'entrée, et une porte qui reste
 * fermée le temps d'un aller-retour se voit.
 */
export const useSetHealthConsent = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  return useMutation({
    mutationFn: accountService.setHealthConsent,
    onSuccess: (healthConsent) => {
      if (user) {
        setUser({ ...user, healthConsent, needsHealthConsent: false });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.account.get() });
    },
    onError: () => {
      toaster.create({
        title: "Impossible d'enregistrer ta réponse",
        description: 'Vérifie ta connexion et réessaie.',
        type: 'error',
      });
    },
  });
};

export const useDeleteAccount = () =>
  useMutation({
    mutationFn: accountService.remove,
    onSuccess: () => {
      // Le serveur a détruit la session. On repart de la page de connexion par
      // un rechargement complet : plus rien en mémoire ne doit survivre.
      window.location.href = '/login';
    },
    onError: () => {
      toaster.create({
        title: 'La suppression a échoué',
        description: 'Rien n’a été supprimé. Réessaie dans un moment.',
        type: 'error',
      });
    },
  });
