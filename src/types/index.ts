/**
 * La décision du client sur le partage de son ressenti.
 *
 * `version` est celle du texte auquel il a répondu. Le serveur la compare à
 * la version courante : c'est lui qui décide si la question se repose.
 */
export interface HealthConsent {
  granted: boolean;
  decidedAt: string;
  version: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
  healthConsent: HealthConsent | null;
  /** Vrai tant que le client n'a pas répondu au texte en vigueur. */
  needsHealthConsent: boolean;
}

/** Ce que l'écran « Mon compte » a besoin de savoir, selon les rôles tenus. */
export interface AccountSummary {
  asClient: {
    coaches: {
      firstName: string;
      lastName: string;
      picture?: string;
      linkedAt: string;
    }[];
    completedCount: number;
    /** Combien de bilans un refus effacerait. Zéro = rien à avertir. */
    healthDataCount: number;
    healthConsent: HealthConsent | null;
    since: string;
  } | null;
  asCoach: {
    clientCount: number;
    since: string;
  } | null;
}

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  linkedAt: Date;
  unseenCount: number;
  /** Absent tant que le client n'a jamais terminé de séance. */
  lastCompletedAt?: Date;
  /**
   * Le ressenti déclaré sur cette dernière séance. Absent si elle n'en portait
   * pas — bilan d'avant la refonte, ou terminée sans se prononcer.
   */
  lastEffort?: number;
}

export interface Coach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  hiredAt: Date;
}

export interface Program {
  _id: string;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  _id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  /** Nombre de séances du coach où l'exercice apparaît. Servi par l'API. */
  usageCount?: number;
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

export type BlockType =
  | 'warmup'
  | 'emom'
  | 'every'
  | 'amrap'
  | 'timecap'
  | 'chipper'
  | 'classic'
  | 'tabata'
  | 'onoff'
  | 'pyramid'
  | 'ladder';

export interface CustomMetric {
  value: number;
  unit: string;
}

export interface BlockExercise {
  exercise: Exercise;
  order: number;
  sets?: number;
  restBetweenSets?: number;
  reps?: number;
  duration?: number;
  customMetric?: CustomMetric;
}

export interface SessionBlock {
  _id: string;
  type: BlockType;
  label?: string;
  order: number;
  notes?: string;
  durationMinutes?: number;
  intervalMinutes?: number;
  rounds?: number;
  restBetweenRounds?: number;
  workDuration?: number;
  restDuration?: number;
  repsScheme?: number[];
  exercises: BlockExercise[];
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  _id: string;
  order: number;
  notes?: string;
  /**
   * Jours conseillés par le coach, lundi = 0. Indicatif : un jour manqué ne
   * crée aucune dette. Absent ou vide = la séance n'est liée à aucun jour.
   */
  suggestedDays?: number[];
  blocks: SessionBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProgram {
  sessions: Session[];
}

export interface ClientWithDetails extends Client {
  program: ClientProgram;
  unseenCount: number;
}

// ─── Completed Session (snapshot) ────────────────────────────────────────────

export interface BlockExerciseSnapshot {
  exercise: Record<string, unknown>;
  order: number;
  sets?: number;
  restBetweenSets?: number;
  reps?: number;
  duration?: number;
  customMetric?: CustomMetric;
  performed?: PerformedValues;
}

export interface BlockSnapshot {
  type: string;
  label?: string;
  order: number;
  notes?: string;
  durationMinutes?: number;
  intervalMinutes?: number;
  rounds?: number;
  restBetweenRounds?: number;
  workDuration?: number;
  restDuration?: number;
  repsScheme?: number[];
  exercises: BlockExerciseSnapshot[];
}

export interface CompletedSession {
  _id: string;
  completedAt: Date;
  originalSessionId: string;
  sessionOrder: number;
  blocks: BlockSnapshot[];
  coachNotes?: string;
  feedback?: SessionFeedback;
  /** @deprecated Ancien bilan en 5 axes. Encore lu, plus jamais écrit. */
  metrics?: SessionMetrics;
  clientNotes?: string;
  viewedByCoach: boolean;
  editedAt?: Date;
}

// ─── Ressenti ────────────────────────────────────────────────────────────────

export type FeedbackTag =
  'poor_sleep' | 'pain' | 'stress' | 'fatigue' | 'illness' | 'great_shape';

export interface SessionFeedback {
  /** 1 « trop facile » … 5 « trop dure ». La cible est 3, au centre. */
  effort: number;
  tags?: FeedbackTag[];
  note?: string;
}

/** @deprecated Remplacé par `SessionFeedback`. Conservé pour relire l'historique. */
export interface SessionMetrics {
  stress: number;
  mood: number;
  energy: number;
  sleep: number;
  soreness: number;
}

/**
 * Ce que le client a fait sur UNE série.
 * Une clé absente veut dire « non renseignée » — jamais zéro.
 */
export interface PerformedSet {
  weight?: number;
  reps?: number;
  duration?: number;
}

/**
 * Ce que le client a réellement fait, série par série.
 *
 * La liste s'arrête là où l'exercice s'est arrêté : une série prescrite qui
 * n'y figure pas n'a pas été faite. « J'ai fait mes quatre séries » et « j'ai
 * lâché à la deuxième » sont deux informations différentes, et l'ancien
 * couple poids/reps unique n'en portait aucune des deux.
 */
export interface PerformedValues {
  sets: PerformedSet[];
}

/**
 * Le réalisé d'un exercice, adressé par sa position dans l'instantané.
 * La liste remplace intégralement celle enregistrée ; `[]` l'efface.
 */
export interface PerformedEntry {
  blockOrder: number;
  exerciseOrder: number;
  sets: PerformedSet[];
}
