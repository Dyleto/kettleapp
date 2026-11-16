import type { CompletedSession, Session } from '@/shared/types';
import { dayKey, mondayIndex, WEEKDAY_FULL } from './sessionDates';
import { countWord, doneInWeek, weekTarget } from './weekRing';
import { getSessionForToday } from './weekPlan';

/**
 * Ce que l'accueil met en avant : une seule réponse à « qu'est-ce que je
 * fais maintenant ? ».
 *
 * - `first` : aucune séance faite, jamais — la carte le dit, et explique ;
 * - `today` : une séance est conseillée aujourd'hui et pas encore faite ;
 * - `rest` : rien aujourd'hui, mais un jour conseillé reste cette semaine ;
 * - `full` : toutes les séances prévues de la semaine sont faites ;
 * - `next` : le reste du temps, la suivante du cycle.
 *
 * `next` couvre un cas que la maquette ne dessine pas : le dimanche d'une
 * semaine dont les jours conseillés sont passés sans séance. Dire « repos »
 * serait faux, la semaine n'est pas pleine ; dire « en retard » serait
 * contraire à tout le reste — un jour conseillé est un conseil. La prochaine
 * du cycle, sans commentaire.
 */
export type HomeFocus =
  | { kind: 'first' | 'today' | 'next'; session: Session }
  | { kind: 'rest'; session: Session; day: number; doneToday: boolean }
  | { kind: 'full' };

/** Le premier jour conseillé après aujourd'hui, cette semaine, et sa séance. */
const laterThisWeek = (
  sessions: readonly Session[],
  today: Date
): { day: number; session: Session } | undefined => {
  const now = mondayIndex(today);
  const ordered = [...sessions].sort((a, b) => a.order - b.order);
  for (let day = now + 1; day < 7; day++) {
    const session = ordered.find((s) => (s.suggestedDays ?? []).includes(day));
    if (session) return { day, session };
  }
  return undefined;
};

/**
 * Laquelle des cinq situations, dans cet ordre.
 *
 * La semaine pleine passe devant la séance du jour : quelqu'un qui a fait
 * ses trois séances en avance n'a plus rien à faire, même un jeudi
 * conseillé. Et la toute première fois passe devant tout, parce que c'est
 * la seule où il faut dire comment ça marche.
 */
export const homeFocus = (
  sessions: readonly Session[],
  history: readonly CompletedSession[],
  nextSession: Session,
  today: Date = new Date()
): HomeFocus => {
  if (history.length === 0) return { kind: 'first', session: nextSession };
  const target = weekTarget(sessions);
  if (target > 0 && doneInWeek(history, today) >= target)
    return { kind: 'full' };
  const suggested = getSessionForToday([...sessions], [...history], today);
  if (suggested) return { kind: 'today', session: suggested };
  const later = laterThisWeek(sessions, today);
  if (later) {
    const key = dayKey(today);
    return {
      kind: 'rest',
      ...later,
      doneToday: history.some((c) => dayKey(new Date(c.completedAt)) === key),
    };
  }
  return { kind: 'next', session: nextSession };
};

/** « jeudi », « jeudi et samedi », « lundi, jeudi et samedi ». */
const dayList = (days: readonly string[]): string =>
  days.length < 2
    ? (days[0] ?? '')
    : `${days.slice(0, -1).join(', ')} et ${days[days.length - 1]}`;

const capitalized = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** « Cinquième » : le rang d'une semaine dans la suite, jusqu'à dix. */
const ordinalWord = (n: number): string =>
  [
    '',
    'Première',
    'Deuxième',
    'Troisième',
    'Quatrième',
    'Cinquième',
    'Sixième',
    'Septième',
    'Huitième',
    'Neuvième',
    'Dixième',
  ][n] ?? `${n}e`;

/**
 * Ce que dit la carte de la semaine : un titre et une ligne.
 *
 * Les jours qui restent sont ceux qu'on peut encore faire — aujourd'hui
 * compris s'il est conseillé et pas encore fait. Un jour conseillé passé
 * sans séance ne se nomme pas : la maquette le veut « sans alerte », et le
 * taire est la seule façon de ne pas en faire une.
 */
export const weekWords = ({
  sessions,
  history,
  streak,
  coach = 'Ton coach',
  today = new Date(),
}: {
  sessions: readonly Session[];
  history: readonly CompletedSession[];
  streak: number;
  /** Le coach en tête de phrase : « Julie », ou « Ton coach ». */
  coach?: string;
  today?: Date;
}): { title: string; line: string } => {
  const target = weekTarget(sessions);
  const done = doneInWeek(history, today);
  const plural = (n: number) => (n > 1 ? 's' : '');
  if (target === 0)
    return {
      title:
        done === 0
          ? 'Aucune séance cette semaine'
          : `${capitalized(countWord(done))} séance${plural(done)} cette semaine`,
      line: `${coach} n'a pas fixé de jours : fais-les quand tu veux.`,
    };

  const planned = [
    ...new Set(sessions.flatMap((s) => s.suggestedDays ?? [])),
  ].sort((a, b) => a - b);
  if (done >= target) {
    const count =
      done > target
        ? `${capitalized(countWord(done))} séances pour ${countWord(target)} prévues.`
        : `${capitalized(countWord(done))} séance${plural(done)} sur ${countWord(target)}.`;
    return {
      title: 'Semaine pleine',
      line:
        streak >= 2
          ? `${count} ${ordinalWord(streak)} semaine de suite.`
          : count,
    };
  }
  if (done === 0 && history.length === 0)
    return {
      title: `${capitalized(countWord(target))} séance${plural(target)} cette semaine`,
      line: `${capitalized(dayList(planned.map((d) => WEEKDAY_FULL[d])))}.`,
    };

  const now = mondayIndex(today);
  const key = dayKey(today);
  const doneToday = history.some(
    (c) => dayKey(new Date(c.completedAt)) === key
  );
  const left = planned
    .filter((d) => d > now || (d === now && !doneToday))
    .map((d) => (d === now ? "aujourd'hui" : WEEKDAY_FULL[d]));
  return {
    title:
      done === 0
        ? `${capitalized(countWord(target))} séance${plural(target)} cette semaine`
        : `${capitalized(countWord(done))} séance${plural(done)} sur ${countWord(target)}`,
    line: left.length
      ? `Il te reste ${dayList(left)}.`
      : 'Plus de jour conseillé cette semaine.',
  };
};

/**
 * « Dimanche », « Hier », « 30 août » : le jour d'une séance passée, comme
 * on le dit.
 *
 * Le nom du jour tant qu'on est dans les six derniers : « il y a 4 jours »
 * obligeait à compter, « jeudi » se situe tout seul.
 */
export const pastDayLabel = (date: Date, today: Date = new Date()): string => {
  const days = Math.round(
    (new Date(today.toDateString()).getTime() -
      new Date(date.toDateString()).getTime()) /
      86400000
  );
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days > 1 && days < 7) {
    const name = WEEKDAY_FULL[mondayIndex(date)];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(date);
};
