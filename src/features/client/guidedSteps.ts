import { Session, SessionBlock, BlockExercise, BlockType } from '@/types';
import {
  getBlockLabel,
  blockSupportsSets,
  blockDefinesOwnMetrics,
  blockSupportsRepsOnly,
} from '@/features/program/constants';
import { formatDuration } from '@/utils/formatters';

export type GuidedStep =
  | {
      type: 'exercise';
      blockLabel: string;
      exerciseName: string;
      exerciseId: string;
      /** La technique du mouvement, telle qu'elle vit dans la bibliothèque. */
      description?: string;
      /** Ce que le coach a écrit pour cet exercice, dans cette séance-là. */
      coachNote?: string;
      videoUrl?: string;
      metric: string;
      /**
       * Durée de l'effort en secondes quand il est chronométré. Le mode guidé
       * décompte alors à l'écran, puis s'arrête et attend : c'est le client qui
       * décide de passer à la suite, jamais l'horloge.
       */
      workSeconds?: number;
      /** Rang de la série (1-indexé) quand l'exercice en compte plusieurs. */
      setIndex?: number;
      setCount?: number;
    }
  | {
      type: 'rest';
      /** Le bloc auquel ce repos appartient — il compte dans son avancement. */
      blockLabel: string;
      duration: number;
      nextExerciseName: string | null;
    };

// Blocs dont les tours (rounds) sont chronométrés au niveau du bloc plutôt
// que par exercice : EMOM/Every (intervalle) et Tabata/On-Off (travail/repos).
const ROUND_BASED_TYPES: BlockType[] = ['emom', 'every', 'tabata', 'onoff'];

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

type Effort = { metric: string; workSeconds?: number };

// L'effort d'*une* série, sans le « n × » : le mode guidé déroule les séries
// une par une, le total est porté par « Série 2 / 4 » et non par la métrique.
const singleEffort = (ex: BlockExercise): Effort => {
  if (ex.reps) return { metric: `${ex.reps} reps` };
  if (ex.duration)
    return { metric: formatDuration(ex.duration), workSeconds: ex.duration };
  if (ex.customMetric)
    return { metric: `${ex.customMetric.value} ${ex.customMetric.unit}` };
  return { metric: '' };
};

const pushExerciseSteps = (
  steps: GuidedStep[],
  exercises: BlockExercise[],
  blockLabel: string,
  effortOf: (ex: BlockExercise) => Effort
) => {
  exercises.forEach((ex) => {
    steps.push({
      type: 'exercise',
      blockLabel,
      exerciseName: ex.exercise.name,
      exerciseId: ex.exercise._id,
      description: ex.exercise.description,
      coachNote: ex.note,
      videoUrl: ex.exercise.videoUrl,
      ...effortOf(ex),
    });
  });
};

// Séries : « 4 × 12 reps » sur le programme est un raccourci d'écriture, pas
// une page. Pendant l'effort on veut savoir où on en est — série 2 sur 4 — et
// souffler entre les deux, donc chaque série a sa page et son repos.
const buildSetBasedSteps = (
  block: SessionBlock,
  exercises: BlockExercise[],
  blockLabel: string
): GuidedStep[] => {
  const steps: GuidedStep[] = [];

  exercises.forEach((ex) => {
    const effort = singleEffort(ex);
    const setCount =
      blockSupportsSets(block.type) && ex.sets && ex.sets > 1 ? ex.sets : 1;

    for (let set = 1; set <= setCount; set++) {
      steps.push({
        type: 'exercise',
        blockLabel,
        exerciseName: ex.exercise.name,
        exerciseId: ex.exercise._id,
        description: ex.exercise.description,
        coachNote: ex.note,
        videoUrl: ex.exercise.videoUrl,
        ...effort,
        ...(setCount > 1 ? { setIndex: set, setCount } : {}),
      });

      // Jamais de repos inventé : seulement celui que le coach a écrit.
      if (set < setCount && ex.restBetweenSets) {
        steps.push({
          type: 'rest',
          blockLabel,
          duration: ex.restBetweenSets,
          nextExerciseName: ex.exercise.name,
        });
      }
    }
  });

  return steps;
};

// EMOM/Every (chronométré par intervalle) et Tabata/On-Off (travail/repos) :
// on répète le passage sur les exercices du bloc `rounds` fois, avec un
// repos réel entre chaque tour.
const buildRoundBasedSteps = (
  block: SessionBlock,
  exercises: BlockExercise[],
  blockLabel: string,
  nextBlockFirstExerciseName: string | null
): GuidedStep[] => {
  const steps: GuidedStep[] = [];
  const rounds = block.rounds ?? 1;
  const isWorkRest = blockSupportsRepsOnly(block.type);
  const intervalSeconds = (block.intervalMinutes ?? 1) * 60;

  const effortOf = isWorkRest
    ? (ex: BlockExercise): Effort =>
        ex.reps
          ? { metric: `${ex.reps} reps` }
          : block.workDuration !== undefined
            ? {
                metric: formatDuration(block.workDuration),
                workSeconds: block.workDuration,
              }
            : { metric: '' }
    : singleEffort;

  for (let round = 1; round <= rounds; round++) {
    pushExerciseSteps(steps, exercises, blockLabel, effortOf);

    const isLastRound = round === rounds;
    const restDuration = isWorkRest ? block.restDuration : intervalSeconds;
    if (restDuration) {
      steps.push({
        type: 'rest',
        blockLabel,
        duration: restDuration,
        nextExerciseName: isLastRound
          ? nextBlockFirstExerciseName
          : (exercises[0]?.exercise.name ?? null),
      });
    }
  }

  return steps;
};

// Pyramide/Échelle : le nombre de reps change à chaque tour selon
// `repsScheme` (ex. 2-4-6-8-6-4-2), pas selon la config de l'exercice.
const buildSchemeBasedSteps = (
  block: SessionBlock,
  exercises: BlockExercise[],
  blockLabel: string,
  nextBlockFirstExerciseName: string | null
): GuidedStep[] => {
  const steps: GuidedStep[] = [];
  const scheme =
    block.repsScheme && block.repsScheme.length > 0
      ? block.repsScheme
      : [undefined];

  scheme.forEach((reps, i) => {
    pushExerciseSteps(steps, exercises, blockLabel, () => ({
      metric: reps !== undefined ? `${reps} reps` : '',
    }));

    const isLastStep = i === scheme.length - 1;
    if (block.restBetweenRounds) {
      steps.push({
        type: 'rest',
        blockLabel,
        duration: block.restBetweenRounds,
        nextExerciseName: isLastStep
          ? nextBlockFirstExerciseName
          : (exercises[0]?.exercise.name ?? null),
      });
    }
  });

  return steps;
};

export function buildGuidedSteps(session: Session): GuidedStep[] {
  const steps: GuidedStep[] = [];
  const sortedBlocks = sortByOrder(session.blocks);

  sortedBlocks.forEach((block, blockIndex) => {
    const blockLabel = getBlockLabel(block.type);
    const exercises = sortByOrder(block.exercises);
    const nextBlockFirstExerciseName =
      sortedBlocks[blockIndex + 1]?.exercises[0]?.exercise.name ?? null;

    let blockSteps: GuidedStep[];
    if (blockDefinesOwnMetrics(block.type)) {
      blockSteps = buildSchemeBasedSteps(
        block,
        exercises,
        blockLabel,
        nextBlockFirstExerciseName
      );
    } else if (
      ROUND_BASED_TYPES.includes(block.type) &&
      (block.rounds ?? 1) > 1
    ) {
      blockSteps = buildRoundBasedSteps(
        block,
        exercises,
        blockLabel,
        nextBlockFirstExerciseName
      );
    } else {
      blockSteps = buildSetBasedSteps(block, exercises, blockLabel);
    }

    steps.push(...blockSteps);

    // Repos entre deux blocs : seulement si le coach a réellement défini une
    // durée, jamais une valeur inventée — et jamais deux repos d'affilée si
    // le bloc vient déjà de terminer sur un repos de tour.
    const isLastBlock = blockIndex === sortedBlocks.length - 1;
    const endsWithRest = blockSteps[blockSteps.length - 1]?.type === 'rest';
    const interBlockRest = block.restDuration ?? block.restBetweenRounds;

    if (!isLastBlock && !endsWithRest && interBlockRest) {
      // Ce repos est la queue du bloc qui vient de finir — c'est sa durée à
      // lui — donc il compte dans son avancement, pas dans celui du suivant.
      steps.push({
        type: 'rest',
        blockLabel,
        duration: interBlockRest,
        nextExerciseName: nextBlockFirstExerciseName,
      });
    }
  });

  // La séance ne se termine pas sur un repos : le dernier tour du dernier bloc
  // est fini, il n'y a plus rien après quoi souffler.
  while (steps[steps.length - 1]?.type === 'rest') {
    steps.pop();
  }

  return steps;
}
