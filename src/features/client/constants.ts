import { FeedbackTag, SessionMetrics } from '@/shared/types';

// ─── Effort ──────────────────────────────────────────────────────────────────

/** Trois zones, pas cinq : ce qui compte est de savoir de quel côté de la
 * cible on est tombé. */
export type EffortZone = 'easy' | 'target' | 'hard';

/** Un cran de l'échelle : sa valeur enregistrée, son mot, sa zone. */
export interface EffortLevel {
  value: number;
  label: string;
  description: string;
  zone: EffortZone;
}

// La cible est au centre et elle est nommée : il n'y a aucun « plus =
// mieux » à interpréter. 1 et 5 sont deux problèmes différents, pas les deux
// bouts d'une échelle de qualité.
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
 * L'échelle telle qu'elle se lit : le plus dur à gauche.
 *
 * `value` reste la valeur enregistrée en base — 1 y veut toujours dire
 * « Trop facile », et aucun bilan déjà enregistré n'est réinterprété. `rank`
 * est le numéro affiché, et il compte dans l'autre sens : 1 = Trop dure.
 * Séparer les deux évite la seule chose dont on ne pourrait pas revenir —
 * une migration qui inverserait en silence le sens de tout l'historique.
 */
export interface EffortScaleStep extends EffortLevel {
  rank: number;
}

/** L'échelle inversée pour l'affichage, une fois pour toutes : chaque écran
 * qui la renverserait lui-même finirait par se tromper de sens. */
export const EFFORT_SCALE: EffortScaleStep[] = [...EFFORT_LEVELS]
  .reverse()
  .map((level, index) => ({ ...level, rank: index + 1 }));

// L'effort a sa propre échelle (voir `effort` dans le thème). Jusqu'ici il
// empruntait l'ambre de la marque pour son milieu et les accents de bloc pour
// ses extrêmes : trois couleurs qui disent déjà autre chose ailleurs, dont
// l'une à quelques centimètres sur la même ligne — dans la liste des clients,
// le rouge d'effort voisinait avec l'or de ce qui attend le coach.
export const EFFORT_ZONE_COLOR: Record<EffortZone, string> = {
  easy: 'effort.easy',
  target: 'effort.target',
  hard: 'effort.hard',
};

/** Rend `undefined` et non un cran par défaut : un bilan sans ressenti est
 * une absence de réponse, pas un « Juste ». */
export const getEffortLevel = (effort?: number): EffortLevel | undefined =>
  EFFORT_LEVELS.find((l) => l.value === effort);

// ─── Tags ───────────────────────────────────────────────────────────────────

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

// ─── Legacy ──────────────────────────────────────────────────────────────────

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

/**
 * Les deux largeurs de l'espace client.
 *
 * Plus étroites que celles du coach : le client lit sur un téléphone, debout,
 * entre deux séries. Le coach écrit assis, sur un écran large.
 */
export const CLIENT_CONTENT_MAX_W = '640px';
/** Une grille se balaye : elle prend ce qu'on lui donne. */
export const CLIENT_GRID_MAX_W = '5xl';
