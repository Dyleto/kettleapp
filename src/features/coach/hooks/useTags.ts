import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import api from '@/shared/config/api';
import { queryKeys } from '@/shared/config/queryKeys';
import type { Client, Tag } from '@/shared/types';
import { tagKey } from '@/domain/clients/tags';

const sorted = (tags: readonly Tag[]) =>
  [...tags].sort((a, b) => tagKey(a.name).localeCompare(tagKey(b.name)));

/** Réécrit les étiquettes d'un client dans la liste en cache. */
const setClientTagIds = (
  queryClient: QueryClient,
  clientId: string,
  tagIds: string[]
) =>
  queryClient.setQueryData<Client[]>(queryKeys.coach.clients.lists(), (list) =>
    list?.map((c) => (c._id === clientId ? { ...c, tagIds } : c))
  );

/**
 * Les étiquettes du coach, rangées comme l'API les range.
 *
 * Un tableau toujours, même quand la réponse n'en est pas un : le serveur
 * d'essai répond `{}` à ce qu'il ne connaît pas, et un `.map` sur un objet
 * aurait vidé tout l'écran des clients pour une barre d'étiquettes.
 */
export const useTags = () =>
  useQuery({
    queryKey: queryKeys.coach.tags(),
    queryFn: async () => {
      const { data } = await api.get<Tag[]>('/api/coach/tags');
      return Array.isArray(data) ? data : [];
    },
  });

/**
 * Créer, renommer, supprimer une étiquette — et la poser sur un client.
 *
 * Chaque réponse réécrit le cache au lieu de recharger : la liste des
 * clients vient d'une seule requête, et la relire pour une étiquette ferait
 * clignoter toutes les lignes.
 */
export const useTagActions = () => {
  const queryClient = useQueryClient();
  const setTags = (update: (tags: Tag[]) => Tag[]) =>
    queryClient.setQueryData<Tag[]>(queryKeys.coach.tags(), (tags) =>
      sorted(update(tags ?? []))
    );

  const create = useMutation({
    mutationFn: async (name: string) =>
      (await api.post<Tag>('/api/coach/tags', { name })).data,
    onSuccess: (tag) => setTags((tags) => [...tags, tag]),
  });

  const rename = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) =>
      (await api.patch<Tag>(`/api/coach/tags/${id}`, { name })).data,
    onSuccess: (tag) =>
      setTags((tags) => tags.map((t) => (t._id === tag._id ? tag : t))),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/coach/tags/${id}`);
      return id;
    },
    // Les clients qui la portaient gardent son identifiant en cache : leurs
    // lignes et le panneau ne montrent que les étiquettes connues
    // (`visibleTags`), et l'API écarte un identifiant inconnu à la pose
    // suivante. Réécrire la liste ne changeait rien à l'écran — un
    // sabotage l'a montré.
    onSuccess: (id) => setTags((tags) => tags.filter((t) => t._id !== id)),
  });

  /**
   * Toutes les étiquettes d'un client à la fois, comme l'API les prend.
   * Posée tout de suite à l'écran, et rendue telle qu'avant si l'envoi
   * échoue : cocher une case ne doit pas attendre le réseau.
   */
  const setForClient = useMutation({
    mutationFn: async ({
      clientId,
      tagIds,
    }: {
      clientId: string;
      tagIds: string[];
      before: string[];
    }) =>
      (
        await api.put<{ tagIds: string[] }>(
          `/api/coach/clients/${clientId}/tags`,
          { tagIds }
        )
      ).data,
    onMutate: ({ clientId, tagIds }) =>
      setClientTagIds(queryClient, clientId, tagIds),
    onSuccess: ({ tagIds }, { clientId }) =>
      setClientTagIds(queryClient, clientId, tagIds),
    onError: (_error, { clientId, before }) =>
      setClientTagIds(queryClient, clientId, before),
  });

  return { create, rename, remove, setForClient };
};
