import { CompletedSession, Session } from '@/types';
import { BlockType } from '@/types';
import { getBlockLabel } from '@/features/program/constants';
import { getEffortLevel } from './constants';

export const getSessionSummary = (session: Session): string => {
  const blockCount = session.blocks.length;
  const exerciseCount = session.blocks.reduce(
    (sum, b) => sum + b.exercises.length,
    0
  );
  return `${blockCount} bloc${blockCount > 1 ? 's' : ''} · ${exerciseCount} exercice${exerciseCount > 1 ? 's' : ''}`;
};

export const getSessionBlockTypes = (session: Session): string => {
  const uniqueTypes = [...new Set(session.blocks.map((b) => b.type))];
  return uniqueTypes.map(getBlockLabel).join(' · ');
};

export const getCompletedSessionBlockTypes = (
  completed: CompletedSession
): string => {
  const uniqueTypes = [...new Set(completed.blocks.map((b) => b.type))];
  return uniqueTypes.map((t) => getBlockLabel(t as BlockType)).join(' · ');
};

/**
 * The word the client picked for this session — "Juste", "Dure".
 * `null` for a wrap-up recorded before the effort scale was reworked: the
 * question was never put to them, and we do not invent an answer.
 */
export const getEffortSummary = (completed: CompletedSession) =>
  getEffortLevel(completed.feedback?.effort) ?? null;

export const getRelativeDate = (date: Date | string): string => {
  const d = new Date(date);
  const today = new Date();
  const diffDays = Math.round(
    (new Date(today.toDateString()).getTime() -
      new Date(d.toDateString()).getTime()) /
      86400000
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays > 1 && diffDays < 7) return `Il y a ${diffDays} jours`;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(d);
};
