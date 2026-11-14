import { Session, SessionBlock } from '@/shared/types';
import {
  blockDefinesOwnMetrics,
  blockSupportsRepsOnly,
  getBlockLabel,
} from '@/features/program/constants';
import { setsOfBlock, type GuidedSet } from '../guidedSteps';
import { formatSuggestedDays } from '../sessionDates';

/**
 * Ce que l'ouverture d'une séance annonce, avant qu'on la commence.
 *
 * Tout ici est une réponse à « qu'est-ce qui m'attend ? », et chaque réponse
 * a déjà été fausse une fois : l'écran comptait ses étapes internes et
 * annonçait « 12 exercices » pour une séance qui en compte sept. Ces
 * fonctions comptent ce que la personne compte — des mouvements, des tours,
 * des minutes.
 */

const sorted = <T extends { order: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);

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

/** Les blocs que l'horloge mène tour par tour. */
const isRoundBased = (block: SessionBlock): boolean =>
  ['emom', 'every', 'tabata', 'onoff'].includes(block.type);

/**
 * Le temps qu'un bloc prend quand son format le fixe, en secondes.
 *
 * `undefined` quand rien ne le fixe : un bloc classique dure ce que le
 * client met à le faire, et on ne l'invente pas ici.
 */
const fixedSeconds = (block: SessionBlock): number | undefined => {
  if (isRoundBased(block)) {
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
  const blocks = sorted(session.blocks);
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

/**
 * La ligne au-dessus du titre : le rang de la séance et le jour conseillé.
 *
 * « Séance 2 · conseillée le samedi ». Sans jour conseillé, le rang seul ;
 * et rien du tout quand la séance n'a pas de nom, puisque le rang est alors
 * le titre lui-même.
 */
export const openingEyebrow = (
  session: Pick<Session, 'order' | 'name' | 'suggestedDays'>
): string => {
  const days = formatSuggestedDays(session.suggestedDays);
  const advice = days ? `conseillée ${days}` : '';
  if (!session.name?.trim()) return advice;
  return [`Séance ${session.order}`, advice].filter(Boolean).join(' · ');
};

/** Le titre : le nom que le coach a donné, sinon le rang. */
export const openingTitle = (
  session: Pick<Session, 'order' | 'name'>
): string => session.name?.trim() || `Séance ${session.order}`;

/**
 * Où l'on en est dans un bloc, dit comme on le dirait.
 *
 * « Série 3 sur 4 » quand le mouvement a plusieurs séries, « Palier 4 sur
 * 7 » dans une échelle, « Mouvement 2 sur 4 » dans un chipper, et
 * « Exercice 2 sur 2 » quand chaque mouvement n'a qu'une série — compter des
 * séries n'y voudrait rien dire. Jamais un numéro d'étape : l'écran
 * affichait « 9 / 9 » en entrant dans un bloc où il restait sept séries.
 */
export const rankLabel = (
  block: Pick<SessionBlock, 'type'>,
  set: Pick<GuidedSet, 'rank' | 'total' | 'exerciseOrder'>,
  blockSets: Pick<GuidedSet, 'exerciseOrder'>[]
): string => {
  if (blockDefinesOwnMetrics(block.type)) {
    return `Palier ${set.rank} sur ${set.total}`;
  }
  const exerciseOrders = [...new Set(blockSets.map((s) => s.exerciseOrder))];
  const position = exerciseOrders.indexOf(set.exerciseOrder) + 1;
  if (block.type === 'chipper' || block.type === 'timecap') {
    return `Mouvement ${position} sur ${exerciseOrders.length}`;
  }
  if (set.total > 1) return `Série ${set.rank} sur ${set.total}`;
  return `Exercice ${position} sur ${exerciseOrders.length}`;
};

/**
 * Ce que le décompte annonce : le premier geste à venir.
 *
 * « Goblet Squat » et « Série 1 sur 4 · 10 reps » pour un bloc qu'on mène
 * soi-même ; le nom du bloc et son repère quand c'est l'horloge qui mène,
 * parce qu'on n'y fait pas un geste mais un tour.
 */
export const firstGesture = (
  block: SessionBlock,
  doneKeys: readonly string[] = []
): { title: string; detail: string } => {
  const led = isRoundBased(block) || block.type === 'amrap';
  if (led) return { title: blockTitle(block), detail: blockMarker(block) };

  const sets = setsOfBlock(block);
  const next = sets.find((set) => !doneKeys.includes(set.key)) ?? sets[0];
  if (!next) return { title: blockTitle(block), detail: '' };
  return {
    title: next.name,
    detail: [rankLabel(block, next, sets), next.dose.replace(/\u00A0/g, ' ')]
      .filter(Boolean)
      .join(' · '),
  };
};
