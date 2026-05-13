import { ExerciseCardEdit } from "./ExerciseCardEdit";
import { ExerciseCardView } from "./ExerciseCardView";

export interface ExerciseCardProps {
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  restBetweenSets?: number;
  isEditing?: boolean;
  mode?: "timer" | "reps";
  type?: "workout" | "warmup";
  description?: string;
  videoUrl?: string;
  onUpdate?: (updates: {
    sets?: number;
    reps?: number;
    duration?: number;
    restBetweenSets?: number;
    mode?: "timer" | "reps";
  }) => void;
}

export const ExerciseCard = ({ isEditing, ...props }: ExerciseCardProps) => {
  if (isEditing) return <ExerciseCardEdit {...props} />;
  return <ExerciseCardView {...props} />;
};
