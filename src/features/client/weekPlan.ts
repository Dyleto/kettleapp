import { CompletedSession, Session } from '@/shared/types';
import { dayKey, mondayIndex, startOfWeek } from './sessionDates';

/** Un jour de la semaine : ce qui y est conseillé, et ce qui y a été
 * fait. */
export interface WeekDayPlan {
  date: Date;
  /** « 2026-09-07 », la clé locale du jour. */
  key: string;
  /** Lundi = 0. */
  index: number;
  /** Ce que le client a réellement fait ce jour-là. */
  done: CompletedSession[];
  /** Ce que le coach conseille ce jour-là, dans l'ordre du programme. */
  suggested: Session[];
}

/**
 * La semaine en cours, du lundi au dimanche, croisant ce qui est conseillé
 * avec ce qui est fait.
 *
 * Les jours conseillés sont portés par la séance — une séance déclare « on me
 * fait plutôt le lundi et le jeudi ». La semaine, elle, n'est enregistrée
 * nulle part : on la reconstruit ici, à l'affichage. Une seule source de
 * vérité, et supprimer une séance ne laisse jamais un agenda à réparer
 * derrière elle.
 *
 * Rien ici ne calcule de retard : un jour conseillé est un conseil. Un lundi
 * manqué ne produit aucun état, il reste simplement un lundi sans séance.
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
      // Aucune validation du jour, et ce n'est pas un oubli : la semaine ne
      // lit que les rangs 0 à 6, donc un -1, un 7 ou un 2,5 qui se glisserait
      // dans cette table n'en sortirait jamais. Le garde qui vivait ici était
      // invérifiable — le retirer ne faisait tomber aucun test, et pour une
      // bonne raison : il ne changeait rien d'observable.
      new Set(session.suggestedDays ?? []).forEach((day) => {
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
 * La séance conseillée aujourd'hui et pas encore faite aujourd'hui.
 *
 * C'est tout ce que « indicatif » autorise : on met en avant ce qui est prévu
 * tant que ce n'est pas fait, et l'on se tait ensuite. Aucune séance manquée
 * hier ne remonte ici.
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
