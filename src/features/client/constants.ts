import { FeedbackTag, SessionMetrics } from '@/types';

// ─── Effort ──────────────────────────────────────────────────────────────────

export type EffortZone = 'easy' | 'target' | 'hard';

export interface EffortLevel {
  value: number;
  label: string;
  description: string;
  zone: EffortZone;
}

// The target is in the centre and it is named: there is no "more = better"
// to interpret. 1 and 5 are two different problems, not two ends of one
// quality scale.
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
 * The scale as it is read: hardest on the left.
 *
 * `value` stays the value stored in the database — 1 there still means "Trop
 * facile", and no wrap-up already recorded is reinterpreted. `rank` is the
 * displayed number, and it counts the other way: 1 = Trop dure. Separating
 * the two avoids the one thing that could not be recovered from — a migration
 * silently reversing the meaning of the whole history.
 */
export interface EffortScaleStep extends EffortLevel {
  rank: number;
}

export const EFFORT_SCALE: EffortScaleStep[] = [...EFFORT_LEVELS]
  .reverse()
  .map((level, index) => ({ ...level, rank: index + 1 }));

// Effort has its own scale (see `effort` in the theme). Until now it borrowed
// the brand's amber for its middle and the block accents for its extremes:
// three colours that already say something else elsewhere, one of them a few
// centimetres away on the same row — in the client list, the effort red sat
// next to the gold of what awaits the coach.
export const EFFORT_ZONE_COLOR: Record<EffortZone, string> = {
  easy: 'effort.easy',
  target: 'effort.target',
  hard: 'effort.hard',
};

export const getEffortLevel = (effort?: number): EffortLevel | undefined =>
  EFFORT_LEVELS.find((l) => l.value === effort);

// ─── Tags ───────────────────────────────────────────────────────────────────

// The keys are stable and stored as-is by the API: a label can change
// without breaking anything in the history already recorded.
export const FEEDBACK_TAG_LABELS: Record<FeedbackTag, string> = {
  poor_sleep: 'Mal dormi',
  pain: 'Douleur',
  stress: 'Stressé',
  fatigue: 'Fatigué',
  illness: 'Malade',
  great_shape: 'En forme',
};

// "En forme" is deliberately in the list: with no positive tag, the form only
// gets opened when things go badly and the coach loses half the signal.
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
 * The old wrap-up's five axes. Used only to read back sessions recorded
 * before the effort rework — never to enter new ones, and never to recompute
 * an average.
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
