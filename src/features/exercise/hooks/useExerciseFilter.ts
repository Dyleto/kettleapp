import { stripAccents } from '@/shared/utils/formatters';
import { useMemo } from 'react';
import { Exercise } from '@/shared/types';

const normalize = (str: string) => stripAccents(str).toLowerCase();

export const useExerciseFilter = (exercises: Exercise[], searchQuery: string) =>
  useMemo(
    () =>
      exercises.filter((ex) =>
        normalize(ex.name).includes(normalize(searchQuery))
      ),
    [exercises, searchQuery]
  );
