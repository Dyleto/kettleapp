import type { Session } from '@/shared/types';
import { buildGuidedSteps } from '@/features/client/guided/steps';
import { positionLabel } from '@/features/client/guided/outline';
import { readProgress } from '@/features/client/guided/sessionProgress';

/**
 * Où en est une séance laissée sur cet appareil.
 *
 *   running  — quittée avant la fin : on la reprend ;
 *   finished — finie, le ressenti pas encore dit : « à valider » ;
 *   pending  — le ressenti dit, pas encore parti faute de réseau.
 */
export type UnfinishedState = 'running' | 'finished' | 'pending';

/** Une séance guidée laissée sur cet appareil, avant que le serveur ne
 * l'ait reçue. */
export interface Unfinished {
  session: Session;
  state: UnfinishedState;
  /** Quand elle a fini, en millisecondes : « terminée il y a 20 min ». */
  finishedAt?: number;
  /** « Bloc 2 sur 2 », puis « Série 3 sur 4 » quand le bloc se compte en séries. */
  where: string[];
  /**
   * La part faite de chaque bloc, entre 0 et 1 et dans l'ordre : les séries
   * cochées et les tours passés. La barre de la carte en fait un segment par
   * bloc, comme celle de la séance guidée.
   */
  blocks: number[];
  /** Quand elle a commencé, en millisecondes ; absent si l'ouverture n'a pas été franchie. */
  startedAt?: number;
  /**
   * Le coach a modifié la séance depuis qu'elle a commencé.
   *
   * La position enregistrée est un rang d'étape : sur une séance dont les
   * blocs ont bougé, « reprendre à l'étape 7 » mènerait au milieu d'autre
   * chose. Il ne reste alors que « Recommencer ».
   */
  changed: boolean;
}

/**
 * La séance commencée et pas finie, s'il y en a une — la plus récente si
 * plusieurs.
 *
 * Commencée veut dire la même chose qu'à l'ouverture de la séance guidée :
 * une étape franchie ou une série cochée. Avoir regardé l'écran d'ouverture
 * ne compte pas. L'enregistrement est celui du téléphone (`kettle-seance-*`),
 * périmé au bout de douze heures par `readProgress` : l'accueil ne propose
 * pas de reprendre la séance d'avant-hier.
 *
 * `read` est injecté pour les tests ; l'écran passe `readProgress`.
 */
export const unfinishedSession = (
  sessions: readonly Session[],
  read: typeof readProgress = readProgress
): Unfinished | undefined => {
  const found = sessions
    .map((session) => ({ session, saved: read(session._id) }))
    // Une séance finie compte même sans étape franchie : « Terminer la
    // séance maintenant » dès le premier écran, puis rien d'envoyé. Un
    // ressenti en attente aussi, même d'une séance déclarée faite sans la
    // séance guidée — il n'a ni étape ni série cochée.
    .filter(
      ({ saved }) =>
        !!saved &&
        (saved.step > 0 ||
          saved.done.length > 0 ||
          saved.finishedAt !== undefined ||
          saved.pending !== undefined)
    )
    .sort((a, b) => b.saved!.updatedAt - a.saved!.updatedAt)[0];
  if (!found?.saved) return undefined;
  const { session, saved } = found;

  const steps = buildGuidedSteps(session);
  const at = Math.min(saved.step, Math.max(0, steps.length - 1));
  // Un repos appartient au bloc qui le précède : c'est lui qu'on annonce.
  const block = steps
    .slice(0, at + 1)
    .reverse()
    .find((step) => step.type !== 'rest');

  const perBlock = new Map<number, { total: number; done: number }>();
  steps.forEach((step, index) => {
    if (step.type === 'rest') return;
    const count = perBlock.get(step.block.order) ?? { total: 0, done: 0 };
    if (step.type === 'block' && step.sets.length > 0) {
      count.total += step.sets.length;
      count.done += step.sets.filter((set) =>
        saved.done.includes(set.key)
      ).length;
    } else {
      // Un tour, ou une boucle qui se compte : fait quand on l'a dépassé.
      count.total += 1;
      if (index < at) count.done += 1;
    }
    perBlock.set(step.block.order, count);
  });

  const label = block ? positionLabel(session, block.block, saved.done) : '';
  const where = label
    .split(' · ')
    .filter((part) => part && part !== 'terminé')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  const since = saved.startedAt ?? saved.updatedAt;
  return {
    session,
    state: saved.pending
      ? 'pending'
      : saved.finishedAt !== undefined
        ? 'finished'
        : 'running',
    finishedAt: saved.finishedAt,
    where,
    blocks: [...perBlock.values()].map(({ total, done }) =>
      total > 0 ? done / total : 0
    ),
    startedAt: saved.startedAt,
    changed: new Date(session.updatedAt).getTime() > since,
  };
};

/** « il y a 20 min », « il y a 2 h » : à la minute près, puis à l'heure. */
const ago = (word: string, at: number, now: number): string => {
  const minutes = Math.max(1, Math.round((now - at) / 60000));
  if (minutes < 60) return `${word} il y a ${minutes} min`;
  return `${word} il y a ${Math.floor(minutes / 60)} h`;
};

/** Depuis quand la séance est commencée : « commencée il y a 20 min ». */
export const startedAgo = (startedAt: number, now: number): string =>
  ago('commencée', startedAt, now);

/** Depuis quand elle est finie : « terminée il y a 20 min ». */
export const finishedAgo = (finishedAt: number, now: number): string =>
  ago('terminée', finishedAt, now);
