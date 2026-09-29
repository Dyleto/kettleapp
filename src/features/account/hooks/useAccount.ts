import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService } from '@/features/account/account.service';
import { queryKeys } from '@/shared/config/queryKeys';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { useAuth } from '@/shared/contexts/useAuth';

/** Le résumé du compte : les rôles portés, les coachs liés, ce qui est
 * partagé. Une seule requête, l'écran affichant tout d'un coup. */
export const useAccount = () =>
  useQuery({
    queryKey: queryKeys.account.get(),
    queryFn: accountService.get,
  });

/**
 * Enregistre la décision du client sur le partage de son ressenti.
 *
 * La réponse met à jour l'utilisateur en mémoire plutôt que de déclencher une
 * seconde requête : c'est elle qui lève la porte, et une porte qui reste
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

/**
 * La suppression du compte.
 *
 * Aucune invalidation de cache au succès : le rechargement complet qui suit
 * jette tout. L'invalider d'abord ferait repartir des requêtes vers une
 * session qui n'existe plus, donc une volée de 401 pendant la sortie.
 */
export const useDeleteAccount = () =>
  useMutation({
    mutationFn: accountService.remove,
    onSuccess: () => {
      // Le serveur a détruit la session. On repart de la page de connexion
      // par un rechargement complet : rien en mémoire ne doit survivre.
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
