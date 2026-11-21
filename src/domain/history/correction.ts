import type {
  BlockExercise,
  BlockType,
  CompletedSession,
  Exercise,
  PerformedEntry,
  PerformedValues,
  Session,
} from '@/shared/types';
import { performedKey } from './lastPerformance';
import { sameSet, truncateAtFirstEmpty } from './performedFormat';

/**
 * Corriger une séance déjà envoyée : la rouvrir telle qu'elle était, et ne
 * renvoyer que ce qui a changé.
 *
 * Ces trois fonctions vivaient dans le tiroir du bilan, qui corrigeait sur
 * place. « Corriger » rouvre désormais les écrans de la fin de séance —
 * « Mes charges », puis le ressenti (F3b) —, qui attendent une séance et
 * des charges : la logique sort du composant, et se teste sans écran.
 */

/**
 * La séance telle qu'elle était ce jour-là, tirée de l'instantané du
 * bilan.
 *
 * C'est elle que « Mes charges » parcourt, et non la séance d'aujourd'hui :
 * le coach a pu la réécrire depuis, et corriger une charge sur un
 * mouvement qui n'y est plus n'aurait pas de sens. Les identifiants de
 * bloc sont fabriqués — un instantané n'en a pas —, stables par rang.
 */
export const snapshotSession = (completed: CompletedSession): Session => ({
  _id: completed.originalSessionId,
  order: completed.sessionOrder,
  name: completed.sessionName,
  createdAt: completed.completedAt,
  updatedAt: completed.completedAt,
  blocks: completed.blocks.map((block, index) => ({
    _id: `snap-${index}`,
    type: block.type as BlockType,
    label: block.label,
    order: block.order,
    notes: block.notes,
    durationMinutes: block.durationMinutes,
    intervalMinutes: block.intervalMinutes,
    rounds: block.rounds,
    restBetweenRounds: block.restBetweenRounds,
    workDuration: block.workDuration,
    restDuration: block.restDuration,
    repsScheme: block.repsScheme,
    exercises: block.exercises.map(
      (ex) =>
        ({
          exercise: ex.exercise as unknown as Exercise,
          order: ex.order,
          sets: ex.sets,
          restBetweenSets: ex.restBetweenSets,
          reps: ex.reps,
          duration: ex.duration,
          customMetric: ex.customMetric,
          note: ex.note,
        }) satisfies BlockExercise
    ),
  })),
});

/** Les charges notées, par mouvement, copiées : les modifier ne touche pas
 * au bilan en cache. */
export const recordedPerformed = (
  completed: CompletedSession
): Record<string, PerformedValues> => {
  const map: Record<string, PerformedValues> = {};
  completed.blocks.forEach((block) =>
    block.exercises.forEach((ex) => {
      if (ex.performed)
        map[performedKey(block.order, ex.order)] = {
          sets: (ex.performed.sets ?? []).map((set) => ({ ...set })),
        };
    })
  );
  return map;
};

/**
 * Les seuls mouvements dont les séries ont changé.
 *
 * La liste des séries d'un mouvement part entière : elle remplace celle qui
 * est enregistrée, et `[]` l'efface. C'est l'absence d'un mouvement dans le
 * corps qui veut dire « n'y touche pas » — d'où ce tri : renvoyer tout
 * réécrirait des séries que le client n'a pas regardées.
 *
 * Une série vide arrête la liste, comme à l'envoi : deux listes qui ne
 * diffèrent que par une série vide en queue sont les mêmes.
 */
export const changedPerformed = (
  original: Record<string, PerformedValues>,
  edited: Record<string, PerformedValues>
): PerformedEntry[] => {
  const entries: PerformedEntry[] = [];
  const keys = new Set([...Object.keys(original), ...Object.keys(edited)]);
  keys.forEach((key) => {
    const before = truncateAtFirstEmpty(original[key]?.sets ?? []);
    const after = truncateAtFirstEmpty(edited[key]?.sets ?? []);
    if (
      before.length === after.length &&
      before.every((set, i) => sameSet(set, after[i]))
    )
      return;
    const [blockOrder, exerciseOrder] = key.split(':').map(Number);
    entries.push({ blockOrder, exerciseOrder, sets: after });
  });
  return entries;
};
