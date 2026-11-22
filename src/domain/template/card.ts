import type { TemplateRow } from '@/shared/types';

/**
 * La carte d'un modèle : ce qu'elle dit sous son nom, et comment elle
 * nomme ses séances.
 */

/** Combien de séances la carte montre : l'API n'en envoie pas plus. */
export const PREVIEW_SESSIONS = 4;

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/**
 * « 2 séances · utilisé chez 3 clients », « vide · jamais utilisé ».
 *
 * L'usage compte des clients, pas des imports — réimporter chez Sarah ne
 * fait pas un client de plus —, et il est indicatif : il ne dit pas si les
 * programmes importés ressemblent encore au modèle.
 */
export const templateMeta = (template: TemplateRow): string => {
  const size =
    template.sessionCount === 0
      ? 'vide'
      : plural(template.sessionCount, 'séance');
  const usage =
    template.usageCount === 0
      ? 'jamais utilisé'
      : `utilisé chez ${plural(template.usageCount, 'client')}`;
  return `${size} · ${usage}`;
};

/**
 * Le nom d'une séance sur la carte : « 1 · Full body A », ou « 2 · Séance
 * 2 » quand le coach ne l'a pas nommée — le rang seul, « 2 · », ne se
 * lirait pas.
 */
export const previewLabel = (session: TemplateRow['preview'][number]) =>
  `${session.order} · ${session.name?.trim() || `Séance ${session.order}`}`;

/** « + 2 séances » sous l'aperçu, ou rien quand tout est montré. */
export const moreSessions = (template: TemplateRow): string | null => {
  const rest =
    template.sessionCount - Math.min(PREVIEW_SESSIONS, template.preview.length);
  return rest > 0 ? `+ ${plural(rest, 'séance')}` : null;
};
