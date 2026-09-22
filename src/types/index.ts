/**
 * The client's decision about sharing how they felt.
 *
 * `version` is that of the text they answered. The server compares it to the
 * current version: it decides whether the question is put again.
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
  /** True until the client has answered the text currently in force. */
  needsHealthConsent: boolean;
}

/** What the "Mon compte" screen needs to know, per role held. */
export interface AccountSummary {
  asClient: {
    coaches: {
      firstName: string;
      lastName: string;
      picture?: string;
      linkedAt: string;
    }[];
    completedCount: number;
    /** How many wrap-ups a refusal would erase. Zero = nothing to warn about. */
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
  /** Absent until the client has finished a session. */
  lastCompletedAt?: Date;
  /**
   * How they said that last session felt. Absent when it carried none — a
   * wrap-up from before the rework, or finished without answering.
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
  /** How many of the coach's sessions the exercise appears in. Served by the API. */
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
  /**
   * The coach's instruction for this exercise, in that particular session.
   *
   * Distinct from `exercise.description`, which describes the movement in
   * general and lives in the library, shared by every client and every
   * session.
   */
  note?: string;
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
  /** The coach's free name — "Full body A". Absent: the session states its rank. */
  name?: string;
  notes?: string;
  /**
   * Days the coach suggests, Monday = 0. Advisory: a missed day creates no
   * debt. Absent or empty = the session is tied to no day.
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
  /** The coach's instruction, as it stood on the day of the session. */
  note?: string;
  performed?: PerformedValues;
}

export interface BlockSnapshot {
  type: string;
  label?: string;
  order: number;
  notes?: string;
  durationMinutes?: number;
  intervalMinutes?: number;
  /** Les tours prescrits par le coach. */
  rounds?: number;
  /** Rounds actually completed — the score, when the format has one. */
  performedRounds?: number;
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
  /**
   * The name the session bore that day, frozen like its rank: renaming a
   * session does not rewrite wrap-ups already recorded.
   */
  sessionName?: string;
  blocks: BlockSnapshot[];
  coachNotes?: string;
  feedback?: SessionFeedback;
  /** @deprecated The old five-axis wrap-up. Still read, never written again. */
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

/** @deprecated Replaced by `SessionFeedback`. Kept to read back history. */
export interface SessionMetrics {
  stress: number;
  mood: number;
  energy: number;
  sleep: number;
  soreness: number;
}

/**
 * What the client did on ONE set.
 * A missing key means "not filled in" — never zero.
 */
export interface PerformedSet {
  weight?: number;
  reps?: number;
  duration?: number;
}

/**
 * What the client actually did, set by set.
 *
 * The list stops where the exercise stopped: a prescribed set that is not
 * there was not done. "I did my four sets" and "I gave up on the second" are
 * two different pieces of information, and the old single weight/reps pair
 * carried neither.
 */
export interface PerformedValues {
  sets: PerformedSet[];
}

/**
 * What was performed on an exercise, addressed by its position in the
 * snapshot. The list wholly replaces the recorded one; `[]` erases it.
 */
export interface PerformedEntry {
  blockOrder: number;
  exerciseOrder: number;
  sets: PerformedSet[];
}

/**
 * The completed rounds of a block counted in rounds — an AMRAP's score.
 *
 * Addressed to the block, not the exercise: it is the whole list you loop.
 * Distinct from `rounds` in the snapshot, which stays what the coach asked
 * for; comparing the two is the whole point.
 */
export interface RoundsDoneEntry {
  blockOrder: number;
  rounds: number;
}
