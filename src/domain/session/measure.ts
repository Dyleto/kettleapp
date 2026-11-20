import {
  BlockType,
  CompletedSession,
  Session,
  SessionBlock,
} from '@/shared/types';
import {
  blockDefinesOwnMetrics,
  blockSupportsRepsOnly,
  getBlockLabel,
} from '@/domain/session/blocks';
import { setsOfBlock, sortByOrder } from '@/domain/session/sets';

const plural = (count: number, word: string): string =>
  `${count} ${word}${count > 1 ? 's' : ''}`;

/**
 * Combien de mouvements différents la séance demande.
 *
 * Un même mouvement repris dans deux blocs compte une fois : « 3 exercices »
 * dit ce qu'il faudra savoir faire, pas combien de lignes le coach a écrites.
 */
export const distinctExerciseCount = (session: Session): number =>
  new Set(
    session.blocks.flatMap((block) =>
      block.exercises.map((entry) => entry.exercise._id)
    )
  ).size;

/** Le nom qu'un bloc porte à l'écran : celui que le coach lui a donné, sinon
 * celui de son format. */
export const blockTitle = (
  block: Pick<SessionBlock, 'type' | 'label'>
): string => block.label?.trim() || getBlockLabel(block.type);

/** Les blocs que l'horloge mène tour par tour : ils se comptent en tours,
 * et la fiche comme la séance guidée les dessinent autrement. */
export const isRoundBased = (block: SessionBlock): boolean =>
  ['emom', 'every', 'tabata', 'onoff'].includes(block.type);

/**
 * Le temps qu'un bloc prend quand son format le fixe, en secondes.
 *
 * `undefined` quand rien ne le fixe : un bloc classique dure ce que le
 * client met à le faire, et on ne l'invente pas ici.
 */
const fixedSeconds = (block: SessionBlock): number | undefined => {
  if (isRoundBased(block)) {
    // Un EMOM sans nombre de tours dure ce que le client décide : rien ne
    // le fixe.
    if (block.rounds === undefined && !blockSupportsRepsOnly(block.type))
      return undefined;
    const rounds = block.rounds ?? 1;
    if (blockSupportsRepsOnly(block.type)) {
      return rounds * ((block.workDuration ?? 0) + (block.restDuration ?? 0));
    }
    return rounds * (block.intervalMinutes ?? 1) * 60;
  }
  if (block.durationMinutes) return block.durationMinutes * 60;
  return undefined;
};

/** « 4 min », « 1 min 30 » ne sert pas ici : un repère se lit d'un coup
 * d'œil, à la minute près. */
const wholeMinutes = (seconds: number): string =>
  `${Math.max(1, Math.round(seconds / 60))} min`;

/**
 * Le repère d'un bloc, à droite de son nom : « 8 tours · 4 min »,
 * « 7 séries », « 12 min ».
 *
 * Il dit l'unité dans laquelle le bloc se compte, et c'est le format qui la
 * donne : des tours quand l'horloge mène, une durée quand elle borne, des
 * séries, des paliers ou des mouvements quand c'est le client qui avance.
 */
export const blockMarker = (block: SessionBlock): string => {
  const seconds = fixedSeconds(block);

  if (isRoundBased(block)) {
    if (block.rounds === undefined && !blockSupportsRepsOnly(block.type))
      return 'sans limite';
    const rounds = plural(block.rounds ?? 1, 'tour');
    return seconds ? `${rounds} · ${wholeMinutes(seconds)}` : rounds;
  }
  if (block.type === 'amrap') {
    return seconds ? wholeMinutes(seconds) : 'sans limite';
  }

  const sets = setsOfBlock(block);
  const count = (): string => {
    if (blockDefinesOwnMetrics(block.type)) {
      return plural(block.repsScheme?.length ?? 0, 'palier');
    }
    if (block.type === 'chipper' || block.type === 'timecap') {
      return plural(block.exercises.length, 'mouvement');
    }
    // Un échauffement d'une série par mouvement se compte en exercices :
    // « 2 séries » pour corde à sauter puis mountain climbers ne dirait rien.
    const everySingle = sets.every((set) => set.total === 1);
    return everySingle
      ? plural(sets.length, 'exercice')
      : plural(sets.length, 'série');
  };
  return seconds ? `${count()} · ${wholeMinutes(seconds)}` : count();
};

/** Ce qu'une série prend quand rien ne le dit : le temps d'une dizaine de
 * répétitions posées. Mesuré sur les bilans du décor : 35 à 50 s. */
const SECONDS_PER_SET = 40;
/** Changer de bloc : poser, lire, se placer. */
const SECONDS_BETWEEN_BLOCKS = 60;

/**
 * Une durée approchée de la séance, en minutes, arrondie à cinq.
 *
 * Exacte pour ce que l'horloge fixe ; estimée pour le reste, série par
 * série, avec les repos que le coach a écrits. Arrondie à cinq minutes
 * parce qu'une estimation à la minute se lirait comme une promesse — et le
 * « ≈ » qui la précède à l'écran dit le reste.
 */
export const estimatedMinutes = (session: Session): number => {
  const blocks = sortByOrder(session.blocks);
  const seconds = blocks.reduce(
    (total, block) => {
      const fixed = fixedSeconds(block);
      if (fixed !== undefined) return total + fixed;
      return (
        total +
        setsOfBlock(block).reduce(
          (sum, set) =>
            sum +
            (set.exercise.duration ?? SECONDS_PER_SET) +
            (set.restAfter ?? 0),
          0
        )
      );
    },
    Math.max(0, blocks.length - 1) * SECONDS_BETWEEN_BLOCKS
  );
  return Math.max(5, Math.round(seconds / 300) * 5);
};

/** Les formats d'un bilan, sans doublon : « Échauffement · AMRAP ». Le
 * type d'un instantané est une chaîne libre — un bilan ancien peut porter
 * un format qui n'existe plus —, d'où la conversion. */
export const getCompletedSessionBlockTypes = (
  completed: CompletedSession
): string => {
  const uniqueTypes = [...new Set(completed.blocks.map((b) => b.type))];
  return uniqueTypes.map((t) => getBlockLabel(t as BlockType)).join(' · ');
};
