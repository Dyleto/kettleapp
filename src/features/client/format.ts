import { CompletedSession, Session } from '@/shared/types';
import { BlockType } from '@/shared/types';
import { getBlockLabel } from '@/features/program/constants';
import { getEffortLevel } from './constants';

/** « 3 blocs · 12 exercices » : ce qui tient sous le nom d'une séance dans
 * une liste, et qui dit son ampleur sans l'ouvrir. */
export const getSessionSummary = (session: Session): string => {
  const blockCount = session.blocks.length;
  const exerciseCount = session.blocks.reduce(
    (sum, b) => sum + b.exercises.length,
    0
  );
  return `${blockCount} bloc${blockCount > 1 ? 's' : ''} · ${exerciseCount} exercice${exerciseCount > 1 ? 's' : ''}`;
};

/** Les formats d'une séance, sans doublon : « Échauffement · AMRAP » dit ce
 * qui attend mieux que « 3 blocs ». */
export const getSessionBlockTypes = (session: Session): string => {
  const uniqueTypes = [...new Set(session.blocks.map((b) => b.type))];
  return uniqueTypes.map(getBlockLabel).join(' · ');
};

/** La même chose sur un instantané, dont le type de bloc est une chaîne
 * libre : un bilan ancien peut porter un format qui n'existe plus. */
export const getCompletedSessionBlockTypes = (
  completed: CompletedSession
): string => {
  const uniqueTypes = [...new Set(completed.blocks.map((b) => b.type))];
  return uniqueTypes.map((t) => getBlockLabel(t as BlockType)).join(' · ');
};

/**
 * Le mot que le client a choisi pour cette séance — « Juste », « Dure ».
 * `null` pour un bilan enregistré avant la refonte de l'échelle d'effort : la
 * question ne lui a jamais été posée, et on n'invente pas de réponse.
 */
export const getEffortSummary = (completed: CompletedSession) =>
  getEffortLevel(completed.feedback?.effort) ?? null;

/**
 * « Aujourd'hui », « Hier », puis la date.
 *
 * La comparaison se fait sur les jours et non sur les millisecondes : une
 * séance d'hier 23 h et une d'aujourd'hui 1 h sont à deux heures d'écart mais
 * pas le même jour, et c'est le jour qui se lit.
 */
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
