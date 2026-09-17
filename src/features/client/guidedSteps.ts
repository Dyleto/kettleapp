import { Session, SessionBlock, BlockExercise, BlockType } from '@/types';
import {
  getBlockLabel,
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
      /**
       * Un bloc entier, lu d'un coup.
       *
       * Retour du terrain : « pendant l'exercice, on devrait voir toutes les
       * infos d'un coup — pas 7 reps back squat, puis 120 s repos, puis
       * 6 reps… Et quand je suis rendu à l'AMRAP c'est pire, je ne vois
       * carrément pas tous les mouvements, c'est bloquant si je ne l'ai pas
       * écrit sur un cahier. »
       *
       * Il avait raison sur le fond : un AMRAP est une liste qu'on boucle,
       * pas une file d'attente. Le déroulé page par page a du sens là où une
       * minuterie impose le rythme — EMOM, Tabata, On/Off — et nulle part
       * ailleurs.
       *
       * Le bloc voyage entier plutôt que recopié : sa liste se rend avec la
       * carte de la fiche, celle que le client lit déjà avant de commencer.
       * Une seule écriture pour les deux écrans.
       */
      type: 'block';
      blockLabel: string;
      block: SessionBlock;
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

export function buildGuidedSteps(session: Session): GuidedStep[] {
  const steps: GuidedStep[] = [];
  const sortedBlocks = sortByOrder(session.blocks);

  sortedBlocks.forEach((block, blockIndex) => {
    const blockLabel = getBlockLabel(block.type);
    const exercises = sortByOrder(block.exercises);
    const nextBlockFirstExerciseName =
      sortedBlocks[blockIndex + 1]?.exercises[0]?.exercise.name ?? null;

    // La forme suit le bloc. Un rythme imposé par une minuterie se déroule
    // page à page, un grand chiffre au milieu de l'écran et les mains
    // occupées. Tout le reste est une liste, et se lit comme telle.
    const cadence =
      ROUND_BASED_TYPES.includes(block.type) && (block.rounds ?? 1) > 1;

    const blockSteps: GuidedStep[] = cadence
      ? buildRoundBasedSteps(
          block,
          exercises,
          blockLabel,
          nextBlockFirstExerciseName
        )
      : [{ type: 'block', blockLabel, block }];

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
