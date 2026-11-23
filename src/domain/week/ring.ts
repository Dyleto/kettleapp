import type { CompletedSession, Session } from '@/shared/types';
import { dayKey, startOfWeek } from '@/domain/week/dates';

/**
 * La semaine en chiffres : combien de séances le coach conseille, combien
 * sont faites, et depuis combien de semaines le client tient le rythme.
 *
 * Écrit une fois pour l'écran de fin et pour l'accueil : la maquette veut
 * les mêmes calculs aux deux endroits, et deux écritures auraient fini par
 * annoncer deux semaines différentes au même client.
 */

/**
 * Le nombre de séances que la semaine attend : les jours conseillés
 * distincts du programme.
 *
 * Distincts parce que deux séances conseillées le lundi se font l'une ou
 * l'autre ce jour-là — c'est ainsi que le coach les a posées. Zéro quand
 * aucun jour n'est conseillé : la semaine n'a alors pas d'objectif, et
 * l'écran n'en invente pas.
 */
export const weekTarget = (sessions: readonly Session[]): number =>
  new Set(sessions.flatMap((session) => session.suggestedDays ?? [])).size;

const weekOf = (date: Date): string => dayKey(startOfWeek(date));

/**
 * L'anneau de l'accueil tel que la personne l'a vu la dernière fois : sa
 * semaine — le lundi — et sa part remplie.
 */
export interface SeenRing {
  week: string;
  part: number;
}

/** La semaine de `date`, telle que `SeenRing` la retient. */
export const weekKey = (date: Date): string => weekOf(date);

/**
 * D'où l'anneau de l'accueil part : de ce qu'il montrait la dernière fois,
 * si c'était cette semaine et que ça a changé depuis.
 *
 * Il ne se remplit qu'en ce cas. À chaque ouverture, il aurait raconté la
 * même séance — une animation qui se répète ne dit plus rien. Une autre
 * semaine repart de son propre compte, sans rien animer : un anneau qui se
 * viderait le lundi raconterait une perte qui n'en est pas une.
 *
 * Il peut aussi redescendre, si le coach a ajouté un jour conseillé : c'est
 * ce qui a changé, et l'anneau le montre plutôt que de sauter.
 */
export const ringStart = (
  seen: SeenRing | null,
  now: SeenRing
): number | undefined =>
  seen && seen.week === now.week && Math.abs(seen.part - now.part) > 1e-6
    ? Math.max(0, Math.min(1, seen.part))
    : undefined;

/**
 * Relire la mémoire de l'anneau. Elle vient du stockage de l'appareil : une
 * version passée, une main qui l'a modifiée — ce qui n'a pas la forme
 * attendue vaut l'absence, et l'anneau ne s'anime pas.
 */
export const parseSeenRing = (raw: string | null): SeenRing | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as SeenRing).week === 'string' &&
      typeof (value as SeenRing).part === 'number' &&
      Number.isFinite((value as SeenRing).part)
    )
      return {
        week: (value as SeenRing).week,
        part: (value as SeenRing).part,
      };
  } catch {
    // Illisible : comme s'il n'y avait rien.
  }
  return null;
};

/** Les séances faites dans la semaine de `today`, lundi compris. */
export const doneInWeek = (
  history: readonly Pick<CompletedSession, 'completedAt'>[],
  today: Date = new Date()
): number => {
  const week = weekOf(today);
  return history.filter((c) => weekOf(new Date(c.completedAt)) === week).length;
};

/**
 * Les semaines consécutives tenues : toutes les séances prévues faites, ou
 * au moins une quand rien n'est prévu.
 *
 * La semaine en cours ne casse pas la suite tant qu'elle n'est pas finie :
 * un mardi, elle n'est pas encore pleine, et dire « 0 semaine » à qui en
 * tient quatre serait faux. Elle s'ajoute dès qu'elle est pleine.
 */
export const weekStreak = (
  history: readonly Pick<CompletedSession, 'completedAt'>[],
  target: number,
  today: Date = new Date()
): number => {
  const counts = new Map<string, number>();
  history.forEach((c) => {
    const week = weekOf(new Date(c.completedAt));
    counts.set(week, (counts.get(week) ?? 0) + 1);
  });
  const full = (monday: Date) =>
    (counts.get(dayKey(monday)) ?? 0) >= Math.max(1, target);
  const before = (monday: Date) =>
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7);

  let monday = startOfWeek(today);
  if (!full(monday)) monday = before(monday);
  let streak = 0;
  while (full(monday)) {
    streak += 1;
    monday = before(monday);
  }
  return streak;
};

/** « deux », « trois » : un compte qui se lit, jusqu'à dix. */
export const countWord = (n: number): string =>
  [
    'zéro',
    'une',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
  ][n] ?? String(n);

/** Les jours de la semaine de `today` où une séance a été faite. Lundi = 0. */
export const daysDone = (
  history: readonly Pick<CompletedSession, 'completedAt'>[],
  today: Date = new Date()
): Set<number> => {
  const week = weekOf(today);
  const days = new Set<number>();
  history.forEach((c) => {
    const date = new Date(c.completedAt);
    if (weekOf(date) === week) days.add((date.getDay() + 6) % 7);
  });
  return days;
};

/** Les jours que le programme conseille. Lundi = 0. */
export const plannedDays = (sessions: readonly Session[]): Set<number> =>
  new Set(sessions.flatMap((session) => session.suggestedDays ?? []));
