import {
  Session,
  SessionBlock,
  BlockExercise,
  BlockType,
} from '@/shared/types';
import {
  getBlockLabel,
  blockSupportsRepsOnly,
  blockDefinesOwnMetrics,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
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

/**
 * Trois formes, et c'est le bloc qui décide laquelle.
 *
 *   timed — EMOM, Tabata, On/Off : l'horloge mène le tour, il s'enchaîne.
 *   list  — classique, pyramide, chipper, échauffement : on coche.
 *   loop  — AMRAP : une boucle ne se coche pas, on compte ses tours.
 *
 * La forme décide aussi du bouton principal, toujours au même endroit :
 * l'horloge l'actionne pour `timed`, « Fait » pour une liste, « +1 tour »
 * pour une boucle.
 */
export type BlockShape = 'timed' | 'list' | 'loop';

/** Une étape du mode guidé : un tour chronométré, une liste, une boucle, ou
 * un repos. */
export type GuidedStep =
  | {
      /**
       * Un tour, avec son horloge.
       *
       * Un EMOM est par définition à la minute : la minute part, on enchaîne
       * les mouvements du tour, et ce qu'il reste de la minute est le repos.
       * Le mode guidé en faisait tout autre chose — une page par mouvement,
       * sans horloge, puis une page « REPOS 1:00 ». Le client ne voyait
       * jamais la minute tourner, donc ne pouvait pas savoir s'il était en
       * avance ; et il prenait une minute entière que le coach n'avait pas
       * prescrite. Un EMOM de dix tours censé durer dix minutes en durait
       * vingt.
       *
       * L'unité est donc le tour, pas le mouvement. Cela rend l'horloge au
       * format, cela fournit enfin un « Tour 3 / 10 » à afficher — dix écrans
       * rigoureusement identiques étaient indiscernables — et cela fait
       * passer l'EMOM du jeu de test de trente étapes à dix.
       */
      type: 'round';
      blockLabel: string;
      block: SessionBlock;
      /** 1-indexed, as it is spoken: "Round 3 / 10". */
      round: number;
      rounds: number;
      /** Ce qu'il y a à faire dans ce tour, dans l'ordre. */
      exercises: BlockExercise[];
      /**
       * Le temps du tour.
       *
       * EMOM : tout l'intervalle — le repos est ce qu'il en reste, et le
       * gérer appartient au client, comme en salle. Tabata / On-Off : le
       * seul temps de travail, suivi de `restSeconds`, tous deux imposés.
       */
      workSeconds?: number;
      /** Le repos imposé après le travail. Absent sur un EMOM : voir
       * ci-dessus. */
      restSeconds?: number;
      /** Ce qui vient après le dernier tour. `null` tant qu'il en reste. */
      nextLabel: string | null;
    }
  | {
      /**
       * Un bloc entier, lu d'un coup.
       *
       * Retour du terrain : « pendant l'exercice on devrait voir toutes les
       * infos d'un coup — pas 7 reps back squat, puis 120 s de repos, puis 6
       * reps… Et quand j'arrive à l'AMRAP c'est pire, je ne vois tout
       * simplement pas tous les mouvements, ce qui me bloque si je ne l'ai
       * pas écrit sur un carnet. »
       *
       * Un AMRAP est une liste qu'on boucle, pas une file d'attente.
       */
      type: 'block';
      blockLabel: string;
      block: SessionBlock;
      /** `list` se coche, `loop` se compte. Jamais `timed` ici. */
      shape: Exclude<BlockShape, 'timed'>;
      /** Vide sur une boucle : un AMRAP ne se coche pas, il se compte. */
      sets: GuidedSet[];
    }
  | {
      type: 'rest';
      /** Le bloc auquel ce repos appartient — il compte dans sa progression. */
      blockLabel: string;
      duration: number;
      nextExerciseName: string | null;
    };

/**
 * Les blocs dont les tours sont menés par un minuteur : l'intervalle pour un
 * EMOM, le couple travail/repos pour un Tabata et un On-Off. Ce sont les
 * seuls où la forme « une page par tour » a du sens — ailleurs, c'est le
 * client qui mène.
 */
const ROUND_BASED_TYPES: BlockType[] = ['emom', 'every', 'tabata', 'onoff'];

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/** Le temps d'un tour, selon ce que le bloc impose. */
const roundTime = (
  block: SessionBlock
): { workSeconds?: number; restSeconds?: number } => {
  // Tabata / On-Off : le travail et le repos sont tous deux prescrits, à la
  // seconde près.
  if (blockSupportsRepsOnly(block.type)) {
    return { workSeconds: block.workDuration, restSeconds: block.restDuration };
  }
  // EMOM / Every : l'intervalle est le budget de tout le tour. C'est une
  // minute sauf mention contraire — c'est ce que « EMOM » veut dire.
  return { workSeconds: (block.intervalMinutes ?? 1) * 60 };
};

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
 * Les séries d'un bloc en liste, dans l'ordre où on les fait.
 *
 * Le découpage existait déjà — `prescribedSetLabels` le donne, et c'est
 * depuis toujours ce qui découpe le formulaire de bilan. Il n'était
 * simplement pas utilisé pour guider : on le montrait, on ne le parcourait
 * pas.
 */
export const setsOfBlock = (block: SessionBlock): GuidedSet[] => {
  const sets: GuidedSet[] = [];
  sortByOrder(block.exercises).forEach((ex) => {
    const rungs = prescribedSetLabels(block, ex);
    const own = roundDose(block, ex);
    // Une pyramide prescrit un repos entre ses paliers, un bloc à séries
    // entre ses séries : c'est le même moment sous deux noms.
    const rest = blockDefinesOwnMetrics(block.type)
      ? block.restBetweenRounds
      : restBetweenSetsOf(block, ex);
    rungs.forEach((label, i) => {
      sets.push({
        key: `${block.order}:${ex.order}:${i + 1}`,
        blockOrder: block.order,
        exerciseOrder: ex.order,
        rank: i + 1,
        total: rungs.length,
        name: ex.exercise.name,
        // Le palier porte sa propre dose ; ailleurs c'est celle de
        // l'exercice.
        dose: label || own,
        reps: repsOfSet(block, ex, i + 1),
        // Pas de repos après le dernier : l'exercice suivant vient alors,
        // et le coach n'a rien prescrit pour cet intervalle.
        restAfter: i < rungs.length - 1 ? rest : undefined,
        exercise: ex,
      });
    });
  });
  return sets;
};

/**
 * Découpe une séance en étapes guidées.
 *
 * Pure, et c'est ce qui la rend vérifiable : une séance entre, une liste
 * d'étapes sort, sans horloge ni écran. Tout ce que le mode guidé affiche en
 * découle — la barre de progression, ce qui se coche, ce qui se compte.
 */
export function buildGuidedSteps(session: Session): GuidedStep[] {
  const steps: GuidedStep[] = [];
  const sortedBlocks = sortByOrder(session.blocks);

  sortedBlocks.forEach((block, blockIndex) => {
    const blockLabel = getBlockLabel(block.type);
    const exercises = sortByOrder(block.exercises);
    const nextBlock = sortedBlocks[blockIndex + 1];
    const nextBlockFirstExerciseName =
      nextBlock?.exercises[0]?.exercise.name ?? null;

    // La forme suit le bloc. Un rythme mené par un minuteur se déroule tour
    // par tour, l'horloge au milieu de l'écran et les mains occupées. Tout le
    // reste est une liste, et se lit comme telle.
    const timed =
      ROUND_BASED_TYPES.includes(block.type) && (block.rounds ?? 1) > 1;

    let blockSteps: GuidedStep[];

    if (timed) {
      const rounds = block.rounds ?? 1;
      const { workSeconds, restSeconds } = roundTime(block);
      blockSteps = Array.from({ length: rounds }, (_, i) => ({
        type: 'round' as const,
        blockLabel,
        block,
        round: i + 1,
        rounds,
        exercises,
        workSeconds,
        restSeconds,
        // Tant qu'il reste des tours, le compteur suffit à dire ce qui
        // vient.
        nextLabel:
          i === rounds - 1
            ? nextBlock
              ? getBlockLabel(nextBlock.type)
              : null
            : null,
      }));
    } else {
      // Un AMRAP ne se coche pas : on boucle la liste jusqu'à la fin du
      // temps, et ce qui compte est le nombre de tours. Tout le reste —
      // classique, pyramide, chipper, échauffement — est une suite de séries
      // faites une à une.
      const shape = block.type === 'amrap' ? 'loop' : 'list';
      blockSteps = [
        {
          type: 'block',
          blockLabel,
          block,
          shape,
          sets: shape === 'list' ? setsOfBlock(block) : [],
        },
      ];
    }

    steps.push(...blockSteps);

    // Repos entre deux blocs : uniquement quand le coach a réellement défini
    // une durée, jamais une valeur inventée. Un bloc chronométré porte déjà
    // son repos dans ses tours — en ajouter un autre recréerait la minute
    // fantôme qu'on vient de retirer.
    const isLastBlock = blockIndex === sortedBlocks.length - 1;
    const interBlockRest = timed
      ? undefined
      : (block.restDuration ?? block.restBetweenRounds);

    if (!isLastBlock && interBlockRest) {
      // Ce repos est la queue du bloc qui vient de finir — c'est sa
      // propre durée — il compte donc dans la progression de ce bloc-là, pas
      // du suivant.
      steps.push({
        type: 'rest',
        blockLabel,
        duration: interBlockRest,
        nextExerciseName: nextBlockFirstExerciseName,
      });
    }
  });

  // Une séance ne se termine pas sur un repos : le dernier tour du dernier
  // bloc est fait, il ne reste rien avant quoi souffler.
  while (steps[steps.length - 1]?.type === 'rest') {
    steps.pop();
  }

  return steps;
}
