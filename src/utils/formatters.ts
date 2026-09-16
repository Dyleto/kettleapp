import {
  blockSupportsRepsOnly,
  blockSupportsSets,
} from '@/features/program/constants';
import { BlockExercise, BlockType, SessionBlock } from '@/types';

/**
 * Retire les accents et diacritiques d'une chaîne (é→e, à→a, ç→c…)
 */
export const stripAccents = (str: string): string =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Formate une durée en secondes en format lisible (ex: 1h30, 45min, 30s)
 * @param seconds Durée en secondes
 * @returns Durée formatée
 */
/**
 * Un décompte qui tourne, pas une durée prescrite.
 *
 * Délibérément distinct de `formatDuration` : celui-ci écrit « 2min » parce
 * qu'il décrit une consigne qu'on lit au calme. Un chronomètre en salle
 * répond à « il me reste combien », et « 119s » oblige à diviser de tête
 * pendant l'effort. Au-delà d'une minute on écrit donc m:ss, en dessous les
 * secondes nues — c'est la convention de tous les chronomètres.
 */
export const formatCountdown = (seconds: number): string => {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total} s`;
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
};

export const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Si moins d'une minute, afficher en secondes uniquement
  if (totalMinutes === 0) {
    return `${seconds}s`;
  }

  // Si moins d'une heure
  if (totalMinutes < 60) {
    if (remainingSeconds > 0) {
      return `${totalMinutes}min${remainingSeconds}s`;
    }
    return `${totalMinutes}min`;
  }

  // Sinon afficher en heures et minutes (on ignore les secondes)
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h${mins.toString().padStart(2, '0')}`;
};

/**
 * La prescription d'un exercice, telle qu'elle s'affiche à droite de son nom.
 *
 * `block` est facultatif pour les appelants qui n'ont que le type, mais le
 * fournir change le rendu des blocs Tabata / On-Off : leur effort est défini
 * une fois pour tout le bloc (`workDuration`) et pas sur chaque exercice. Sans
 * lui, ces lignes s'affichaient nues pendant que le mode guidé, lui, montrait
 * « 20s » — la même donnée lue de deux façons selon l'écran.
 */
export const formatExerciseMetric = (
  ex: BlockExercise,
  blockType: BlockType,
  block?: Pick<SessionBlock, 'workDuration'>
): string => {
  const fallback =
    blockSupportsRepsOnly(blockType) && block?.workDuration !== undefined
      ? formatDuration(block.workDuration)
      : '';

  const effort = ex.reps
    ? `${ex.reps} reps`
    : ex.duration
      ? formatDuration(ex.duration)
      : ex.customMetric
        ? `${ex.customMetric.value} ${ex.customMetric.unit}`
        : fallback;

  if (!effort) return '';
  if (blockSupportsSets(blockType) && ex.sets && ex.sets > 1) {
    return `${ex.sets} × ${effort}`;
  }
  return effort;
};
