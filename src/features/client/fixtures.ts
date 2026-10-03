/**
 * De quoi écrire un cas de bord en trois lignes.
 *
 * Les tests de cette logique manipulent des séances et des bilans entiers :
 * une séance porte des blocs, qui portent des exercices, qui portent un
 * exercice de bibliothèque. Écrire cela à la main par cas rendrait chaque
 * test illisible — et c'est le test qui doit se lire, pas la construction de
 * son décor.
 *
 * Chaque fabrique part d'un objet valide et n'accepte que les écarts. Un test
 * dit donc ce qui change, et rien de plus : `makeBlock({ reps: 12 })` se lit comme
 * sa propre intention.
 *
 * Vit dans le dossier du domaine et non sous `__fixtures__` : c'est du code
 * du domaine, et le ranger ailleurs le ferait échapper au typage de celui-ci.
 */
import type {
  BlockExercise,
  BlockSnapshot,
  CompletedSession,
  Exercise,
  Session,
  SessionBlock,
} from '@/shared/types';

/** Le contrat ne nomme pas l'exercice figé — il le décrit en ligne dans
 * `BlockSnapshot`. On le nomme ici pour que les fabriques se lisent. */
type ExerciseSnapshot = BlockSnapshot['exercises'][number];

/**
 * Tout est déterminé, et il a fallu s'y reprendre.
 *
 * Les identifiants étaient d'abord engendrés par un compteur : `makeExercise()`
 * rendait `ex-1`, puis `ex-2`, puis `ex-3`. Deux décors « identiques »
 * n'avaient donc jamais le même exercice, et toute assertion de la forme
 * « ces deux doses diffèrent » passait sans rien prouver — elle constatait un
 * écart d'identifiant, pas celui qu'elle visait. Un sabotage l'a montré :
 * retirer la distinction entre zéro et absent ne faisait tomber aucun test.
 *
 * Un décor par défaut est donc le même à chaque appel. Un test qui a besoin
 * de deux choses distinctes le dit — `makeExercise({ _id: 'ex-other' })` — et
 * cela se lit comme son intention.
 */
export const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  _id: 'ex-goblet',
  name: 'Goblet Squat',
  createdBy: 'coach-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

export const makeBlockExercise = (
  overrides: Partial<BlockExercise> = {}
): BlockExercise => ({
  exercise: makeExercise(),
  order: 1,
  ...overrides,
});

export const makeBlock = (
  overrides: Partial<SessionBlock> = {}
): SessionBlock => ({
  _id: 'bloc-1',
  type: 'classic',
  order: 1,
  exercises: [makeBlockExercise()],
  ...overrides,
});

export const makeSession = (overrides: Partial<Session> = {}): Session => ({
  _id: 'seance-1',
  order: 1,
  blocks: [makeBlock()],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

/**
 * L'instantané d'un bloc, tel qu'un bilan le porte.
 *
 * Distinct d'un `SessionBlock` par deux choses : son `type` est une chaîne
 * libre — un bilan ancien peut porter un format qui n'existe plus — et il n'a
 * pas de `_id`.
 */
export const makeBlockSnapshot = (
  overrides: Partial<BlockSnapshot> = {}
): BlockSnapshot => ({
  type: 'classic',
  order: 1,
  exercises: [makeExerciseSnapshot()],
  ...overrides,
});

/**
 * Un exercice dans l'instantané, et ce qui y a été noté.
 *
 * Son `exercise` est un `Record<string, unknown>` et non un `Exercise` : le
 * serveur fige ce qu'il avait sous la main le jour de la séance, et un bilan
 * d'il y a un an peut porter un exercice dont la forme a changé depuis.
 * C'est pour cela que les modules qui le lisent vérifient le type de `_id`
 * plutôt que de le supposer — et c'est un cas que les tests construisent,
 * `makeExerciseSnapshot({ exercise: {} })`.
 */
export const makeExerciseSnapshot = (
  overrides: Partial<ExerciseSnapshot> = {}
): ExerciseSnapshot => ({
  exercise: { _id: 'ex-goblet', name: 'Goblet Squat' },
  order: 1,
  ...overrides,
});

/**
 * Un bilan. `completedAt` est explicite partout dans les tests : une date
 * par défaut qui dépend de l'heure d'exécution ferait passer ou tomber un
 * test selon le moment de la journée.
 */
export const makeCompleted = (
  overrides: Partial<CompletedSession> = {}
): CompletedSession => ({
  _id: 'bilan-1',
  originalSessionId: 'seance-1',
  sessionOrder: 1,
  blocks: [makeBlockSnapshot()],
  viewedByCoach: false,
  completedAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

/**
 * Le même contenu des deux côtés, à l'écart près.
 *
 * `matchSession` compare une séance vivante à des instantanés : construire
 * les deux séparément dans chaque test laisserait la porte ouverte à une
 * différence accidentelle, et un test qui échoue pour une raison qu'il
 * n'avait pas prévue ne dit rien.
 */
export const freeze = (b: SessionBlock): BlockSnapshot => ({
  type: b.type,
  order: b.order,
  durationMinutes: b.durationMinutes,
  intervalMinutes: b.intervalMinutes,
  rounds: b.rounds,
  restBetweenRounds: b.restBetweenRounds,
  workDuration: b.workDuration,
  restDuration: b.restDuration,
  repsScheme: b.repsScheme,
  exercises: b.exercises.map((ex) => ({
    exercise: ex.exercise as unknown as Record<string, unknown>,
    order: ex.order,
    sets: ex.sets,
    restBetweenSets: ex.restBetweenSets,
    reps: ex.reps,
    duration: ex.duration,
    customMetric: ex.customMetric,
    note: ex.note,
  })),
});
