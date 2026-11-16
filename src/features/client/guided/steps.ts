import {
  Session,
  SessionBlock,
  BlockExercise,
  BlockType,
} from '@/shared/types';
import { getBlockLabel, blockSupportsRepsOnly } from '@/domain/session/blocks';
import {
  type GuidedSet,
  sortByOrder,
  setsOfBlock,
} from '@/domain/session/sets';

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
      /** Compté à partir de 1, comme on le dit à voix haute : « Tour 3 / 10 ».
       * Les rangs de l'éditeur partent de 1 eux aussi, donc rien à décaler. */
      round: number;
      /**
       * `null` : sans limite. Un EMOM dont le coach n'a pas fixé le nombre
       * de tours — « jusqu'à ce que ça casse » — tourne tant que le client
       * ne l'arrête pas. Il ne fait alors qu'une étape : ses tours ne se
       * dénombrent pas d'avance, c'est l'horloge qui les compte.
       */
      rounds: number | null;
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
    //
    // Un EMOM sans nombre de tours est sans limite, et se déroule lui aussi
    // tour par tour. Il tombait dans la liste : le client y cochait des
    // séries sans jamais voir de minute tourner. Un Tabata ou un On-Off en
    // ont toujours un — l'éditeur ne permet pas de le vider.
    const unbounded =
      (block.type === 'emom' || block.type === 'every') &&
      block.rounds === undefined;
    const timed =
      ROUND_BASED_TYPES.includes(block.type) &&
      (unbounded || (block.rounds ?? 1) > 1);

    let blockSteps: GuidedStep[];

    if (timed && unbounded) {
      blockSteps = [
        {
          type: 'round' as const,
          blockLabel,
          block,
          round: 1,
          rounds: null,
          exercises,
          ...roundTime(block),
          nextLabel: nextBlock ? getBlockLabel(nextBlock.type) : null,
        },
      ];
    } else if (timed) {
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

  // Une séance ne se termine pas sur un repos, et rien n'a à y veiller : un
  // repos n'est posé que `!isLastBlock`, donc les étapes du bloc suivant le
  // suivent toujours. Une boucle de dépilement vivait ici ; la retirer ne
  // faisait tomber aucun test, et pour une bonne raison — aucune séance ne
  // peut finir sur un repos, et aucun bloc ne produit zéro étape.
  return steps;
}
