import type { SessionBlock } from '@/shared/types';
import type { GuidedSet } from '@/domain/session/sets';

/**
 * Ce qu'un chipper borné compte : des mouvements, pas des séries.
 *
 * Aujourd'hui le découpage n'en donne qu'une par mouvement — un chipper se
 * fait en une passe, le nombre de séries n'y compte pas. Le compte se fait
 * pourtant par mouvement et non par série : c'est ce que le coach lit,
 * « mouvement 3 sur 4 », et un mouvement qui recevrait un jour deux séries
 * ne serait fait qu'une fois les deux cochées.
 */

/** Les mouvements de la liste, dans l'ordre où on les fait. */
const movementOrders = (sets: readonly GuidedSet[]): number[] => [
  ...new Set(sets.map((set) => set.exerciseOrder)),
];

const isMovementDone = (
  sets: readonly GuidedSet[],
  done: readonly string[],
  exerciseOrder: number
): boolean =>
  sets
    .filter((set) => set.exerciseOrder === exerciseOrder)
    .every((set) => done.includes(set.key));

/** Combien de mouvements sont entièrement faits. */
export const movementsDone = (
  sets: readonly GuidedSet[],
  done: readonly string[]
): number =>
  movementOrders(sets).filter((order) => isMovementDone(sets, done, order))
    .length;

/**
 * Le mouvement en cours quand la limite tombe, compté à partir de 1 : le
 * premier qui n'est pas entièrement fait. C'est lui que la feuille propose ;
 * la personne le confirme ou le corrige.
 */
export const movementReached = (
  sets: readonly GuidedSet[],
  done: readonly string[]
): number => {
  const orders = movementOrders(sets);
  const index = orders.findIndex((order) => !isMovementDone(sets, done, order));
  return index === -1 ? orders.length : index + 1;
};

/**
 * Les séries faites une fois le mouvement atteint confirmé : tout ce qui le
 * précède est fait. Ce qui a été coché dans le mouvement atteint et après
 * reste tel quel — corriger le mouvement atteint ne doit pas effacer une
 * série notée.
 */
export const doneBefore = (
  sets: readonly GuidedSet[],
  done: readonly string[],
  movement: number
): string[] => {
  const before = new Set(movementOrders(sets).slice(0, movement - 1));
  const keys = sets
    .filter((set) => before.has(set.exerciseOrder))
    .map((set) => set.key);
  return [...done.filter((key) => !keys.includes(key)), ...keys];
};

/**
 * Une liste bornée : un chipper ou un TimeCap dont le coach a fixé la
 * limite. Sans limite, elle se coche comme n'importe quelle liste — pas de
 * chrono à lancer pour un temps que personne n'a demandé.
 */
export const isCappedList = (
  block: Pick<SessionBlock, 'type' | 'durationMinutes'>
): boolean =>
  (block.type === 'chipper' || block.type === 'timecap') &&
  !!block.durationMinutes;
