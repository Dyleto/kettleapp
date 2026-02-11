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
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  _id: string;
  name: string;
  description?: string;
  videoUrl?: string;
  type: "warmup" | "exercise";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseStats {
  warmupCount: number;
  exerciseCount: number;
}

export interface WarmupExercise {
  exercise: Exercise;
  duration?: number;
  reps?: number;
  notes?: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets?: number;
  reps?: number;
  weight?: number;
  restBetweenSets?: number;
  duration?: number;
  restAfter?: number;
  notes?: string;
}

export interface Session {
  _id: string;
  programId: string;
  name: string;
  order: number;
  warmup?: {
    notes?: string;
    exercises: WarmupExercise[];
  };
  workout: {
    notes?: string;
    rounds: number;
    restBetweenRounds?: number;
    exercises: WorkoutExercise[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientWithDetails extends Client {
  program: Program | null;
  sessions: Session[];
}
