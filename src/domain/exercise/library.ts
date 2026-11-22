import type { Exercise } from '@/shared/types';
import { normalize } from '@/shared/utils/formatters';

/**
 * La bibliothèque d'exercices : son ordre, ce que le champ du haut garde, et
 * ce qu'il propose de créer.
 *
 * Hors du composant pour se tester sans écran : la page triait et filtrait
 * dans des `useMemo`, et l'ordre des ex æquo n'était écrit nulle part.
 */

/** Par nom, ou les plus utilisés d'abord. */
export type LibrarySort = 'name' | 'usage';

const byName = (a: Exercise, b: Exercise) =>
  a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });

/**
 * Ranger la bibliothèque.
 *
 * Deux exercices aussi utilisés l'un que l'autre se rangent par nom : sans
 * cela, les ex æquo suivraient l'ordre de l'API, et la liste changerait
 * d'une visite à l'autre — « Corde à sauter » et « Planche », jamais
 * utilisés tous les deux, échangeaient leur place.
 */
export const sortExercises = (
  exercises: readonly Exercise[],
  sort: LibrarySort
): Exercise[] =>
  [...exercises].sort((a, b) =>
    sort === 'usage'
      ? (b.usageCount ?? 0) - (a.usageCount ?? 0) || byName(a, b)
      : byName(a, b)
  );

/**
 * Ce que le champ garde : chaque mot tapé, sans accent ni casse, quelque
 * part dans le nom — « corde a » trouve « Corde à sauter », « squat » trouve
 * « Goblet Squat ». La même règle que la recherche des clients.
 */
export const matchesName = (exercise: Exercise, query: string): boolean => {
  const needle = normalize(query);
  if (!needle) return true;
  const haystack = normalize(exercise.name);
  return needle.split(/\s+/).every((word) => haystack.includes(word));
};

/**
 * Le nom que le champ propose de créer : ce qui est tapé, sauf s'il existe
 * déjà à l'accent et à la casse près — « corde a sauter » est « Corde à
 * sauter », et en créer un second ferait deux fiches pour un mouvement.
 */
export const creatableName = (
  exercises: readonly Exercise[],
  query: string
): string | null => {
  const name = query.trim().replace(/\s+/g, ' ');
  if (!name) return null;
  const key = normalize(name);
  return exercises.some((exercise) => normalize(exercise.name) === key)
    ? null
    : name;
};

/** « 10 exercices », « 1 exercice ». */
export const libraryCount = (count: number): string =>
  `${count} exercice${count > 1 ? 's' : ''}`;
