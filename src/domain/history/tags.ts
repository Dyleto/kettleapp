import { FeedbackTag, SessionMetrics } from '@/shared/types';

// Les clés sont stables et enregistrées telles quelles par l'API : un
// libellé peut changer sans rien casser dans l'historique déjà enregistré.
export const FEEDBACK_TAG_LABELS: Record<FeedbackTag, string> = {
  poor_sleep: 'Mal dormi',
  pain: 'Douleur',
  stress: 'Stressé',
  fatigue: 'Fatigué',
  illness: 'Malade',
  great_shape: 'En forme',
};

// « En forme » est délibérément dans la liste : sans étiquette positive, le
// formulaire ne s'ouvre que quand ça va mal, et le coach perd la moitié du
// signal.
export const FEEDBACK_TAGS: FeedbackTag[] = [
  'poor_sleep',
  'pain',
  'stress',
  'fatigue',
  'illness',
  'great_shape',
];

/**
 * Les cinq axes de l'ancien bilan. Servent uniquement à relire les séances
 * enregistrées avant la refonte de l'effort — jamais à en saisir de
 * nouvelles, ni à recalculer une moyenne.
 */
export const LEGACY_METRIC_LABELS: Record<keyof SessionMetrics, string> = {
  stress: 'Stress',
  mood: 'Humeur',
  energy: 'Énergie',
  sleep: 'Sommeil',
  soreness: 'Douleurs',
};
