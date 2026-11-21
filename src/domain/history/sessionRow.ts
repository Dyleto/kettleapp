import type { CompletedSession, Session } from '@/shared/types';
import { sinceThen } from './journalDetail';

/**
 * Ce qu'une ligne de « Tes séances » dit à côté de sa date : « Julie a
 * répondu », « ancien bilan », « modifiée depuis », « corrigée le
 * 2 sept. ».
 *
 * L'ancienne carte écrivait les formats — « Échauffement · EMOM · AMRAP » —
 * et ouvrait sur « Voir le détail » : ce qu'il y avait à savoir avant
 * d'ouvrir ne se lisait nulle part. Une réponse du coach, surtout : elle
 * n'apparaissait qu'une fois la séance ouverte.
 *
 * « modifiée depuis » ne s'écrit que si la séance est encore au programme
 * et que son travail a changé : retirée, elle n'a plus rien à quoi se
 * comparer.
 */
export const sessionMentions = (
  completed: CompletedSession,
  sessions: readonly Session[]
): string[] => {
  const mentions: string[] = [];
  const last = completed.replies[completed.replies.length - 1];
  if (last) mentions.push(`${last.firstName} a répondu`);
  if (!completed.feedback && completed.metrics) mentions.push('ancien bilan');
  if (sinceThen(completed, sessions).state === 'changed')
    mentions.push('modifiée depuis');
  if (completed.editedAt)
    mentions.push(
      `corrigée le ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(completed.editedAt))}`
    );
  return mentions;
};
