import { Session, SessionBlock } from '@/shared/types';
import { blockDefinesOwnMetrics } from '@/domain/session/blocks';
import {
  setsOfBlock,
  sortByOrder,
  type GuidedSet,
} from '@/domain/session/sets';
import { formatSuggestedDays } from '@/domain/week/dates';
import { sessionRank } from '@/domain/session/name';
import {
  blockTitle,
  isRoundBased,
  blockMarker,
} from '@/domain/session/measure';

/**
 * Ce que l'ouverture d'une séance annonce, avant qu'on la commence.
 *
 * Tout ici est une réponse à « qu'est-ce qui m'attend ? », et chaque réponse
 * a déjà été fausse une fois : l'écran comptait ses étapes internes et
 * annonçait « 12 exercices » pour une séance qui en compte sept. Ces
 * fonctions comptent ce que la personne compte — des mouvements, des tours,
 * des minutes.
 */

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
  return [sessionRank(session.order), advice].filter(Boolean).join(' · ');
};

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

/** « Série 3 sur 4 » au milieu d'une phrase : « série 3 sur 4 ». */
const lowerFirst = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1);

/**
 * Où l'on en est, dit en blocs et en séries : « Bloc 2 sur 3 · série 3 sur
 * 4 ».
 *
 * C'est ce que la pause affiche, et ce que la reprise annoncera. L'écran
 * disait « 9 / 9 » en entrant dans un bloc où il restait sept séries, et à
 * la reprise « Tu t'étais arrêté à l'étape 9 sur 9 » : il comptait ses
 * écrans. Personne ne compte des étapes ; on compte des blocs, puis des
 * séries, des tours ou des paliers.
 *
 * `round` est fourni quand l'horloge mène le bloc : on y est à un tour, pas
 * à une série.
 */
export const positionLabel = (
  session: Pick<Session, 'blocks'>,
  block: SessionBlock,
  doneKeys: readonly string[] = [],
  round?: { rank: number; total: number | null }
): string => {
  const blocks = sortByOrder(session.blocks);
  const rank = blocks.findIndex((b) => b.order === block.order) + 1;
  const where = `Bloc ${rank} sur ${blocks.length}`;

  if (round)
    return round.total === null
      ? `${where} · tour ${round.rank}`
      : `${where} · tour ${round.rank} sur ${round.total}`;
  if (isRoundBased(block) || block.type === 'amrap') return where;

  const sets = setsOfBlock(block);
  const next = sets.find((set) => !doneKeys.includes(set.key));
  if (!next) return sets.length > 0 ? `${where} · terminé` : where;
  return `${where} · ${lowerFirst(rankLabel(block, next, sets))}`;
};

/** Un bloc tel que la barre du haut le dessine : où il commence parmi les
 * écrans de la séance, et combien il en occupe. */
export interface BlockSegment {
  /** L'ordre du bloc dans la séance — son identité. */
  order: number;
  start: number;
  size: number;
}

/**
 * Les segments de la barre du haut : un par bloc.
 *
 * Ils étaient regroupés par nom de format, et deux blocs voisins du même
 * format — deux blocs classiques, un échauffement suivi d'un autre — se
 * fondaient en un seul segment : la barre annonçait deux blocs pour une
 * séance qui en compte trois. Ils se regroupent maintenant par bloc.
 *
 * Un repos appartient au bloc qui le précède : c'est la fin de ce bloc
 * qu'on y attend, pas le début du suivant.
 */
export const blockSegments = (
  steps: readonly (
    | { type: 'rest' }
    | { type: 'round' | 'block'; block: Pick<SessionBlock, 'order'> }
  )[]
): BlockSegment[] => {
  const segments: BlockSegment[] = [];
  steps.forEach((step, index) => {
    const last = segments[segments.length - 1];
    const order = step.type === 'rest' ? last?.order : step.block.order;
    if (order === undefined) return;
    if (last && last.order === order) {
      last.size += 1;
      return;
    }
    segments.push({ order, start: index, size: 1 });
  });
  return segments;
};

/** « 1 tour », « 8 tours ». */
const counted = (count: number, word: string): string =>
  `${count}\u00A0${word}${count > 1 ? 's' : ''}`;

/**
 * Ce que l'écran « Bloc suivant » dit du bloc qui vient de finir : « Bloc 1
 * terminé · 8 tours ».
 *
 * « Bloc », et non le nom du bloc, parce que « terminé » s'accorde : un
 * coach qui nomme son bloc « Mobilité » aurait lu « Mobilité terminé ». On
 * n'accorde pas ce qu'on ne connaît pas.
 *
 * Le compte est ce que la personne a fait, jamais ce qui était prescrit :
 * « 5 séries sur 7 » quand deux ont été passées. Un bloc quitté sans rien y
 * cocher est « passé », qu'on l'ait passé depuis la pause ou d'un « Bloc
 * suivant ». Un EMOM sans limite arrêté depuis la pause n'a pas de compte
 * sûr — le tour en cours n'est peut-être pas fini — et n'en donne pas.
 */
export const blockOutcome = (
  session: Pick<Session, 'blocks'>,
  block: SessionBlock,
  ending: 'finished' | 'stopped' | 'skipped',
  doneKeys: readonly string[],
  countedRounds: number
): string => {
  const blocks = sortByOrder(session.blocks);
  const rank = blocks.findIndex((b) => b.order === block.order) + 1;
  const passed = `Bloc ${rank} passé`;
  const ended = `Bloc ${rank} terminé`;
  if (ending === 'skipped') return passed;

  if (isRoundBased(block)) {
    return ending === 'finished' && block.rounds
      ? `${ended} · ${counted(block.rounds, 'tour')}`
      : ended;
  }
  if (block.type === 'amrap') {
    return countedRounds > 0
      ? `${ended} · ${counted(countedRounds, 'tour')}`
      : ended;
  }

  const sets = setsOfBlock(block);
  if (sets.length === 0) return ended;
  const isDone = (set: GuidedSet) => doneKeys.includes(set.key);
  let done: number;
  let total: number;
  let unit: string;
  if (blockDefinesOwnMetrics(block.type)) {
    // Un palier se fait avec tous ses mouvements : il ne compte que quand
    // chacun est coché.
    const ranks = [...new Set(sets.map((set) => set.rank))];
    total = ranks.length;
    done = ranks.filter((rank) =>
      sets.filter((set) => set.rank === rank).every(isDone)
    ).length;
    unit = 'palier';
  } else {
    total = sets.length;
    done = sets.filter(isDone).length;
    unit =
      block.type === 'chipper' || block.type === 'timecap'
        ? 'mouvement'
        : sets.every((set) => set.total === 1)
          ? 'exercice'
          : 'série';
  }
  if (done === 0) return passed;
  return done === total
    ? `${ended} · ${counted(total, unit)}`
    : `${ended} · ${counted(done, unit)} sur ${total}`;
};
