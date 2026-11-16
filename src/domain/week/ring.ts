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
