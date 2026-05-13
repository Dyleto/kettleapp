export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
}

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  linkedAt: Date;
  unseenCount: number;
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
  type: "warmup" | "workout";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseStats {
  warmupCount: number;
  workoutCount: number;
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

export type BlockType =
  | "warmup"
  | "emom"
  | "every"
  | "amrap"
  | "timecap"
  | "chipper"
  | "classic"
  | "tabata"
  | "onoff"
  | "pyramid"
  | "ladder";

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
  metrics: SessionMetrics;
  clientNotes?: string;
  viewedByCoach: boolean;
}

export interface SessionMetrics {
  stress: number;
  mood: number;
  energy: number;
  sleep: number;
  soreness: number;
}
