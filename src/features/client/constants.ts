import { FeedbackTag, SessionMetrics } from '@/types';

// ─── Effort ──────────────────────────────────────────────────────────────────

export type EffortZone = 'easy' | 'target' | 'hard';

export interface EffortLevel {
  value: number;
  label: string;
  description: string;
  zone: EffortZone;
}

// La cible est au centre et elle est nommée : il n'y a pas de « plus = mieux »
// à interpréter. 1 et 5 sont deux problèmes différents, pas deux extrémités
// d'une même échelle de qualité.
export const EFFORT_LEVELS: EffortLevel[] = [
  {
    value: 1,
    label: 'Trop facile',
    description: "j'aurais pu en faire beaucoup plus",
    zone: 'easy',
  },
  {
    value: 2,
    label: 'Facile',
    description: 'confortable du début à la fin',
    zone: 'easy',
  },
  {
    value: 3,
    label: 'Juste',
    description: 'engagée, mais tenue',
    zone: 'target',
  },
  {
    value: 4,
    label: 'Dure',
    description: 'finie en serrant les dents',
    zone: 'hard',
  },
  {
    value: 5,
    label: 'Trop dure',
    description: "je n'ai pas pu tout faire",
    zone: 'hard',
  },
];

/**
 * L'échelle telle qu'on la lit : le plus dur à gauche.
 *
 * `value` reste la valeur stockée en base — 1 y signifie toujours « Trop
 * facile », et aucun bilan déjà enregistré n'est réinterprété. `rank` est le
 * chiffre affiché, et lui compte à l'envers : 1 = Trop dure. Séparer les deux
 * évite la seule chose qu'on ne pourrait pas rattraper — une migration qui
 * inverse silencieusement le sens de tout l'historique.
 */
export interface EffortScaleStep extends EffortLevel {
  rank: number;
}

export const EFFORT_SCALE: EffortScaleStep[] = [...EFFORT_LEVELS]
  .reverse()
  .map((level, index) => ({ ...level, rank: index + 1 }));

// Le ressenti a sa propre échelle (voir `effort` dans le thème). Il empruntait
// jusqu'ici l'ambre de la marque pour son milieu et les accents de bloc pour
// ses extrêmes : trois couleurs qui disent déjà autre chose ailleurs, dont une
// à quelques centimètres sur la même ligne — dans la liste de clients, le
// rouge du ressenti voisinait le doré de ce qui attend le coach.
export const EFFORT_ZONE_COLOR: Record<EffortZone, string> = {
  easy: 'effort.easy',
  target: 'effort.target',
  hard: 'effort.hard',
};

export const getEffortLevel = (effort?: number): EffortLevel | undefined =>
  EFFORT_LEVELS.find((l) => l.value === effort);

// ─── Étiquettes ──────────────────────────────────────────────────────────────

// Les clés sont stables et stockées telles quelles côté API : on peut changer
// un libellé sans rien casser dans l'historique déjà enregistré.
export const FEEDBACK_TAG_LABELS: Record<FeedbackTag, string> = {
  poor_sleep: 'Mal dormi',
  pain: 'Douleur',
  stress: 'Stressé',
  fatigue: 'Fatigué',
  illness: 'Malade',
  great_shape: 'En forme',
};

// « En forme » est volontairement dans la liste : sans étiquette positive, on
// n'ouvre le formulaire que quand ça va mal et le coach perd la moitié du
// signal.
export const FEEDBACK_TAGS: FeedbackTag[] = [
  'poor_sleep',
  'pain',
  'stress',
  'fatigue',
  'illness',
  'great_shape',
];

// ─── Legacy ──────────────────────────────────────────────────────────────────

/**
 * Les cinq axes de l'ancien bilan. Servent uniquement à relire les séances
 * enregistrées avant la refonte du ressenti — jamais à en saisir de nouvelles,
 * et jamais à recalculer une moyenne.
 */
export const LEGACY_METRIC_LABELS: Record<keyof SessionMetrics, string> = {
  stress: 'Stress',
  mood: 'Humeur',
  energy: 'Énergie',
  sleep: 'Sommeil',
  soreness: 'Douleurs',
};

export const CLIENT_CONTENT_MAX_W = '640px';
export const CLIENT_GRID_MAX_W = '5xl';
