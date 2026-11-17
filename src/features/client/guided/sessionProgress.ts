import { PerformedValues } from '@/shared/types';

/**
 * Ce qu'une séance en cours garde d'elle-même entre deux ouvertures.
 *
 * L'application retenait soigneusement où l'on en était — l'index d'étape
 * partait dans `sessionStorage` à chaque déplacement — et oubliait ce qu'on
 * avait fait : les charges vivaient dans un `useState` nu. Un rechargement,
 * un appel entrant qui tue l'onglet, et quarante minutes de notes
 * disparaissaient. C'est l'inverse de ce qui mérite d'être gardé : une
 * position se retrouve, une charge qu'on a soulevée non.
 *
 * Les deux vivent donc ensemble, dans `localStorage`, qui survit à la
 * fermeture de l'onglet là où `sessionStorage` meurt avec lui. C'est
 * précisément le cas qu'on cherchait à couvrir.
 */
export interface SessionProgress {
  /** Pour que la forme puisse changer sans qu'on relise un enregistrement
   * périmé. */
  version: 2;
  /** Où l'on en était dans le mode guidé. */
  step: number;
  /** Ce qui a été noté, indexé par `performedKey(blockOrder,
   * exerciseOrder)`. */
  performed: Record<string, PerformedValues>;
  /**
   * Les séries déjà faites, par clé.
   *
   * Distinct de la position : on peut revenir sur un bloc sans défaire ce
   * qu'on y a fait, et une série cochée le reste même si l'on remonte lire la
   * consigne du mouvement précédent.
   */
  done: string[];
  /**
   * Les tours bouclés, par rang de bloc.
   *
   * Un AMRAP ne se coche pas, il se compte. Le compte vit donc à côté des
   * séries, et il se perd tout aussi facilement — raison de plus pour qu'il
   * soit ici.
   */
  rounds: Record<string, number>;
  /**
   * Les mouvements passés, par `performedKey`.
   *
   * « Passer cet exercice » laisse ses séries non faites — elles le sont —
   * mais elles ne doivent plus se présenter comme la suivante. Sans cette
   * liste, la série passée revenait aussitôt au premier plan, et passer ne
   * passait rien. Elle est gardée avec le reste : une séance reprise ne doit
   * pas ramener devant un mouvement qu'on a choisi de laisser.
   *
   * Ajoutée après coup, et lue avec indulgence : un enregistrement qui ne la
   * porte pas en a une vide, sans changer de version.
   */
  skipped: string[];
  /**
   * Ce qu'une échelle bornée a donné, par rang de bloc : les paliers
   * entièrement faits et le temps au chrono, en secondes.
   *
   * Posé par la feuille de fin de l'échelle, envoyé avec le bilan
   * (`ladderDone`). Ajouté après coup et lu avec indulgence, comme
   * `skipped` : un enregistrement qui ne le porte pas en a un vide, et une
   * entrée abîmée est écartée plutôt que d'envoyer n'importe quoi.
   */
  ladder: Record<string, { rungs: number; seconds: number }>;
  /**
   * Ce qu'un chipper ou un TimeCap borné a donné, par rang de bloc : les
   * mouvements entièrement faits et le temps au chrono. Envoyé avec le bilan
   * (`chipperDone`), lu avec la même indulgence que `ladder`.
   */
  chipper: Record<string, { movements: number; seconds: number }>;
  /**
   * Quand la séance a commencé, en millisecondes.
   *
   * Posé à la première ouverture et jamais redéfini : ce qu'on veut annoncer
   * à la fin est la durée réellement vécue, pas celle écoulée depuis le
   * dernier retour dans l'application.
   */
  startedAt?: number;
  /** Quand, en millisecondes. Sert à savoir si cela concerne encore
   * aujourd'hui. */
  updatedAt: number;
}

const key = (sessionId: string) => `kettle-seance-${sessionId}`;

/**
 * Au-delà, l'enregistrement appartient à une autre tentative.
 *
 * Une séance d'entraînement tient en quelques heures. Proposer de « reprendre
 * où tu en étais » trois jours plus tard n'aide personne, et repeupler les
 * champs avec les charges de la semaine dernière serait pire : elles
 * partiraient sans être relues.
 */
const LIFETIME = 12 * 60 * 60 * 1000;

const empty = (): SessionProgress => ({
  version: 2,
  step: 0,
  performed: {},
  done: [],
  rounds: {},
  skipped: [],
  ladder: {},
  chipper: {},
  updatedAt: Date.now(),
});

/**
 * La forme qu'avait cet enregistrement quand ses champs portaient des noms
 * français.
 *
 * Un client en pleine séance au moment où la nouvelle version part perdrait
 * sinon tout : l'enregistrement est toujours là, mais aucun de ses champs ne
 * répond à son nouveau nom. Lire l'ancienne forme coûte une poignée de
 * lignes, et l'alternative est exactement la perte que ce module existe pour
 * empêcher.
 */
interface LegacyProgress {
  // Ces cinq noms ne suivent pas la règle de langue du projet, et ils ne
  // doivent pas : ce ne sont pas des identifiants, ce sont les clés d'un
  // enregistrement déjà posé dans le `localStorage` des clients. Les
  // traduire ne renommerait rien — cela rendrait simplement illisible ce
  // qui est écrit sur leurs téléphones.
  version: 1;
  etape?: number;
  performed?: Record<string, PerformedValues>;
  faits?: string[];
  tours?: Record<string, number>;
  debutLe?: number;
  majLe: number;
}

/**
 * Les résultats de chipper lisibles, et eux seuls : des entiers positifs,
 * sans quoi le serveur refuserait tout le bilan.
 */
const readChipper = (raw: unknown): SessionProgress['chipper'] => {
  if (!raw || typeof raw !== 'object') return {};
  const kept: SessionProgress['chipper'] = {};
  for (const [order, entry] of Object.entries(raw)) {
    const { movements, seconds } = (entry ?? {}) as Record<string, unknown>;
    if (
      Number.isInteger(movements) &&
      Number.isInteger(seconds) &&
      (movements as number) >= 0 &&
      (seconds as number) >= 0
    )
      kept[order] = {
        movements: movements as number,
        seconds: seconds as number,
      };
  }
  return kept;
};

/** Les résultats d'échelle lisibles, et eux seuls. */
const readLadder = (raw: unknown): SessionProgress['ladder'] => {
  if (!raw || typeof raw !== 'object') return {};
  const kept: SessionProgress['ladder'] = {};
  for (const [order, entry] of Object.entries(raw)) {
    const { rungs, seconds } = (entry ?? {}) as Record<string, unknown>;
    if (
      Number.isInteger(rungs) &&
      Number.isInteger(seconds) &&
      (rungs as number) >= 0 &&
      (seconds as number) >= 0
    )
      kept[order] = { rungs: rungs as number, seconds: seconds as number };
  }
  return kept;
};

/** L'enregistrement de cette séance, s'il est encore d'actualité. */
export const readProgress = (sessionId: string): SessionProgress | null => {
  try {
    const raw = localStorage.getItem(key(sessionId));
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<SessionProgress> &
      Partial<LegacyProgress>;

    // Sans date, l'enregistrement est traité comme infiniment vieux : il n'y
    // a pas de « récent » à constater sur une donnée qu'on ne sait pas dater,
    // et la péremption ci-dessous l'écarte. Le refus explicite qui vivait ici
    // ne changeait donc rien d'observable — le sabotage qui le retirait ne
    // faisait tomber aucune assertion, et pour cause.
    const updatedAt =
      typeof stored.updatedAt === 'number'
        ? stored.updatedAt
        : typeof stored.majLe === 'number'
          ? stored.majLe
          : 0;
    if (stored.version !== 1 && stored.version !== 2) return null;

    if (Date.now() - updatedAt > LIFETIME) {
      forgetProgress(sessionId);
      return null;
    }

    const step = stored.version === 1 ? stored.etape : stored.step;
    const done = stored.version === 1 ? stored.faits : stored.done;
    const rounds = stored.version === 1 ? stored.tours : stored.rounds;
    const startedAt = stored.version === 1 ? stored.debutLe : stored.startedAt;

    return {
      version: 2,
      step: Number.isInteger(step) && step! > 0 ? step! : 0,
      performed: stored.performed ?? {},
      done: Array.isArray(done) ? done : [],
      rounds: rounds ?? {},
      skipped: Array.isArray(stored.skipped)
        ? stored.skipped.filter((k): k is string => typeof k === 'string')
        : [],
      ladder: readLadder(stored.ladder),
      chipper: readChipper(stored.chipper),
      startedAt: typeof startedAt === 'number' ? startedAt : undefined,
      updatedAt,
    };
  } catch {
    // Stockage refusé (navigation privée, quota, donnée abîmée) : la séance
    // marche sans lui, elle ne retient simplement rien.
    return null;
  }
};

/** Écrit ce qui change, et garde le reste. */
export const writeProgress = (
  sessionId: string,
  patch: Partial<Omit<SessionProgress, 'version' | 'updatedAt'>>
) => {
  try {
    // `version: 2` n'est pas répété ici : `readProgress` normalise toujours
    // ce qu'il rend, et `patch` ne peut pas porter de version — son type
    // l'exclut. Le répéter donnait une ligne qu'aucun sabotage ne pouvait
    // faire tomber.
    const current = readProgress(sessionId) ?? empty();
    const next: SessionProgress = {
      ...current,
      ...patch,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key(sessionId), JSON.stringify(next));
  } catch {
    // Pareil : on continue sans mémoire plutôt que de casser la séance.
  }
};

/**
 * La séance est partie au serveur, ou le client a demandé à recommencer.
 *
 * C'est le seul moment où l'on efface. Quitter le mode guidé n'efface plus
 * rien : sortir pour répondre au téléphone ne doit pas coûter la séance.
 */
export const forgetProgress = (sessionId: string) => {
  try {
    localStorage.removeItem(key(sessionId));
  } catch {
    // Pareil.
  }
};

/**
 * Recommencer une séance : la position, ce qui est coché, compté, passé,
 * et l'heure de départ repartent de zéro. Les charges notées restent.
 *
 * L'heure de départ aussi, parce qu'une séance recommencée est une autre
 * tentative : la fin annoncerait sinon une durée qui compte la première.
 * Les charges non : effacer ce que quelqu'un a soulevé parce qu'il reprend
 * du début serait la perte que ce module existe pour empêcher.
 */
export const restartProgress = (sessionId: string) =>
  writeProgress(sessionId, {
    step: 0,
    done: [],
    rounds: {},
    skipped: [],
    ladder: {},
    chipper: {},
    startedAt: undefined,
  });

/** Combien d'exercices portent au moins une valeur notée. */
export const countRecorded = (
  performed: Record<string, PerformedValues>
): number =>
  Object.values(performed).filter((v) =>
    v.sets?.some(
      (s) => s.weight != null || s.reps != null || s.duration != null
    )
  ).length;
