import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { coachService } from '@/features/coach/coach.service';
import { queryKeys } from '@/shared/config/queryKeys';
import type { CompletedSession, Inbox } from '@/shared/types';
import type { Reaction } from '@/domain/inbox/reply';

/** La séance telle que le serveur l'a rendue, à sa place dans les deux
 * listes : la réaction s'allume sous le doigt, sans recharger le fil. */
const replaceCompleted = (
  queryClient: QueryClient,
  completed: CompletedSession
) =>
  (['unread', 'read'] as const).forEach((state) =>
    queryClient.setQueryData<Inbox>(queryKeys.coach.inbox(state), (inbox) =>
      inbox
        ? {
            ...inbox,
            items: inbox.items.map((item) =>
              item.completed._id === completed._id
                ? { ...item, completed }
                : item
            ),
          }
        : inbox
    )
  );

/**
 * La séance rendue, à sa place dans l'historique d'un client déjà chargé.
 *
 * Les ressentis d'un client répondent avec la même pièce que le fil : sans
 * cela, la réponse partie n'apparaissait qu'au rechargement, et le coach
 * la croyait perdue. L'historique ne dit pas de quel client il est — la
 * séance non plus — : on le cherche dans chacun, il n'est que dans un.
 */
const replaceInHistories = (
  queryClient: QueryClient,
  completed: CompletedSession
) =>
  queryClient.setQueriesData<CompletedSession[]>(
    {
      queryKey: queryKeys.coach.clients.all(),
      predicate: (query) => query.queryKey.at(-1) === 'history',
    },
    (history) => history?.map((c) => (c._id === completed._id ? completed : c))
  );

/**
 * Ce qui change ailleurs quand une séance est lue : le fil, « Déjà lues »,
 * et les compteurs de la liste des clients.
 *
 * Périmés sans être rechargés (`refetchType: 'none'`) : la maquette veut que
 * la carte quitte le fil au prochain chargement, pas sous le doigt. Recharger
 * maintenant la ferait disparaître pendant qu'on la lit.
 */
const staleEverywhere = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({
    queryKey: [...queryKeys.coach.all, 'inbox'],
    refetchType: 'none',
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.coach.clients.all(),
    refetchType: 'none',
  });
};

/** Répondre à une séance — et, du même geste, l'avoir lue (D2). */
export const useReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      completedId,
      body,
    }: {
      completedId: string;
      body: { reaction?: Reaction | null; text?: string | null };
    }) => coachService.replyTo(completedId, body),
    onSuccess: (completed) => {
      replaceCompleted(queryClient, completed);
      replaceInHistories(queryClient, completed);
      staleEverywhere(queryClient);
    },
  });
};

/** Marquer lues, ou non lues — « Annuler » passe par le même chemin. */
export const useMarkViewed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, viewed }: { ids: string[]; viewed: boolean }) =>
      coachService.markViewed(ids, viewed),
    onSuccess: () => staleEverywhere(queryClient),
  });
};
