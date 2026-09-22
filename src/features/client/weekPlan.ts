import { CompletedSession, Session } from '@/types';
import { dayKey, mondayIndex, startOfWeek } from './sessionDates';

export interface WeekDayPlan {
  date: Date;
  /** "2026-09-07", the day's local key. */
  key: string;
  /** Lundi = 0. */
  index: number;
  /** What the client actually did that day. */
  done: CompletedSession[];
  /** What the coach suggests for that day, in programme order. */
  suggested: Session[];
}

/**
 * The current week, Monday to Sunday, crossing what is suggested with what is
 * done.
 *
 * Suggested days are stored on the session — a session declares "I am
 * generally done on Monday and Thursday". The week itself is stored nowhere:
 * we rebuild it here at display time. One source of truth, and deleting a
 * session never leaves a schedule to repair behind it.
 *
 * Nothing here computes lateness: a suggested day is a suggestion. A missed
 * Monday produces no state, it simply stays a Monday with no session.
 */
export const buildWeekPlan = (
  sessions: Session[],
  history: CompletedSession[],
  today: Date = new Date()
): WeekDayPlan[] => {
  const monday = startOfWeek(today);

  const doneByDay = new Map<string, CompletedSession[]>();
  history.forEach((completed) => {
    const key = dayKey(new Date(completed.completedAt));
    const list = doneByDay.get(key);
    if (list) list.push(completed);
    else doneByDay.set(key, [completed]);
  });

  const suggestedByIndex = new Map<number, Session[]>();
  [...sessions]
    .sort((a, b) => a.order - b.order)
    .forEach((session) => {
      new Set(session.suggestedDays ?? []).forEach((day) => {
        if (!Number.isInteger(day) || day < 0 || day > 6) return;
        const list = suggestedByIndex.get(day);
        if (list) list.push(session);
        else suggestedByIndex.set(day, [session]);
      });
    });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + index
    );
    const key = dayKey(date);
    return {
      date,
      key,
      index,
      done: doneByDay.get(key) ?? [],
      suggested: suggestedByIndex.get(index) ?? [],
    };
  });
};

/** Le programme conseille-t-il au moins un jour ? Sinon la semaine reste muette. */
export const hasSuggestedDays = (sessions: Session[]): boolean =>
  sessions.some((s) => (s.suggestedDays?.length ?? 0) > 0);

/**
 * The session suggested for today and not yet done today.
 *
 * That is all "advisory" allows: we highlight what is planned while it is not
 * done, and stay silent afterwards. No session missed yesterday surfaces
 * here.
 */
export const getSessionForToday = (
  sessions: Session[],
  history: CompletedSession[],
  today: Date = new Date()
): Session | undefined => {
  const index = mondayIndex(today);
  const key = dayKey(today);
  const doneToday = new Set(
    history
      .filter((c) => dayKey(new Date(c.completedAt)) === key)
      .map((c) => c.originalSessionId)
  );

  return [...sessions]
    .sort((a, b) => a.order - b.order)
    .find(
      (s) => (s.suggestedDays ?? []).includes(index) && !doneToday.has(s._id)
    );
};
