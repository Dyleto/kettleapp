import {
  blockSupportsRepsOnly,
  blockSupportsSets,
  blockDefinesOwnMetrics,
} from '@/features/program/constants';
import { BlockExercise, BlockType, SessionBlock } from '@/shared/types';
import { formatDuration } from './duration';

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

/**
 * La prescription d'un exercice, telle qu'elle s'affiche à droite de son nom.
 *
 * `block` est optionnel pour les appelants qui n'ont que le type, mais le
 * fournir change le rendu des blocs Tabata / On-Off : leur travail se définit
 * une fois pour tout le bloc (`workDuration`) et non sur chaque exercice.
 * Sans lui, ces lignes s'affichaient nues alors que le mode guidé montrait
 * « 20s » — la même donnée lue de deux façons selon l'écran.
 */
export const formatExerciseMetric = (
  ex: BlockExercise,
  blockType: BlockType,
  block?: Pick<SessionBlock, 'workDuration' | 'repsScheme'>
): string => {
  /*
   * Ce que la ligne demande, quand c'est le bloc qui le dit.
   *
   * Relevé de l'audit UX : une pyramide affichait « PYRAMIDE 2-4-6-8-6-4-2 »
   * puis « Goblet Squat » avec la colonne de droite VIDE — celle-là même que
   * le client balaye pour savoir ce qu'on lui demande. Avec un exercice on
   * devine ; avec trois, plus du tout.
   *
   * Ces blocs portent leurs paliers sur le bloc et non sur l'exercice
   * (`blockDefinesOwnMetrics`), la ligne n'avait donc rien à écrire. Elle
   * écrit maintenant la série, là où les autres écrivent « 15 reps ».
   */
  const steps =
    blockDefinesOwnMetrics(blockType) && block?.repsScheme?.length
      ? `${block.repsScheme.join('\u00B7')}\u00A0reps`
      : '';

  const fallback =
    steps ||
    (blockSupportsRepsOnly(blockType) && block?.workDuration !== undefined
      ? formatDuration(block.workDuration)
      : '');

  // Même règle que pour les durées : une espace insécable avant l'unité. Un
  // nombre séparé de sa lettre en fin de ligne se lit deux fois.
  const effort = ex.reps
    ? `${ex.reps}\u00A0reps`
    : ex.duration
      ? formatDuration(ex.duration)
      : ex.customMetric
        ? `${ex.customMetric.value}\u00A0${ex.customMetric.unit}`
        : fallback;

  if (!effort) return '';
  if (blockSupportsSets(blockType) && ex.sets && ex.sets > 1) {
    return `${ex.sets} × ${effort}`;
  }
  return effort;
};
