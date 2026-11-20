import type { BlockType, CompletedSession, PerformedSet } from '@/shared/types';
import { formatName } from '@/domain/session/dose';
import { formatWeight, heaviest } from './load';

/**
 * Les mouvements d'un client, passage après passage : ce que l'écran
 * Progrès montre en courbes, et ses records.
 *
 * L'ancien écran écrivait « Goblet Squat : 20 → 24 → 26 kg » dans une
 * colonne étroite, cinq points au plus, et mêlait charges, répétitions
 * totales et secondes. La maquette ne garde que les charges — une courbe
 * par mouvement, la plus lourde série de chaque passage — et nomme les
 * records : les mêmes que ceux fêtés en fin de séance (`bestLoads`).
 */

/** Un passage d'un mouvement : une séance faite, le format du bloc, les
 * séries notées, et la plus lourde. */
export interface MovementPassage {
  completedId: string;
  at: string;
  /** « EMOM », « Classique » : le format du bloc ce jour-là. */
  format: string;
  sets: PerformedSet[];
  load: number;
}

export interface Movement {
  exerciseId: string;
  name: string;
  /** Du plus ancien au plus récent. */
  passages: MovementPassage[];
  /** La plus lourde charge jamais notée. */
  best: number;
  /** Le passage qui l'a établie : le premier à l'atteindre. */
  recordId: string;
  /** Du premier passage au dernier : « + 6 kg ». */
  delta: number;
}

const idOf = (exercise: Record<string, unknown> | undefined) =>
  typeof exercise?._id === 'string' ? exercise._id : null;
const nameOf = (exercise: Record<string, unknown> | undefined) =>
  typeof exercise?.name === 'string' ? exercise.name : 'Exercice';

const chronological = (history: readonly CompletedSession[]) =>
  [...history].sort(
    (a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)
  );

/**
 * Les mouvements qui ont au moins une charge notée, le plus récemment
 * travaillé d'abord.
 *
 * Les charges seulement : un total de répétitions et une charge sur la même
 * courbe ne voudraient rien dire, et c'est la charge que le client vient
 * chercher — « combien je mets la prochaine fois ». À égalité de date — les
 * mouvements d'une même séance —, l'ordre de la séance : celui dans lequel
 * il les a faits.
 */
export const movementsOf = (
  history: readonly CompletedSession[]
): Movement[] => {
  const byId = new Map<string, Movement>();
  const rank = new Map<string, number>();
  let order = 0;
  for (const completed of chronological(history)) {
    const blocks = [...completed.blocks].sort((a, b) => a.order - b.order);
    for (const block of blocks)
      for (const entry of [...block.exercises].sort(
        (a, b) => a.order - b.order
      )) {
        const id = idOf(entry.exercise);
        const load = heaviest(entry.performed?.sets);
        if (!id || load === undefined) continue;
        const passage: MovementPassage = {
          completedId: completed._id,
          at: completed.completedAt,
          format: formatName(block.type as BlockType),
          sets: entry.performed?.sets ?? [],
          load,
        };
        const known = byId.get(id);
        if (!known)
          byId.set(id, {
            exerciseId: id,
            name: nameOf(entry.exercise),
            passages: [passage],
            best: load,
            recordId: completed._id,
            delta: 0,
          });
        else {
          known.name = nameOf(entry.exercise);
          known.passages.push(passage);
          if (load > known.best) {
            known.best = load;
            known.recordId = completed._id;
          }
        }
        rank.set(id, order++);
      }
  }
  return [...byId.values()]
    .map((m) => ({
      ...m,
      delta: m.passages[m.passages.length - 1].load - m.passages[0].load,
    }))
    .sort(
      (a, b) =>
        Date.parse(b.passages[b.passages.length - 1].at) -
          Date.parse(a.passages[a.passages.length - 1].at) ||
        // Même séance : l'ordre où il les a faits. Le rang retenu est
        // celui du dernier passage, qui est celui de cette séance.
        (rank.get(a.exerciseId) ?? 0) - (rank.get(b.exerciseId) ?? 0)
    );
};

/** « 22,5 kg » : la virgule française, jamais arrondi au kilo. */
export const loadLabel = (load: number): string => `${formatWeight(load)} kg`;

/**
 * « + 6 kg », « − 4 kg », « stable ».
 *
 * Le signe moins est un vrai moins (U+2212), et la baisse n'est pas une
 * alerte : la maquette la met en bleu, « sans jugement » — un client qui
 * allège après une douleur fait ce qu'il faut.
 */
export const deltaLabel = (delta: number): string =>
  delta === 0
    ? 'stable'
    : `${delta > 0 ? '+' : '−'} ${formatWeight(Math.abs(delta))} kg`;

/** Un record, en carte : sa valeur, ce qu'il récompense, et quand. */
export interface RecordCard {
  value: string;
  name: string;
  at: string;
  /** Le mouvement dont la carte ouvre la feuille ; absent pour un AMRAP. */
  exerciseId?: string;
}

/**
 * Les records, les plus récents d'abord, deux au plus.
 *
 * Deux sortes : la plus lourde charge d'un mouvement, et le plus de tours
 * bouclés dans un AMRAP — « 5 tours, AMRAP 12 min ». Un record se date au
 * passage qui l'a établi, pas au dernier qui l'a égalé : refaire 26 kg ne
 * rend pas le record plus neuf.
 *
 * Un AMRAP se reconnaît à sa séance et à sa place dans la séance : deux
 * AMRAP de 12 minutes dans deux séances sont deux records.
 */
export const recordCards = (
  history: readonly CompletedSession[],
  max = 2
): RecordCard[] => {
  const loads: RecordCard[] = movementsOf(history).map((m) => ({
    value: loadLabel(m.best),
    name: m.name,
    at: history.find((c) => c._id === m.recordId)!.completedAt,
    exerciseId: m.exerciseId,
  }));

  const rounds = new Map<string, { best: number; at: string; name: string }>();
  for (const completed of chronological(history))
    for (const block of completed.blocks) {
      if (block.type !== 'amrap' || block.performedRounds === undefined)
        continue;
      const key = `${completed.originalSessionId}:${block.order}`;
      const known = rounds.get(key);
      if (known && block.performedRounds <= known.best) continue;
      rounds.set(key, {
        best: block.performedRounds,
        at: completed.completedAt,
        name:
          block.label?.trim() ||
          `AMRAP${block.durationMinutes ? ` ${block.durationMinutes} min` : ''}`,
      });
    }
  const amraps: RecordCard[] = [...rounds.values()].map((r) => ({
    value: `${r.best} tour${r.best > 1 ? 's' : ''}`,
    name: r.name,
    at: r.at,
  }));

  return [...loads, ...amraps]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, max);
};

/** « 30 août » ; l'année quand ce n'est pas celle de `now`. */
export const passageDate = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
};
