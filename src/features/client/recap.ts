import { PerformedSet, PerformedValues, Session } from '@/types';
import { LastPerformance, performedKey } from './lastPerformance';
import { GuidedStep, effortsDuBloc } from './guidedSteps';

/**
 * Ce que le client vient de faire, dit en chiffres.
 *
 * L'arc d'une séance était : quarante minutes d'effort, puis un formulaire,
 * puis un toast, puis l'écran d'accueil. On demandait deux fois avant de rien
 * donner. Le récap inverse l'ordre — un constat d'abord, la question ensuite.
 *
 * Il n'est possible que parce que la saisie se fait pendant la séance : les
 * deux pièces se tiennent, et c'est voulu. Noter au fil de l'eau cesse d'être
 * une corvée, ça devient ce qui achète le récap — et l'écran « renseigne ce
 * dont tu te souviens » disparaît pour qui a noté.
 */
export interface Recap {
  /** Minutes écoulées depuis l'ouverture du mode guidé. Absent si inconnu. */
  dureeMinutes?: number;
  effortsFaits: number;
  effortsTotal: number;
  /** Somme des poids × répétitions réellement notés. Zéro s'il n'y en a pas. */
  tonnage: number;
  /** Tours bouclés, tous blocs confondus. */
  tours: number;
  comparaisons: Comparaison[];
}

/** Un mouvement, ce qu'on y a mis aujourd'hui, et ce que ça change. */
export interface Comparaison {
  nom: string;
  /** La charge la plus lourde du jour sur ce mouvement. */
  charge: number;
  /**
   * L'écart avec la dernière fois. `undefined` quand il n'y a pas de dernière
   * fois : on ne compare pas à rien, et « +26 kg » sur un premier passage
   * serait un mensonge flatteur.
   */
  ecart?: number;
}

const plusLourde = (sets: PerformedSet[] = []): number | undefined => {
  const poids = sets
    .map((s) => s.weight)
    .filter((w): w is number => typeof w === 'number' && w > 0);
  return poids.length > 0 ? Math.max(...poids) : undefined;
};

/**
 * Ce qu'on peut légitimement compter comme des répétitions, effort par effort.
 *
 * Clé « bloc:exercice:rang », c'est-à-dire l'adresse d'une série précise.
 * N'y figurent que les efforts que le client a cochés « Fait » : la dose
 * prescrite ne vaut que pour ce qui a réellement été fait.
 */
export const repsAdmises = (
  session: Session,
  faits: string[]
): Map<string, number> => {
  const admises = new Map<string, number>();
  const coches = new Set(faits);
  session.blocks.forEach((block) =>
    effortsDuBloc(block).forEach((e) => {
      if (coches.has(e.cle) && typeof e.reps === 'number')
        admises.set(e.cle, e.reps);
    })
  );
  return admises;
};

/**
 * Le tonnage : ce qu'on a réellement déplacé.
 *
 * Une série ne compte que si l'on connaît son poids ET ses répétitions.
 * Les répétitions viennent d'abord de ce que le client a saisi ; à défaut,
 * de la dose prescrite — mais seulement pour un effort qu'il a coché
 * « Fait », car cocher, c'est précisément déclarer qu'on a fait ce qui était
 * écrit. Sans ce second cas le chiffre serait toujours nul en mode guidé, où
 * l'on ne saisit qu'un poids.
 *
 * Ce qui reste exclu : une série pesée mais jamais faite. L'inventer
 * gonflerait un chiffre que le client relit d'une séance à l'autre.
 */
export const tonnageDe = (
  performed: Record<string, PerformedValues>,
  repsPrescrites?: Map<string, number>
): number =>
  Object.entries(performed).reduce(
    (total, [cle, valeur]) =>
      total +
      (valeur.sets ?? []).reduce((n, s, i) => {
        if (typeof s.weight !== 'number') return n;
        const reps =
          typeof s.reps === 'number'
            ? s.reps
            : repsPrescrites?.get(`${cle}:${i + 1}`);
        return n + (typeof reps === 'number' ? s.weight * reps : 0);
      }, 0),
    0
  );

/**
 * Ce qui a été fait, et ce qu'il y avait à faire.
 *
 * Deux unités cohabitent dans une séance et il faut les compter ensemble :
 * les efforts d'un bloc-liste, qui se cochent un par un, et les tours d'un
 * bloc à cadence, qui ne se cochent pas — l'horloge les mène, et on les
 * franchit. Ne compter que les cochés ferait dire « 7 efforts sur 15 » à qui
 * vient de faire la séance entière, Tabata compris : un constat qui accuse.
 *
 * Un tour est donc fait dès qu'on l'a dépassé. Une boucle n'entre pas dans
 * ce compte : son unité à elle est le tour bouclé, et il a sa propre case.
 */
export const comptesDEfforts = (
  steps: GuidedStep[],
  etape: number,
  faits: string[]
): { total: number; faits: number } => {
  let total = 0;
  let accomplis = faits.length;
  steps.forEach((step, i) => {
    if (step.type === 'round') {
      total += 1;
      if (i < etape) accomplis += 1;
    } else if (step.type === 'block') {
      total += step.efforts.length;
    }
  });
  return { total, faits: Math.min(accomplis, total) };
};

/**
 * Les mouvements où l'on peut dire quelque chose, du plus gros écart au plus
 * petit.
 *
 * Trois au plus : un récap qui liste douze lignes n'est plus un constat, c'est
 * un tableau. Ce qu'on veut montrer, c'est ce qui a bougé.
 */
export const comparaisonsDe = (
  session: Session,
  performed: Record<string, PerformedValues>,
  lastPerformance?: Map<string, LastPerformance>,
  maximum = 3
): Comparaison[] => {
  const lignes: Comparaison[] = [];

  session.blocks.forEach((block) => {
    block.exercises.forEach((ex) => {
      const charge = plusLourde(
        performed[performedKey(block.order, ex.order)]?.sets
      );
      if (charge === undefined) return;
      const avant = plusLourde(lastPerformance?.get(ex.exercise._id)?.sets);
      lignes.push({
        nom: ex.exercise.name,
        charge,
        ecart: avant === undefined ? undefined : charge - avant,
      });
    });
  });

  // Ce qui a progressé d'abord, puis ce qui a tenu, puis ce qui n'a pas de
  // passé : un écart de zéro reste une information — « j'ai tenu ma charge ».
  return lignes
    .sort((a, b) => Math.abs(b.ecart ?? -1) - Math.abs(a.ecart ?? -1))
    .slice(0, maximum);
};

export const construireRecap = ({
  session,
  steps,
  etape,
  performed,
  faits,
  tours,
  lastPerformance,
  debutLe,
  maintenant = Date.now(),
}: {
  session: Session;
  steps: GuidedStep[];
  etape: number;
  performed: Record<string, PerformedValues>;
  faits: string[];
  tours: Record<string, number>;
  lastPerformance?: Map<string, LastPerformance>;
  debutLe?: number;
  maintenant?: number;
}): Recap => {
  const comptes = comptesDEfforts(steps, etape, faits);
  const ecoule = debutLe === undefined ? -1 : maintenant - debutLe;
  return {
    // Une séance ouverte hier et finie aujourd'hui donnerait un chiffre
    // absurde. Au-delà de six heures on préfère ne rien dire.
    dureeMinutes:
      ecoule > 0 && ecoule < 6 * 3600_000
        ? Math.max(1, Math.round(ecoule / 60_000))
        : undefined,
    effortsFaits: comptes.faits,
    effortsTotal: comptes.total,
    tonnage: tonnageDe(performed, repsAdmises(session, faits)),
    tours: Object.values(tours).reduce((n, t) => n + t, 0),
    comparaisons: comparaisonsDe(session, performed, lastPerformance),
  };
};
