import { stripAccents } from '@/shared/utils/formatters';
import { useMemo } from 'react';
import { Exercise } from '@/shared/types';

const normalize = (str: string) => stripAccents(str).toLowerCase();

/**
 * Filtre la bibliothèque sur ce qui est tapé, accents ignorés.
 *
 * « developpe » doit trouver « Développé couché » : un coach tape vite, et
 * sur un clavier de téléphone les accents coûtent un appui long. La
 * comparaison se fait donc sur les deux chaînes dépouillées.
 */
export const useExerciseFilter = (exercises: Exercise[], searchQuery: string) =>
  useMemo(
    () =>
      exercises.filter((ex) =>
        normalize(ex.name).includes(normalize(searchQuery))
      ),
    [exercises, searchQuery]
  );
