import { CompletedSession, PerformedValues } from '@/shared/types';
import { formatPerformedSets, truncateAtFirstEmpty } from './performedFormat';

/** Ce qu'on a mis la dernière fois sur un mouvement, avec la date à laquelle
 * c'était. */
export interface LastPerformance extends PerformedValues {
  completedAt: Date;
}

/**
 * L'adresse d'un exercice dans l'instantané d'une séance — « rang du bloc :
 * rang de l'exercice ». C'est exactement la clé qu'attend l'API pour ce qui a
 * été réalisé, et la seule utilisée côté front.
 */
export const performedKey = (blockOrder: number, exerciseOrder: number) =>
  `${blockOrder}:${exerciseOrder}`;

const exerciseIdOf = (exercise: Record<string, unknown>): string | null => {
  const id = exercise?._id;
  return typeof id === 'string' ? id : null;
};

const hasAnyValue = (p: PerformedValues) =>
  truncateAtFirstEmpty(p.sets ?? []).length > 0;

/**
 * Le dernier `performed` connu pour chaque exercice, toutes séances
 * confondues.
 *
 * Indexé par identifiant d'exercice et non par position : « combien j'ai mis
 * la dernière fois ? » porte sur le mouvement, pas sur la place qu'il
 * occupait ce jour-là dans la séance.
 *
 * Calculé entièrement depuis l'historique déjà chargé — aucune requête.
 */
export const buildLastPerformanceIndex = (
  history: CompletedSession[]
): Map<string, LastPerformance> => {
  const index = new Map<string, LastPerformance>();

  // Du plus ancien au plus récent : la dernière écriture gagne, donc chaque
  // exercice finit sur sa tentative la plus récente.
  const chronological = [...history].sort(
    (a, b) =>
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  chronological.forEach((completed) => {
    completed.blocks.forEach((block) => {
      block.exercises.forEach((ex) => {
        if (!ex.performed || !hasAnyValue(ex.performed)) return;
        const id = exerciseIdOf(ex.exercise);
        if (!id) return;
        index.set(id, {
          ...ex.performed,
          completedAt: new Date(completed.completedAt),
        });
      });
    });
  });

  return index;
};

/**
 * « 3 × 12 reps · 26 kg » — only the sets actually filled in, never a padding
 * zero. `null` when there is nothing to say.
 */
export const formatLastPerformance = (
  last: LastPerformance | undefined
): string | null => (last ? formatPerformedSets(last.sets ?? []) : null);
