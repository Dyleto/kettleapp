import { CompletedSession, PerformedValues, Session } from '@/shared/types';
import {
  LastPerformance,
  performedKey,
} from '@/domain/history/lastPerformance';
import { heaviest } from '@/domain/history/load';

/**
 * La plus lourde charge jamais notée, par mouvement, sur tout l'historique.
 *
 * Un record se mesure à ce meilleur-là, et non à la dernière fois : battre
 * une séance où l'on avait levé léger n'est pas un record. Indexé par
 * identifiant d'exercice, comme `lastPerformance` : c'est le mouvement qui a
 * un record, pas la place qu'il occupait dans une séance.
 */
export const bestLoads = (
  history: readonly CompletedSession[]
): Map<string, number> => {
  const best = new Map<string, number>();
  history.forEach((completed) =>
    completed.blocks.forEach((block) =>
      block.exercises.forEach((ex) => {
        const id = ex.exercise?._id;
        const load = heaviest(ex.performed?.sets);
        if (typeof id !== 'string' || load === undefined) return;
        best.set(id, Math.max(best.get(id) ?? 0, load));
      })
    )
  );
  return best;
};

/** Ce que l'écran de fin a de mieux à dire. */
export type Highlight =
  | {
      kind: 'record';
      name: string;
      load: number;
      /** Combien de plus que le meilleur précédent. */
      gain: number;
      /** Les autres records du jour, qui ne s'affichent pas un à un. */
      others: number;
    }
  | { kind: 'steady' };

/**
 * Le record du jour, ou ce qui est vrai à sa place.
 *
 * Un seul record s'affiche, le plus grand écart ; les autres se comptent.
 * Sans record, la régularité — une charge tenue d'une séance à l'autre — se
 * dit aussi. Et sans l'un ni l'autre, rien : un mouvement fait pour la
 * première fois n'a pas de meilleur précédent, et l'appeler un record
 * serait en inventer un.
 */
export const highlightOf = (
  session: Session,
  performed: Record<string, PerformedValues>,
  history: readonly CompletedSession[],
  lastPerformance?: Map<string, LastPerformance>
): Highlight | null => {
  const best = bestLoads(history);
  const records: { name: string; load: number; gain: number }[] = [];
  let steady = false;

  session.blocks.forEach((block) =>
    block.exercises.forEach((ex) => {
      const load = heaviest(
        performed[performedKey(block.order, ex.order)]?.sets
      );
      if (load === undefined) return;
      const previous = best.get(ex.exercise._id);
      if (previous !== undefined && load > previous)
        records.push({ name: ex.exercise.name, load, gain: load - previous });
      if (heaviest(lastPerformance?.get(ex.exercise._id)?.sets) === load)
        steady = true;
    })
  );

  if (records.length > 0) {
    const [top, ...rest] = [...records].sort((a, b) => b.gain - a.gain);
    return { kind: 'record', ...top, others: rest.length };
  }
  return steady ? { kind: 'steady' } : null;
};
