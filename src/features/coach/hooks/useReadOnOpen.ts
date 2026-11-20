import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CompletedSession } from '@/shared/types';
import { queryKeys } from '@/shared/config/queryKeys';
import { useMarkViewed } from './useInboxActions';

/**
 * Marquer lue la séance que le coach ouvre, et elle seule.
 *
 * L'ancien journal marquait tout l'historique lu dès son ouverture : un
 * coach venu relire une séance d'août effaçait sans le savoir les trois
 * arrivées depuis, qu'il ne retrouvait plus nulle part. La maquette le veut
 * séance par séance, par la route de « À lire ».
 *
 * L'historique en cache est corrigé au retour du serveur, pas avant : le
 * point ambre ne tombe que si la lecture est enregistrée. Une lecture qui
 * échoue le laisse — c'est la vérité, et il n'y a rien à dire de plus : le
 * coach a lu sa séance.
 */
export const useReadOnOpen = (clientId: string) => {
  const queryClient = useQueryClient();
  const { mutate } = useMarkViewed();
  return useCallback(
    (completed: CompletedSession) => {
      if (completed.viewedByCoach) return;
      mutate(
        { ids: [completed._id], viewed: true },
        {
          onSuccess: () =>
            queryClient.setQueryData<CompletedSession[]>(
              queryKeys.coach.clients.history(clientId),
              (history) =>
                history?.map((c) =>
                  c._id === completed._id ? { ...c, viewedByCoach: true } : c
                )
            ),
        }
      );
    },
    [clientId, mutate, queryClient]
  );
};
