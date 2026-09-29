import { toaster } from '@/shared/components/ui/toasterInstance';
import api from '@/shared/config/api';
import { queryKeys } from '@/shared/config/queryKeys';
import { Session } from '@/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Options {
  /**
   * L'atelier s'enregistre lui-même : il possède son propre état et n'a que
   * faire d'un message de confirmation à chaque frappe, ni d'une requête
   * d'arrière-plan qui remplacerait ce que le coach est en train d'écrire.
   */
  silent?: boolean;
}

/**
 * Envoie le programme entier au serveur.
 *
 * L'état complet et non une liste de modifications : ce qui n'y figure plus a
 * été supprimé. C'est ce qui rend l'envoi rejouable — deux envois identiques
 * donnent le même résultat — et c'est ce dont l'enregistrement automatique a
 * besoin, lui qui peut partir deux fois avant la première réponse.
 */
export const useUpdateProgramSessions = (
  clientId: string,
  { silent = false }: Options = {}
) => {
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
    onSuccess: () => {
      // En mode silencieux, l'appelant adopte lui-même la réponse :
      // invalider la fiche du client déclencherait une requête dont le seul
      // effet serait de réécrire l'atelier par-dessus la frappe en cours.
      if (!silent) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.coach.clients.detail(clientId),
        });
        toaster.create({ title: 'Programme sauvegardé', type: 'success' });
      }

      // Le programme tel que le client le voit, en revanche, a bien changé.
      queryClient.invalidateQueries({
        queryKey: queryKeys.client.program.get(),
      });
    },
    onError: () => {
      if (silent) return;
      toaster.create({
        title: 'Erreur lors de la sauvegarde du programme',
        type: 'error',
      });
    },
  });
};
