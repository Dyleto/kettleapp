import type { GuidedSet } from '@/domain/session/sets';

/**
 * Ce qu'une échelle décide, en fonctions pures : où l'on en est dans ses
 * paliers, ce qu'il faut cocher pour s'y recaler, et ce que le chrono dit à
 * la fin.
 *
 * Un palier est fait quand toutes ses séries le sont — une par mouvement :
 * « Palier fait » les coche ensemble, et c'est ce qu'il faut relire ici,
 * quel que soit l'ordre dans lequel elles l'ont été.
 */

/** Les séries d'un palier, compté à partir de 1. */
export const rungSets = (sets: readonly GuidedSet[], rung: number) =>
  sets.filter((set) => set.rank === rung);

/** Le nombre de paliers de l'échelle. */
export const rungCount = (sets: readonly GuidedSet[]): number =>
  sets.reduce((most, set) => Math.max(most, set.rank), 0);

/**
 * Les paliers entièrement faits, et celui en cours : le premier dont une
 * série reste à faire. `current` vaut `count + 1` quand tout est fait.
 *
 * Les paliers faits se comptent un à un et non comme un préfixe : toucher
 * une marche plus haut peut laisser un creux, et « 4 paliers faits » doit
 * rester vrai même alors.
 */
export const ladderState = (
  sets: readonly GuidedSet[],
  doneKeys: ReadonlySet<string>
): { count: number; done: number; current: number } => {
  const count = rungCount(sets);
  let done = 0;
  let current = count + 1;
  for (let rung = 1; rung <= count; rung++) {
    const all = rungSets(sets, rung).every((set) => doneKeys.has(set.key));
    if (all) done += 1;
    else if (current > count) current = rung;
  }
  return { count, done, current };
};

/**
 * Les séries cochées pour se recaler au palier `rung` : tout ce qui est
 * dessous fait, tout ce qui est au-dessus non. Les autres clés — celles
 * des autres blocs — sont gardées telles quelles.
 */
export const doneUpTo = (
  sets: readonly GuidedSet[],
  doneKeys: readonly string[],
  rung: number
): string[] => {
  const ours = new Set(sets.map((set) => set.key));
  const others = doneKeys.filter((key) => !ours.has(key));
  const below = sets.filter((set) => set.rank < rung).map((set) => set.key);
  return [...others, ...below];
};

/**
 * La hauteur d'une marche, en pour cent de la rangée : proportionnelle à
 * ses répétitions, jamais sous 28 % pour que le nombre écrit dedans tienne.
 */
export const stepHeight = (reps: number, highest: number): number =>
  highest > 0 ? Math.round(28 + (72 * reps) / highest) : 28;

/** « 2:18 » : des minutes et des secondes, sans zéro devant. */
export const minutesSeconds = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
