import { useMemo } from "react";
import { Exercise } from "@/types";

export const useExerciseFilter = (
  exercises: Exercise[],
  searchQuery: string,
  type?: "warmup" | "workout",
) =>
  useMemo(
    () =>
      exercises.filter(
        (ex) =>
          (!type || ex.type === type) &&
          ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [exercises, searchQuery, type],
  );
