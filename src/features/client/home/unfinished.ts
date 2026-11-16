import type { Session } from '@/shared/types';
import { buildGuidedSteps } from '@/features/client/guided/steps';
import { positionLabel } from '@/features/client/guided/outline';
import { readProgress } from '@/features/client/guided/sessionProgress';

/** Une séance guidée quittée avant la fin, sur cet appareil. */
export interface Unfinished {
  session: Session;
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
    .filter(({ saved }) => !!saved && (saved.step > 0 || saved.done.length > 0))
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
    where,
    blocks: [...perBlock.values()].map(({ total, done }) =>
      total > 0 ? done / total : 0
    ),
    startedAt: saved.startedAt,
    changed: new Date(session.updatedAt).getTime() > since,
  };
};

/** « il y a 20 min », « il y a 2 h » : depuis quand la séance est commencée. */
export const startedAgo = (startedAt: number, now: number): string => {
  const minutes = Math.max(1, Math.round((now - startedAt) / 60000));
  if (minutes < 60) return `commencée il y a ${minutes} min`;
  return `commencée il y a ${Math.floor(minutes / 60)} h`;
};
