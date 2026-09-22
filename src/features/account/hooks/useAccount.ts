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
 * Records the client's decision about sharing how they felt.
 *
 * The response updates the user in memory rather than firing another request:
 * it is what lifts the gate, and a gate that stays shut for the length of a
 * round-trip is visible.
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
      // The server destroyed the session. We start again from the sign-in
      // page with a full reload: nothing in memory must survive.
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
