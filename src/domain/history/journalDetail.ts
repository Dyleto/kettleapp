import type {
  BlockExerciseSnapshot,
  BlockSnapshot,
  BlockType,
  CompletedSession,
  Session,
} from '@/shared/types';
import { formatDuration } from '@/shared/utils/duration';
import {
  blockDefinesOwnMetrics,
  blockSupportsRepsOnly,
  blockSupportsSets,
} from '@/domain/session/blocks';
import { formatName } from '@/domain/session/dose';
import { formatPerformed } from './performedFormat';
import { heaviest } from './load';
import { sessionDose } from './sessionMatch';
import { blockResult } from './blockScore';

/**
 * Le détail d'une séance faite, côté coach : ce qui était prévu en face de
 * ce qui a été fait, et si le programme a bougé depuis.
 *
 * Le détail de l'ancien journal était celui du client — ses charges, sans
 * ce que le coach avait écrit en face. Or c'est l'écart qui se lit, et
 * l'instantané de la séance porte les deux : rien à demander à l'API.
 */

const NBSP = ' ';

/**
 * Ce qui était prescrit pour un exercice, sans le repos : « 4 × 12 reps »,
 * « 45 s », « 500 m ».
 *
 * `null` quand rien ne l'était, ou quand c'est le bloc qui porte la
 * mesure : les paliers d'une échelle sont sur le bloc, et sa ligne de score
 * les dit. Le repos est laissé à l'atelier : ici, on compare un travail à
 * un travail.
 */
export const plannedDose = (
  block: BlockSnapshot,
  exercise: BlockExerciseSnapshot
): string | null => {
  const type = block.type as BlockType;
  if (blockDefinesOwnMetrics(type)) return null;
  const sets = blockSupportsSets(type) ? (exercise.sets ?? 1) : 1;
  const work = exercise.reps
    ? `${exercise.reps}${NBSP}reps`
    : exercise.duration
      ? formatDuration(exercise.duration)
      : exercise.customMetric
        ? `${exercise.customMetric.value}${NBSP}${exercise.customMetric.unit}`
        : blockSupportsRepsOnly(type) && block.workDuration !== undefined
          ? formatDuration(block.workDuration)
          : null;
  if (!work) return null;
  return sets > 1 ? `${sets} × ${work}` : work;
};

/** Une ligne de « Ce qui a été fait ». */
export interface DoneLine {
  key: string;
  name: string;
  /** « prévu 4 × 12 reps », ou rien. */
  planned: string | null;
  done: string;
  /** Faux quand rien n'a été noté : la ligne se met en retrait, pour que
   * celles qui portent une charge se lisent d'abord. */
  noted: boolean;
  /** La charge dépasse celle du passage d'avant. */
  up: boolean;
}

/** Le passage d'avant : la même séance, faite juste avant celle-ci. */
export const previousPassage = (
  completed: CompletedSession,
  history: readonly CompletedSession[]
): CompletedSession | undefined =>
  history
    .filter(
      (c) =>
        c.originalSessionId === completed.originalSessionId &&
        Date.parse(c.completedAt) < Date.parse(completed.completedAt)
    )
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0];

/** La charge la plus lourde de chaque exercice d'un passage. */
const loadsOf = (completed: CompletedSession | undefined) => {
  const loads = new Map<string, number>();
  completed?.blocks.forEach((block) =>
    block.exercises.forEach((entry) => {
      const id = entry.exercise?._id;
      const load = heaviest(entry.performed?.sets);
      if (typeof id === 'string' && load !== undefined)
        loads.set(id, Math.max(loads.get(id) ?? 0, load));
    })
  );
  return loads;
};

/**
 * Ce qui a été fait, ligne à ligne : le prévu à gauche, le fait à droite,
 * et une flèche quand la charge passe celle d'avant.
 *
 * Le fait s'écrit comme partout ailleurs (`formatPerformed`), « 12 reps ·
 * 26 kg » : la maquette dit « 12 × 26 kg », mais deux écritures de la même
 * série finiraient par se contredire d'un écran à l'autre. Rien de noté :
 * « fait, sans charge notée » — l'exercice a eu lieu, c'est la charge qui
 * manque ; « fait » seul pour un exercice au temps ou à la distance, qui
 * n'a jamais eu de charge à noter.
 *
 * Un bloc qui se compte — AMRAP, chipper, échelle — a sa propre ligne, son
 * score ; ses mouvements n'en ont une que s'ils portent une charge notée,
 * sans quoi six « fait, sans charge notée » noieraient le seul nombre qui
 * compte.
 */
export const doneLines = (
  completed: CompletedSession,
  previous: CompletedSession | undefined
): DoneLine[] => {
  const before = loadsOf(previous);
  return [...completed.blocks]
    .sort((a, b) => a.order - b.order)
    .flatMap((block) => {
      const result = blockResult(block);
      const exercises = [...block.exercises]
        .sort((a, b) => a.order - b.order)
        .flatMap((entry): DoneLine[] => {
          const noted = formatPerformed(entry.performed);
          if (result && !noted) return [];
          const id = entry.exercise?._id;
          const name = entry.exercise?.name;
          const load = heaviest(entry.performed?.sets);
          const was = typeof id === 'string' ? before.get(id) : undefined;
          const planned = plannedDose(block, entry);
          return [
            {
              key: `${block.order}:${entry.order}`,
              name: typeof name === 'string' ? name : 'Exercice',
              planned: planned ? `prévu ${planned}` : null,
              done:
                noted ??
                (entry.duration ||
                entry.customMetric ||
                (blockSupportsRepsOnly(block.type as BlockType) && !entry.reps)
                  ? 'fait'
                  : 'fait, sans charge notée'),
              noted: noted !== null,
              up: load !== undefined && was !== undefined && load > was,
            },
          ];
        });
      if (!result) return exercises;
      const minutes = block.durationMinutes
        ? ` ${block.durationMinutes}${NBSP}min`
        : '';
      return [
        ...exercises,
        {
          key: `${block.order}:score`,
          name: `${block.label || formatName(block.type as BlockType)}${minutes}`,
          planned: null,
          done: result,
          noted: true,
          up: false,
        },
      ];
    });
};

/**
 * La séance a-t-elle changé depuis ce passage ?
 *
 * `changed` : le programme porte encore la séance, mais plus ce travail-là
 * — le « prévu » affiché est celui du jour où elle a été faite, et le coach
 * qui compare à ce qu'il a sous les yeux dans l'atelier doit le savoir.
 * `gone` : la séance n'est plus au programme, et « Ajuster la séance » n'a
 * plus où mener.
 */
export const sinceThen = (
  completed: CompletedSession,
  sessions: readonly Session[]
): { state: 'same' | 'changed'; session: Session } | { state: 'gone' } => {
  const session = sessions.find((s) => s._id === completed.originalSessionId);
  if (!session) return { state: 'gone' };
  return {
    state:
      sessionDose(session.blocks) === sessionDose(completed.blocks)
        ? 'same'
        : 'changed',
    session,
  };
};

/**
 * La date en tête du détail : « Dimanche 30 août », et l'année quand ce
 * n'est pas celle de `now`. En toutes lettres, parce qu'elle est seule et
 * qu'elle titre.
 */
export const detailDate = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso);
  const label = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};
