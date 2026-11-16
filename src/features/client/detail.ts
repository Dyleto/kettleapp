import type { BlockExercise, SessionBlock } from '@/shared/types';
import { formatDuration } from '@/shared/utils/duration';
import {
  blockDefinesOwnMetrics,
  blockSupportsRepsOnly,
  getBlockLabel,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { formatWeight, heaviest } from './guided/load';
import type { LastPerformance } from './lastPerformance';

const NBSP = ' ';

/**
 * Ce que la fiche de séance écrit d'un bloc et d'un exercice, en mots.
 *
 * La fiche montrait le rendu de l'atelier du coach tel quel : des doses en
 * police de code derrière le nom, des réglages en une ligne compacte. Le
 * client y venait pour lire avant de partir, et c'est la dose qu'il cherche
 * — elle passe devant le nom, en gros, et les réglages du bloc deviennent
 * des pastilles qui se lisent une à une.
 */

/**
 * Le nom du format, celui qui ouvre la carte du bloc.
 *
 * `every` est un format hérité, fondu dans l'EMOM : il se lit exactement
 * comme lui, et le client n'a pas à apprendre un second nom pour la même
 * chose.
 */
export const formatName = (type: SessionBlock['type']): string =>
  type === 'every' ? 'EMOM' : getBlockLabel(type);

/**
 * Les réglages du bloc, une pastille chacun : « 8 tours », « 20 s / 10 s »,
 * « 12 min », « toutes les 2 min ».
 *
 * Rien pour un bloc classique ou un échauffement : leurs réglages sont sur
 * chaque exercice, dans sa dose.
 */
export const blockChips = (block: SessionBlock): string[] => {
  const min = (m: number) => `${m}${NBSP}min`;
  switch (block.type) {
    case 'emom':
    case 'every':
      return [
        block.rounds ? `${block.rounds}${NBSP}tours` : 'sans limite',
        (block.intervalMinutes ?? 1) > 1
          ? `toutes les ${min(block.intervalMinutes ?? 1)}`
          : '',
      ].filter(Boolean);
    case 'tabata':
    case 'onoff':
      return [
        block.rounds ? `${block.rounds}${NBSP}tours` : '',
        block.workDuration !== undefined
          ? [
              formatDuration(block.workDuration),
              block.restDuration !== undefined
                ? formatDuration(block.restDuration)
                : '',
            ]
              .filter(Boolean)
              .join(' / ')
          : '',
      ].filter(Boolean);
    case 'amrap':
      return block.durationMinutes ? [min(block.durationMinutes)] : [];
    case 'chipper':
    case 'timecap':
      return block.durationMinutes ? [`${min(block.durationMinutes)} max`] : [];
    case 'ladder':
      return [
        block.repsScheme?.length ? block.repsScheme.join('-') : '',
        block.durationMinutes ? `${min(block.durationMinutes)} max` : '',
        block.restBetweenRounds
          ? `repos ${formatDuration(block.restBetweenRounds)}`
          : '',
      ].filter(Boolean);
    default:
      return [];
  }
};

/**
 * La dose d'un exercice, comme on la dit : « 4 × 10 », « 15 », « 1 min »,
 * « 20 s », « 500 m ».
 *
 * Sans série, le nombre seul. Un Tabata sans répétitions prescrites se dose
 * au temps de travail du bloc — c'est lui qui dit combien on en fait. Une
 * échelle n'en a pas : ses paliers sont sur le bloc, et le dessin les
 * montre. Rien de prescrit : chaîne vide, et le nom s'aligne à gauche.
 */
export const exerciseDose = (
  block: SessionBlock,
  exercise: BlockExercise
): string => {
  if (blockDefinesOwnMetrics(block.type)) return '';
  const work = exercise.reps
    ? String(exercise.reps)
    : exercise.duration
      ? formatDuration(exercise.duration)
      : exercise.customMetric
        ? `${exercise.customMetric.value}${NBSP}${exercise.customMetric.unit}`
        : blockSupportsRepsOnly(block.type) && block.workDuration !== undefined
          ? formatDuration(block.workDuration)
          : '';
  const sets =
    block.type === 'classic' || block.type === 'warmup'
      ? (exercise.sets ?? 1)
      : 1;
  if (sets > 1) return work ? `${sets} × ${work}` : `${sets} séries`;
  return work;
};

/**
 * La ligne sous le nom : le repos entre séries, puis la dernière charge.
 *
 * « la dernière fois 26 kg » est la série la plus lourde du dernier bilan
 * qui contient ce mouvement : c'est elle qu'on cherche à refaire ou à
 * battre, pas une moyenne.
 */
export const exerciseSub = (
  block: SessionBlock,
  exercise: BlockExercise,
  last?: LastPerformance
): string => {
  const rest = restBetweenSetsOf(block, exercise);
  const load = heaviest(last?.sets);
  return [
    rest ? `repos ${formatDuration(rest)}` : '',
    load !== undefined ? `la dernière fois ${formatWeight(load)}${NBSP}kg` : '',
  ]
    .filter(Boolean)
    .join(' · ');
};

/** Y a-t-il quelque chose à lire dans la consigne : une note, une
 * description, une vidéo. L'icône d'information n'apparaît qu'alors. */
export const hasInstructions = (exercise: BlockExercise): boolean =>
  !!(
    exercise.note?.trim() ||
    exercise.exercise.description?.trim() ||
    exercise.exercise.videoUrl?.trim()
  );
