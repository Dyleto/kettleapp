/**
 * Retire les accents et les signes diacritiques : « é » devient « e ».
 *
 * Décomposition Unicode puis retrait des marques combinantes, plutôt qu'une
 * table de correspondance : la table oublie toujours un caractère, et celui
 * qu'elle oublie est celui du nom d'un client.
 */
export const stripAccents = (str: string): string =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * La forme d'une chaîne pour la comparer à ce qui est tapé.
 *
 * « developpe » doit trouver « Développé couché » : un coach tape vite, et sur
 * un clavier de téléphone un accent coûte un appui long.
 *
 * Vivait en cinq copies — la bibliothèque d'exercices, le sélecteur de
 * l'atelier, le choix en ligne, la liste des clients, et un hook jamais
 * importé — et elles avaient déjà divergé : celle du hook n'avait pas le
 * `.trim()`, donc un espace final y empêchait toute correspondance. Cinq
 * sources pour une règle, ce n'étaient pas cinq réglages à réaccorder.
 */
export const normalize = (str: string): string =>
  stripAccents(str).toLowerCase().trim();

export { formatCountdown, formatDuration } from './duration';
