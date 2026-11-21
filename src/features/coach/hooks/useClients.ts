import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/config/api';
import type { Client } from '@/shared/types';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';

/** La liste des clients du coach. Chargée une fois : elle porte déjà les
 * compteurs de non-lus et la dernière note d'effort, que l'API calcule pour
 * éviter une requête par ligne. */
export const useClients = () => {
  return useQuery({
    queryKey: queryKeys.coach.clients.lists(),
    queryFn: coachService.getClients,
  });
};

/**
 * Retirer un client de son suivi.
 *
 * La ligne part de la liste en cache dès la réponse, sans recharger ; « À
 * lire » se recharge, puisque ses séances n'y ont plus leur place. Le
 * compte du client, lui, ne bouge pas : c'est le lien qui part (voir
 * `unlinkClient` côté API).
 */
export const useRemoveClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.delete(`/api/coach/clients/${clientId}`),
    onSuccess: (_response, clientId) => {
      queryClient.setQueryData<Client[]>(
        queryKeys.coach.clients.lists(),
        (list) => list?.filter((c) => c._id !== clientId)
      );
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.coach.all, 'inbox'],
      });
    },
  });
};
