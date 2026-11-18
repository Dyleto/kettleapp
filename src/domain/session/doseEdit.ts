import type { BlockExercise } from '@/shared/types';
import { formatDuration } from '@/shared/utils/duration';

/**
 * Régler la dose d'un exercice : ce que font « − » et « + », et ce que
 * coûte un changement d'unité.
 *
 * Ici et non dans l'écran : la ligne ouverte de l'atelier et sa feuille sur
 * téléphone font les mêmes pas, et un pas se décide sur des cas qu'un écran
 * ne construit pas — une durée à 37 s, un repos qu'on ramène à rien.
 */

const NBSP = ' ';

/** L'unité de la dose : une seule à la fois, l'API n'en garde qu'une. */
export type DoseUnit = 'reps' | 'duration' | 'custom';

/** Ce que les − et + d'une ligne règlent. */
export type StepKind = 'sets' | 'reps' | 'duration' | 'rest' | 'custom';

/** Une dose sans durée ni mesure libre se compte en répétitions — même vide :
 * c'est l'unité que propose une ligne qu'on vient d'ajouter. */
export const doseUnitOf = (exercise: BlockExercise): DoseUnit =>
  exercise.duration !== undefined
    ? 'duration'
    : exercise.customMetric !== undefined
      ? 'custom'
      : 'reps';

/**
 * La taille d'un pas, selon la valeur d'où il part.
 *
 * Un pas fixe ne convenait à aucune mesure : une seconde de plus sur un
 * gainage de trois minutes, c'est cent quatre-vingts touches ; quinze
 * secondes sur un sprint de vingt, c'est rater la valeur voulue. Le pas
 * grandit donc avec la valeur, aux endroits où le coach arrondit déjà.
 */
const stepSize = (kind: StepKind, value: number): number => {
  switch (kind) {
    case 'sets':
    case 'reps':
      return 1;
    case 'duration':
      return value < 60 ? 5 : value < 300 ? 15 : 30;
    case 'rest':
      return 15;
    case 'custom':
      return value < 10 ? 1 : value < 100 ? 5 : value < 1000 ? 50 : 100;
  }
};

/** Le plancher de chaque réglage. Le repos descend jusqu'à rien. */
const FLOOR: Record<StepKind, number> = {
  sets: 1,
  reps: 1,
  duration: 5,
  rest: 0,
  custom: 0,
};

/** Ce que vaut une valeur absente quand on touche « + » : le premier pas
 * qui a un sens. */
const START: Record<StepKind, number> = {
  sets: 2,
  reps: 1,
  duration: 30,
  rest: 30,
  custom: 1,
};

/**
 * La valeur après un « − » ou un « + ».
 *
 * Elle se cale sur la grille du pas : 37 s devient 40 s ou 35 s, et non
 * 42 s ou 32 s — une valeur tapée de travers revient d'elle-même sur un
 * nombre rond. Le pas d'une descente se lit juste sous la valeur : de
 * 60 s on redescend à 55 s, et de 55 s on remonte à 60 s ; un aller-retour
 * revient d'où il est parti.
 *
 * `undefined` pour un repos ramené à zéro ou des séries ramenées à une
 * seule : c'est ainsi que l'API dit « aucun », et c'est ce que la ligne
 * écrit déjà quand le coach n'a rien réglé.
 */
export const stepped = (
  kind: StepKind,
  value: number | undefined,
  direction: 1 | -1
): number | undefined => {
  if (value === undefined) return direction > 0 ? START[kind] : undefined;
  const size = stepSize(kind, direction > 0 ? value : Math.max(0, value - 1));
  const next =
    direction > 0
      ? Math.floor(value / size) * size + size
      : Math.ceil(value / size) * size - size;
  const floored = Math.max(FLOOR[kind], next);
  if (kind === 'rest' && floored === 0) return undefined;
  if (kind === 'sets' && floored === 1) return undefined;
  return floored;
};

type DoseFields = Pick<BlockExercise, 'reps' | 'duration' | 'customMetric'>;

/** Ce qu'une dose devient dans sa nouvelle unité : une valeur de départ, et
 * les deux autres effacées — l'API refuse une ligne qui en porte deux. */
export const switchedDose = (unit: DoseUnit): DoseFields => ({
  reps: unit === 'reps' ? 10 : undefined,
  duration: unit === 'duration' ? 30 : undefined,
  customMetric: unit === 'custom' ? { value: 100, unit: 'm' } : undefined,
});

/** Les champs de dose tels qu'ils sont, pour les remettre. */
export const doseFields = (exercise: BlockExercise): DoseFields => ({
  reps: exercise.reps,
  duration: exercise.duration,
  customMetric: exercise.customMetric,
});

/**
 * Ce qu'un changement d'unité efface : « 12 reps », « 1 min », « 500 m » —
 * ou rien, quand la dose était vide.
 *
 * C'est ce que la bannière « Annuler » rappelle. Changer d'unité efface
 * l'autre valeur, et la maquette demande de prévenir quand elle était
 * remplie ; le produit prévient après coup, avec de quoi revenir, comme
 * partout ailleurs dans l'atelier — une question avant chaque changement
 * d'unité recevrait un « oui » réflexe dès la troisième.
 */
export const erasedDose = (exercise: BlockExercise): string | undefined => {
  if (exercise.reps) return `${exercise.reps}${NBSP}reps`;
  if (exercise.duration) return formatDuration(exercise.duration);
  if (exercise.customMetric)
    return `${exercise.customMetric.value}${NBSP}${exercise.customMetric.unit}`.trim();
  return undefined;
};

/** Le nom d'une unité dans la bannière : « Dose en durée ». */
export const UNIT_PHRASE: Record<DoseUnit, string> = {
  reps: 'en répétitions',
  duration: 'en durée',
  custom: 'dans une autre unité',
};
