import { PerformedSet, PerformedValues, Session } from '@/shared/types';
import { LastPerformance, performedKey } from './lastPerformance';
import { GuidedStep, setsOfBlock } from './guidedSteps';

/**
 * Ce que le client vient de faire, dit en chiffres.
 *
 * L'arc d'une séance était : quarante minutes d'effort, puis un formulaire,
 * puis un toast, puis l'accueil. On demandait deux fois avant de donner quoi
 * que ce soit. Le récapitulatif inverse l'ordre — un constat d'abord, la
 * question ensuite.
 *
 * Il n'est possible que parce que la saisie se fait pendant la séance : les
 * deux pièces se tiennent, et c'est voulu. Noter au fil cesse d'être une
 * corvée et devient ce qui paie le récapitulatif — et l'écran « remplis ce
 * dont tu te souviens » disparaît pour qui l'a fait.
 */
export interface Recap {
  /** Minutes écoulées depuis l'ouverture du mode guidé. Absent quand on ne
   * sait pas. */
  durationMinutes?: number;
  setsDone: number;
  setsTotal: number;
  /** Somme des charge × répétitions réellement notées. Zéro quand il n'y en a
   * pas. */
  tonnage: number;
  /** Tours bouclés, tous blocs confondus. */
  rounds: number;
  comparisons: Comparison[];
}

/** Un mouvement, ce qu'on y a mis aujourd'hui, et ce que cela change. */
export interface Comparison {
  name: string;
  /** La charge la plus lourde du jour sur ce mouvement. */
  load: number;
  /**
   * L'écart avec la dernière fois. `undefined` quand il n'y a pas de dernière
   * fois : on ne compare pas à rien, et « +26 kg » sur une première tentative
   * serait un mensonge flatteur.
   */
  delta?: number;
}

const heaviest = (sets: PerformedSet[] = []): number | undefined => {
  const loads = sets
    .map((s) => s.weight)
    .filter((w): w is number => typeof w === 'number' && w > 0);
  return loads.length > 0 ? Math.max(...loads) : undefined;
};

/**
 * Ce qui peut légitimement compter comme des répétitions, série par série.
 *
 * Indexé « bloc:exercice:rang », c'est-à-dire l'adresse d'une série précise.
 * Seules les séries que le client a cochées y figurent : la dose prescrite ne
 * vaut que pour ce qui a réellement été fait.
 */
export const allowedReps = (
  session: Session,
  done: string[]
): Map<string, number> => {
  const allowed = new Map<string, number>();
  const ticked = new Set(done);
  session.blocks.forEach((block) =>
    setsOfBlock(block).forEach((s) => {
      if (ticked.has(s.key) && typeof s.reps === 'number')
        allowed.set(s.key, s.reps);
    })
  );
  return allowed;
};

/**
 * Le tonnage : ce qui a réellement été déplacé.
 *
 * Une série ne compte que si l'on connaît à la fois sa charge ET ses
 * répétitions. Les répétitions viennent d'abord de ce que le client a tapé ;
 * à défaut, de la dose prescrite — mais uniquement pour une série qu'il a
 * cochée, cocher étant précisément l'affirmation qu'il a fait ce qui était
 * écrit. Sans ce second cas, le nombre serait toujours nul en mode guidé, où
 * l'on ne saisit qu'une charge.
 *
 * Ce qui reste exclu : une série pesée mais jamais faite. L'inventer
 * gonflerait un nombre que le client relit d'une séance à l'autre.
 */
export const tonnageOf = (
  performed: Record<string, PerformedValues>,
  prescribedReps?: Map<string, number>
): number =>
  Object.entries(performed).reduce(
    (total, [key, value]) =>
      total +
      (value.sets ?? []).reduce((n, s, i) => {
        if (typeof s.weight !== 'number') return n;
        const reps =
          typeof s.reps === 'number'
            ? s.reps
            : prescribedReps?.get(`${key}:${i + 1}`);
        return n + (typeof reps === 'number' ? s.weight * reps : 0);
      }, 0),
    0
  );

/**
 * Ce qui a été fait, et ce qu'il y avait à faire.
 *
 * Deux unités cohabitent dans une séance et doivent se compter ensemble : les
 * séries d'un bloc en liste, cochées une à une, et les tours d'un bloc
 * chronométré, qui ne se cochent pas — l'horloge les mène, et on les
 * traverse. Ne compter que les cochées annoncerait à quelqu'un qui vient de
 * faire toute la séance, Tabata compris, « 7 séries sur 15 » : un constat qui
 * accuse.
 *
 * Un tour est donc fait dès qu'on l'a dépassé. Une boucle n'entre pas dans ce
 * compte : son unité à elle est le tour bouclé, et elle a son propre chiffre.
 */
export const countSets = (
  steps: GuidedStep[],
  step: number,
  done: string[]
): { total: number; done: number } => {
  let total = 0;
  let achieved = done.length;
  steps.forEach((s, i) => {
    if (s.type === 'round') {
      total += 1;
      if (i < step) achieved += 1;
    } else if (s.type === 'block') {
      total += s.sets.length;
    }
  });
  return { total, done: Math.min(achieved, total) };
};

/**
 * Les mouvements dont on peut dire quelque chose, le plus grand écart
 * d'abord.
 *
 * Trois au plus : un récapitulatif qui aligne douze lignes n'est plus un
 * constat, c'est un tableau. Ce qu'on veut montrer, c'est ce qui a bougé.
 */
export const comparisonsOf = (
  session: Session,
  performed: Record<string, PerformedValues>,
  lastPerformance?: Map<string, LastPerformance>,
  maximum = 3
): Comparison[] => {
  const rows: Comparison[] = [];

  session.blocks.forEach((block) => {
    block.exercises.forEach((ex) => {
      const load = heaviest(
        performed[performedKey(block.order, ex.order)]?.sets
      );
      if (load === undefined) return;
      const before = heaviest(lastPerformance?.get(ex.exercise._id)?.sets);
      rows.push({
        name: ex.exercise.name,
        load,
        delta: before === undefined ? undefined : load - before,
      });
    });
  });

  // Ce qui a progressé d'abord, puis ce qui a tenu, puis ce qui n'a pas de
  // passé : un écart nul reste une information — « j'ai tenu ma charge ».
  return rows
    .sort((a, b) => Math.abs(b.delta ?? -1) - Math.abs(a.delta ?? -1))
    .slice(0, maximum);
};

/**
 * Le constat de fin de séance, calculé de ce qui a été noté.
 *
 * Aucune requête : tout vient de la séance en main et de l'historique déjà
 * chargé. C'est la condition pour que l'écran s'affiche immédiatement, au
 * moment précis où le client pose sa kettlebell.
 */
export const buildRecap = ({
  session,
  steps,
  step,
  performed,
  done,
  rounds,
  lastPerformance,
  startedAt,
  now = Date.now(),
}: {
  session: Session;
  steps: GuidedStep[];
  step: number;
  performed: Record<string, PerformedValues>;
  done: string[];
  rounds: Record<string, number>;
  lastPerformance?: Map<string, LastPerformance>;
  startedAt?: number;
  now?: number;
}): Recap => {
  const counts = countSets(steps, step, done);
  const elapsed = startedAt === undefined ? -1 : now - startedAt;
  return {
    // Une séance ouverte hier et terminée aujourd'hui donnerait un nombre
    // absurde. Au-delà de six heures, on préfère ne rien dire.
    durationMinutes:
      elapsed > 0 && elapsed < 6 * 3600_000
        ? Math.max(1, Math.round(elapsed / 60_000))
        : undefined,
    setsDone: counts.done,
    setsTotal: counts.total,
    tonnage: tonnageOf(performed, allowedReps(session, done)),
    rounds: Object.values(rounds).reduce((n, r) => n + r, 0),
    comparisons: comparisonsOf(session, performed, lastPerformance),
  };
};
