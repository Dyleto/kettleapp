import { SessionBlock, BlockExercise } from '@/shared/types';
import {
  blockSupportsRepsOnly,
  blockDefinesOwnMetrics,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/domain/session/blocks';
import { formatDuration } from '@/shared/utils/formatters';

/**
 * Une série : une chose qu'on fait, et qui peut être faite.
 *
 * Le mode guidé n'a jamais eu qu'un modèle de « où est le curseur » — un
 * index qui avance dans une liste d'écrans. C'est le modèle d'un diaporama.
 * Un diaporama avance ; un carnet d'entraînement enregistre. D'où tous les
 * symptômes : rien ne pouvait être coché, la barre de progression comptait
 * des pages, la reprise parlait en « étape 5 sur 12 », et le bilan s'ouvrait
 * sur « remplis ce dont tu te souviens » — l'aveu que l'application n'avait
 * rien retenu.
 *
 * La série est l'unité qui manquait : une série, un palier de pyramide, un
 * mouvement d'un chipper. Le travail du client est de les faire passer de
 * « à faire » à « fait », et c'est le même geste partout.
 */
export interface GuidedSet {
  /** Identité stable : c'est elle qui porte l'état, et elle survit à un
   * rechargement. */
  key: string;
  blockOrder: number;
  exerciseOrder: number;
  /** Compté à partir de 1, comme on le dit : « série 2 / 4 », « palier 3 ». */
  rank: number;
  /** Combien l'exercice en porte — le « / 4 ». */
  total: number;
  name: string;
  /** Ce qu'il y a à faire : « 10 reps », ou « 8 reps » sur un palier. */
  dose: string;
  /**
   * Les répétitions prescrites, sous forme de nombre — quand il y en a.
   *
   * La dose est du texte, faite pour être lue. Le tonnage a besoin du
   * nombre : le mode guidé ne demande qu'une charge par série, jamais de
   * répétitions, parce que cocher « fait » dit déjà que le travail prescrit a
   * été fait. Sans ce champ, « tant de kilos soulevés » ne pourrait jamais
   * apparaître sur une séance menée en mode guidé — c'est-à-dire presque
   * jamais.
   */
  reps?: number;
  /** Le repos prescrit après cette série, s'il y en a un. */
  restAfter?: number;
  /** L'exercice dont elle vient — pour ses consignes et sa vidéo. */
  exercise: BlockExercise;
}

/** Dans l'ordre que le coach a donné : blocs, exercices, séances. */
export const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/**
 * La dose d'un mouvement pour *un* tour — sans le « n × ».
 *
 * Le total est porté par « Tour 3 / 10 » : le répéter sur chaque ligne se
 * lirait « 10 × 15 reps » pour quelqu'un qui n'a qu'un tour à faire.
 */
export const roundDose = (block: SessionBlock, ex: BlockExercise): string => {
  if (ex.reps) return `${ex.reps} reps`;
  if (ex.duration) return formatDuration(ex.duration);
  if (ex.customMetric)
    return `${ex.customMetric.value} ${ex.customMetric.unit}`;
  // Tabata / On-Off : sans répétitions prescrites, la dose est le temps de
  // travail du bloc — c'est lui qui dit combien on en fait.
  if (blockSupportsRepsOnly(block.type) && block.workDuration !== undefined)
    return formatDuration(block.workDuration);
  return '';
};

/**
 * Les répétitions prescrites pour une série, sous forme de nombre.
 *
 * Une pyramide les fait varier d'un palier à l'autre — c'est tout son
 * principe ; partout ailleurs, chaque série porte la même dose.
 */
export const repsOfSet = (
  block: Pick<SessionBlock, 'type' | 'repsScheme'>,
  ex: Pick<BlockExercise, 'reps'>,
  rank: number
): number | undefined => {
  if (blockDefinesOwnMetrics(block.type) && block.repsScheme?.length)
    return block.repsScheme[rank - 1];
  return ex.reps;
};

/**
 * Une série du bloc, posée depuis son exercice et son rang.
 *
 * Partagée par les deux ordres de parcours ci-dessous, qui ne diffèrent que
 * par l'ordre et par le moment du repos.
 */
const setAt = (
  block: SessionBlock,
  ex: BlockExercise,
  rank: number,
  total: number,
  label: string,
  restAfter?: number
): GuidedSet => ({
  // La clé ne dépend pas de l'ordre de parcours : une séance reprise garde
  // donc ses séries cochées même si cet ordre change.
  key: `${block.order}:${ex.order}:${rank}`,
  blockOrder: block.order,
  exerciseOrder: ex.order,
  rank,
  total,
  name: ex.exercise.name,
  // Le palier porte sa propre dose ; ailleurs c'est celle de l'exercice.
  dose: label || roundDose(block, ex),
  reps: repsOfSet(block, ex, rank),
  restAfter,
  exercise: ex,
});

/**
 * Une pyramide se fait palier par palier, tous mouvements confondus.
 *
 * Retour du terrain : « le Pyramide ne fonctionne pas comme espéré, il
 * marche que pour 1 exo et pas plusieurs ». Il déroulait toute la pyramide du
 * premier exercice, puis toute celle du second : sur `5·10·15` avec tractions
 * et pompes, cela donnait 5-10-15 tractions puis 5-10-15 pompes. Ce qu'un
 * coach écrit là est 5 tractions + 5 pompes, puis 10 + 10, puis 15 + 15 —
 * c'est le principe même du format, et c'est pour cela qu'il paraissait ne
 * marcher qu'à un seul mouvement : à un seul, les deux ordres coïncident.
 *
 * Le repos appartient donc à la fin du palier et non à la fin de chaque
 * exercice : il n'y a rien à récupérer entre deux mouvements du même palier,
 * c'est justement ce qui les enchaîne.
 */
const rungMajorSets = (
  block: SessionBlock,
  exercises: BlockExercise[]
): GuidedSet[] => {
  const sets: GuidedSet[] = [];
  // Le schéma vit sur le bloc : tous les exercices ont les mêmes paliers,
  // en nombre comme en dose.
  const rungs = prescribedSetLabels(block, exercises[0] ?? { sets: 1 });

  rungs.forEach((label, i) => {
    exercises.forEach((ex, j) => {
      const isLastOfRung = j === exercises.length - 1;
      sets.push(
        setAt(
          block,
          ex,
          i + 1,
          rungs.length,
          label,
          // Pas de repos après le dernier palier : le bloc suivant vient
          // alors, et le coach n'a rien prescrit pour cet intervalle.
          isLastOfRung && i < rungs.length - 1
            ? block.restBetweenRounds
            : undefined
        )
      );
    });
  });
  return sets;
};

/**
 * Partout ailleurs, un exercice se finit avant qu'on passe au suivant.
 *
 * C'est l'ordre de la musculation : trois séries de squat, puis trois séries
 * de développé. Le repos tombe entre les séries d'un même exercice.
 */
const exerciseMajorSets = (
  block: SessionBlock,
  exercises: BlockExercise[]
): GuidedSet[] => {
  const sets: GuidedSet[] = [];
  exercises.forEach((ex) => {
    const rungs = prescribedSetLabels(block, ex);
    const rest = restBetweenSetsOf(block, ex);
    rungs.forEach((label, i) => {
      sets.push(
        setAt(
          block,
          ex,
          i + 1,
          rungs.length,
          label,
          i < rungs.length - 1 ? rest : undefined
        )
      );
    });
  });
  return sets;
};

/**
 * Les séries d'un bloc en liste, dans l'ordre où on les fait.
 *
 * Le découpage existait déjà — `prescribedSetLabels` le donne, et c'est
 * depuis toujours ce qui découpe le formulaire de bilan. Il n'était
 * simplement pas utilisé pour guider : on le montrait, on ne le parcourait
 * pas.
 *
 * Deux ordres, parce que deux formats : une pyramide monte ses paliers avec
 * tous ses mouvements, un bloc à séries finit un mouvement avant le suivant.
 */
export const setsOfBlock = (block: SessionBlock): GuidedSet[] => {
  const exercises = sortByOrder(block.exercises);
  return blockDefinesOwnMetrics(block.type)
    ? rungMajorSets(block, exercises)
    : exerciseMajorSets(block, exercises);
};
