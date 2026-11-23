import api from '@/shared/config/api';
import { queryKeys } from '@/shared/config/queryKeys';
import { Session } from '@/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Envoie le programme entier au serveur.
 *
 * L'état complet et non une liste de modifications : ce qui n'y figure plus a
 * été supprimé. C'est ce qui rend l'envoi rejouable — deux envois identiques
 * donnent le même résultat — et c'est ce dont l'enregistrement automatique a
 * besoin, lui qui peut partir deux fois avant la première réponse.
 */
export const useUpdateProgramSessions = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessions: Session[]) => {
      const formattedSessions = sessions.map((session, si) => ({
        _id: session._id,
        order: si + 1,
        name: session.name?.trim(),
        notes: session.notes?.trim(),
        suggestedDays: session.suggestedDays ?? [],
        blocks: session.blocks.map((block, bi) => ({
          // L'identifiant du bloc fait l'aller-retour : sans lui, l'API en
          // recréait un à chaque enregistrement et toute la séance se
          // reconstruisait à l'écran — insupportable quand on enregistre à
          // chaque modification.
          _id: block._id,
          // « Every » et EMOM nomment le même format depuis qu'un EMOM porte
          // son intervalle. Plutôt qu'une migration, la conversion se fait au
          // premier enregistrement : les deux ont exactement les mêmes champs
          // et le même rendu, elle passe donc inaperçue. La donnée converge
          // au rythme où le coach touche à ses séances.
          type: block.type === 'every' ? 'emom' : block.type,
          label: block.label || undefined,
          order: bi + 1,
          notes: block.notes?.trim(),
          durationMinutes: block.durationMinutes,
          intervalMinutes: block.intervalMinutes,
          rounds: block.rounds,
          restBetweenRounds: block.restBetweenRounds,
          workDuration: block.workDuration,
          restDuration: block.restDuration,
          repsScheme: block.repsScheme,
          exercises: block.exercises
            .filter((ex) => ex.exercise?._id)
            .map((ex, ei) => ({
              exerciseId: ex.exercise._id,
              order: ei + 1,
              sets: ex.sets,
              reps: ex.reps,
              duration: ex.duration,
              restBetweenSets: ex.restBetweenSets,
              customMetric: ex.customMetric,
              note: ex.note?.trim() || undefined,
            })),
        })),
      }));

      const { data } = await api.put<Session[]>(
        `/api/coach/clients/${clientId}/program/sessions`,
        { sessions: formattedSessions }
      );
      return data;
    },
    onSuccess: (saved) => {
      // L'atelier s'enregistre seul, à chaque modification : il adopte
      // lui-même la réponse, et aucun message ne l'annonce — c'est la règle
      // des enregistrements automatiques. Une option `silent` laissait
      // ouverte une autre branche, qui invalidait la fiche et disait
      // « Programme sauvegardé » ; aucun écran ne s'en servait plus.
      //
      // Ne pas invalider ne dispense pas de tenir le cache à jour, et
      // c'est ce qui manquait : il gardait le programme tel qu'il était au
      // chargement de la page, pendant que l'atelier et le serveur
      // avançaient sans lui.
      //
      // Retour du terrain : « quand ça me marque "enregistré", que je
      // quitte la page — par exemple pour aller dans la bibliothèque — et
      // que je reviens, tout ce que j'ai écrit dans les 5 min a disparu ».
      // Les 5 minutes sont le `staleTime` : en deçà, React Query ne relit
      // pas au montage, donc l'atelier se réinitialisait sur le cache
      // périmé. L'écran revenait en arrière, et comme l'envoi remplace le
      // programme entier, la modification suivante écrasait sur le serveur
      // ce que le coach croyait enregistré.
      //
      // `setQueryData` et non `invalidateQueries` : il met le cache au
      // niveau sans déclencher de requête, qui réécrirait l'atelier
      // par-dessus la frappe en cours. La réponse du serveur fait foi —
      // c'est elle qui porte les rangs et les identifiants définitifs.
      queryClient.setQueryData(
        queryKeys.coach.clients.detail(clientId),
        (previous: { program?: { sessions: Session[] } } | undefined) =>
          previous
            ? {
                ...previous,
                program: { ...previous.program, sessions: saved },
              }
            : previous
      );

      // Le programme tel que le client le voit, en revanche, a bien changé.
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.program.get(),
      });
    },
  });
};
