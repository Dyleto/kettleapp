import { Session, SessionBlock, BlockExercise, BlockType } from '@/types';
import {
  getBlockLabel,
  blockSupportsRepsOnly,
  blockDefinesOwnMetrics,
  prescribedSetLabels,
  restBetweenSetsOf,
} from '@/features/program/constants';
import { formatDuration } from '@/utils/formatters';

/**
 * Un effort : une chose qu'on fait, et qui peut être faite.
 *
 * Le mode guidé n'avait qu'un modèle de « où est le curseur » — un index
 * qui avance dans une liste d'écrans. C'est le modèle d'un diaporama. Un
 * diaporama avance ; un carnet d'entraînement enregistre. D'où tous les
 * symptômes : rien ne se cochait, l'avancement comptait des pages, la reprise
 * parlait en « étape 5 sur 12 », et le bilan s'ouvrait sur « renseigne ce
 * dont tu te souviens » — l'aveu que l'application n'avait rien retenu.
 *
 * L'effort est l'unité qui manquait : une série, un palier, un mouvement d'un
 * chipper. Le travail du client est de les faire passer de « à faire » à
 * « fait », et c'est le même geste partout.
 */
export interface Effort {
  /** Identité stable : c'est elle qui porte l'état, et qui survit au rechargement. */
  cle: string;
  blockOrder: number;
  exerciseOrder: number;
  /** 1-indexé, tel qu'on le dit : « série 2 / 4 », « palier 3 ». */
  rang: number;
  /** Combien cet exercice en porte — le « / 4 ». */
  total: number;
  nom: string;
  /** Ce qu'il y a à faire : « 10 reps », ou « 8 reps » sur un palier. */
  dose: string;
  /**
   * Les répétitions prescrites, en nombre — quand il y en a.
   *
   * La dose est du texte, faite pour être lue. Le tonnage a besoin du
   * nombre : le mode guidé ne demande qu'un poids par effort, jamais des
   * reps, parce que cocher « Fait » dit déjà qu'on a fait ce qui était
   * prescrit. Sans ce champ, « tant de kilos soulevés » ne pourrait jamais
   * s'afficher sur une séance menée en guidé — c'est-à-dire presque jamais.
   */
  reps?: number;
  /** Le repos prescrit après cet effort, s'il y en a un. */
  reposApres?: number;
  /** L'exercice d'où il vient — pour sa consigne et sa vidéo. */
  exercice: BlockExercise;
}

/**
 * Trois formes, et le bloc décide laquelle.
 *
 *   cadence — EMOM, Tabata, On/Off : l'horloge mène le tour, elle enchaîne.
 *   liste   — classique, pyramide, chipper, échauffement : on coche.
 *   boucle  — AMRAP : on ne coche pas une boucle, on compte ses tours.
 *
 * La forme décide aussi du bouton principal, toujours à la même place :
 * l'horloge le presse pour la cadence, « Fait » pour la liste, « +1 tour »
 * pour la boucle.
 */
export type FormeDeBloc = 'cadence' | 'liste' | 'boucle';

export type GuidedStep =
  | {
      /**
       * Un tour, avec son horloge.
       *
       * Un EMOM est à la minute par définition : la minute part, on enchaîne
       * les mouvements du tour, et ce qu'il reste de la minute est le repos.
       * Le mode guidé en faisait tout autre chose — une page par mouvement,
       * sans horloge, puis une page « REPOS 1:00 ». Le client ne voyait jamais
       * la minute courir, donc ne pouvait pas savoir s'il était en avance ; et
       * il prenait une minute pleine que le coach n'avait pas prescrite. Un
       * EMOM de dix tours censé durer dix minutes en durait vingt.
       *
       * L'unité est donc le tour, pas le mouvement. Ça rend l'horloge au
       * format, ça donne enfin un « Tour 3 / 10 » à afficher — dix écrans
       * rigoureusement identiques devenaient indiscernables —, et ça ramène
       * l'EMOM de test de trente étapes à dix.
       */
      type: 'round';
      blockLabel: string;
      block: SessionBlock;
      /** 1-indexé, tel qu'on le dit : « Tour 3 / 10 ». */
      round: number;
      rounds: number;
      /** Ce qu'il y a à faire dans ce tour, dans l'ordre. */
      exercises: BlockExercise[];
      /**
       * Le temps du tour.
       *
       * EMOM : l'intervalle entier — le repos est ce qu'il en reste, et c'est
       * au client de le gérer, comme dans la salle. Tabata / On-Off : le temps
       * de travail seul, suivi de `restSeconds`, tous deux imposés.
       */
      workSeconds?: number;
      /** Le repos imposé après le travail. Absent sur un EMOM : voir ci-dessus. */
      restSeconds?: number;
      /** Ce qui vient après le dernier tour. `null` tant qu'il en reste. */
      nextLabel: string | null;
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
       * Un AMRAP est une liste qu'on boucle, pas une file d'attente.
       */
      type: 'block';
      blockLabel: string;
      block: SessionBlock;
      /** `liste` on coche, `boucle` on compte. Jamais `cadence` ici. */
      forme: Exclude<FormeDeBloc, 'cadence'>;
      /** Vide sur une boucle : un AMRAP ne se coche pas, il se compte. */
      efforts: Effort[];
    }
  | {
      type: 'rest';
      /** Le bloc auquel ce repos appartient — il compte dans son avancement. */
      blockLabel: string;
      duration: number;
      nextExerciseName: string | null;
    };

/**
 * Les blocs dont une minuterie mène le tour : l'intervalle pour l'EMOM, le
 * couple travail/repos pour le Tabata et l'On-Off. Ce sont les seuls où la
 * forme « une page par tour » a un sens — ailleurs, c'est le client qui mène.
 */
const ROUND_BASED_TYPES: BlockType[] = ['emom', 'every', 'tabata', 'onoff'];

const sortByOrder = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

/** Le temps d'un tour, selon ce que le bloc impose. */
const tempsDuTour = (
  block: SessionBlock
): { workSeconds?: number; restSeconds?: number } => {
  // Tabata / On-Off : travail et repos sont tous deux prescrits, à la seconde.
  if (blockSupportsRepsOnly(block.type)) {
    return { workSeconds: block.workDuration, restSeconds: block.restDuration };
  }
  // EMOM / Every : l'intervalle est le budget du tour entier. Il vaut une
  // minute sauf mention contraire — c'est ce que « EMOM » veut dire.
  return { workSeconds: (block.intervalMinutes ?? 1) * 60 };
};

/**
 * La dose d'un mouvement pour *un* tour — sans le « n × ».
 *
 * Le total est porté par « Tour 3 / 10 » : le répéter sur chaque ligne
 * ferait lire « 10 × 15 reps » à quelqu'un qui n'a qu'un tour à faire.
 */
export const doseDuTour = (block: SessionBlock, ex: BlockExercise): string => {
  if (ex.reps) return `${ex.reps} reps`;
  if (ex.duration) return formatDuration(ex.duration);
  if (ex.customMetric)
    return `${ex.customMetric.value} ${ex.customMetric.unit}`;
  // Tabata / On-Off : sans reps prescrites, la dose est le temps de travail
  // du bloc — c'est lui qui dit combien on en fait.
  if (blockSupportsRepsOnly(block.type) && block.workDuration !== undefined)
    return formatDuration(block.workDuration);
  return '';
};

/**
 * Les efforts d'un bloc-liste, dans l'ordre où on les fait.
 *
 * La décomposition existait déjà — `prescribedSetLabels` la donne, et c'est
 * elle qui découpe la saisie du bilan depuis toujours. Elle ne servait
 * simplement pas à guider : on la montrait, on ne la parcourait pas.
 */
/**
 * Les répétitions prescrites pour un effort, en nombre.
 *
 * Une pyramide les fait varier d'un palier à l'autre — c'est tout son
 * principe ; partout ailleurs, chaque série porte la même dose.
 */
export const repsDeLEffort = (
  block: Pick<SessionBlock, 'type' | 'repsScheme'>,
  ex: Pick<BlockExercise, 'reps'>,
  rang: number
): number | undefined => {
  if (blockDefinesOwnMetrics(block.type) && block.repsScheme?.length)
    return block.repsScheme[rang - 1];
  return ex.reps;
};

export const effortsDuBloc = (block: SessionBlock): Effort[] => {
  const efforts: Effort[] = [];
  sortByOrder(block.exercises).forEach((ex) => {
    const paliers = prescribedSetLabels(block, ex);
    const propre = doseDuTour(block, ex);
    // Une pyramide prescrit un repos entre ses paliers, un bloc à séries entre
    // ses séries : c'est le même moment, sous deux noms.
    const repos = blockDefinesOwnMetrics(block.type)
      ? block.restBetweenRounds
      : restBetweenSetsOf(block, ex);
    paliers.forEach((libelle, i) => {
      efforts.push({
        cle: `${block.order}:${ex.order}:${i + 1}`,
        blockOrder: block.order,
        exerciseOrder: ex.order,
        rang: i + 1,
        total: paliers.length,
        nom: ex.exercise.name,
        // Le palier porte sa propre dose ; ailleurs c'est celle de l'exercice.
        dose: libelle || propre,
        reps: repsDeLEffort(block, ex, i + 1),
        // Pas de repos après le dernier : c'est l'exercice suivant qui vient,
        // et le coach n'a rien prescrit pour cet intervalle-là.
        reposApres: i < paliers.length - 1 ? repos : undefined,
        exercice: ex,
      });
    });
  });
  return efforts;
};

export function buildGuidedSteps(session: Session): GuidedStep[] {
  const steps: GuidedStep[] = [];
  const sortedBlocks = sortByOrder(session.blocks);

  sortedBlocks.forEach((block, blockIndex) => {
    const blockLabel = getBlockLabel(block.type);
    const exercises = sortByOrder(block.exercises);
    const blocSuivant = sortedBlocks[blockIndex + 1];
    const nextBlockFirstExerciseName =
      blocSuivant?.exercises[0]?.exercise.name ?? null;

    // La forme suit le bloc. Un rythme mené par une minuterie se déroule tour
    // par tour, l'horloge au milieu de l'écran et les mains occupées. Tout le
    // reste est une liste, et se lit comme telle.
    const cadence =
      ROUND_BASED_TYPES.includes(block.type) && (block.rounds ?? 1) > 1;

    let blockSteps: GuidedStep[];

    if (cadence) {
      const rounds = block.rounds ?? 1;
      const { workSeconds, restSeconds } = tempsDuTour(block);
      blockSteps = Array.from({ length: rounds }, (_, i) => ({
        type: 'round' as const,
        blockLabel,
        block,
        round: i + 1,
        rounds,
        exercises,
        workSeconds,
        restSeconds,
        // Tant qu'il reste des tours, le compteur suffit à dire ce qui suit.
        nextLabel:
          i === rounds - 1
            ? blocSuivant
              ? getBlockLabel(blocSuivant.type)
              : null
            : null,
      }));
    } else {
      // Un AMRAP ne se coche pas : on boucle la liste jusqu'à la fin du
      // temps, et ce qui compte est le nombre de tours. Tout le reste —
      // classique, pyramide, chipper, échauffement — est une suite
      // d'efforts qu'on fait un par un.
      const forme = block.type === 'amrap' ? 'boucle' : 'liste';
      blockSteps = [
        {
          type: 'block',
          blockLabel,
          block,
          forme,
          efforts: forme === 'liste' ? effortsDuBloc(block) : [],
        },
      ];
    }

    steps.push(...blockSteps);

    // Repos entre deux blocs : seulement si le coach a réellement défini une
    // durée, jamais une valeur inventée. Un bloc à cadence porte déjà son
    // repos dans ses tours — lui en ajouter un autre reviendrait à recréer la
    // minute fantôme qu'on vient de retirer.
    const isLastBlock = blockIndex === sortedBlocks.length - 1;
    const interBlockRest = cadence
      ? undefined
      : (block.restDuration ?? block.restBetweenRounds);

    if (!isLastBlock && interBlockRest) {
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
