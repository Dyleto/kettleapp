import { PerformedValues } from '@/types';

/**
 * Ce qu'une séance en cours garde d'elle-même, entre deux ouvertures.
 *
 * L'application retenait soigneusement où l'on en était — l'index de l'étape
 * partait dans `sessionStorage` à chaque pas — et oubliait ce qu'on avait
 * fait : les charges vivaient dans un `useState` nu. Un rechargement, un
 * appel entrant qui tue l'onglet, et quarante minutes de notes n'existaient
 * plus. C'est l'inverse de ce qu'il fallait garder : une position se
 * retrouve, une charge soulevée ne se retrouve pas.
 *
 * Les deux vivent donc ensemble, dans `localStorage` — qui survit à la
 * fermeture de l'onglet, là où `sessionStorage` meurt avec lui. C'est
 * précisément le cas qu'on voulait couvrir.
 */
interface SeanceEnCours {
  /** Pour pouvoir changer de forme sans lire d'anciens enregistrements. */
  version: 1;
  /** Où l'on en était dans le mode guidé. */
  etape: number;
  /** Ce qui a été noté, par `performedKey(blockOrder, exerciseOrder)`. */
  performed: Record<string, PerformedValues>;
  /**
   * Les efforts déjà faits, par leur clé.
   *
   * Distinct de la position : on peut revenir sur un bloc sans défaire ce
   * qu'on y a fait, et une série cochée le reste même si l'on remonte lire
   * la consigne du mouvement d'avant.
   */
  faits: string[];
  /**
   * Les tours bouclés, par ordre de bloc.
   *
   * Un AMRAP ne se coche pas : il se compte. Le compte vit donc à côté des
   * efforts, et il se perd aussi facilement qu'eux — raison de plus pour
   * qu'il soit ici.
   */
  tours: Record<string, number>;
  /** Quand, en millisecondes. Sert à savoir si ça concerne encore aujourd'hui. */
  majLe: number;
}

const cle = (sessionId: string) => `kettle-seance-${sessionId}`;

/**
 * Au-delà, l'enregistrement appartient à une autre tentative.
 *
 * Une séance d'entraînement tient en quelques heures. Proposer trois jours
 * plus tard de « reprendre où tu en étais » n'aide personne, et repeupler la
 * saisie avec les charges de la semaine dernière serait pire : on les
 * validerait sans les relire.
 */
const DUREE_DE_VIE = 12 * 60 * 60 * 1000;

const vide = (): SeanceEnCours => ({
  version: 1,
  etape: 0,
  performed: {},
  faits: [],
  tours: {},
  majLe: Date.now(),
});

/** L'enregistrement de cette séance, s'il est encore d'actualité. */
export const lireSeance = (sessionId: string): SeanceEnCours | null => {
  try {
    const brut = localStorage.getItem(cle(sessionId));
    if (!brut) return null;
    const lu = JSON.parse(brut) as Partial<SeanceEnCours>;
    if (lu.version !== 1 || typeof lu.majLe !== 'number') return null;
    if (Date.now() - lu.majLe > DUREE_DE_VIE) {
      oublierSeance(sessionId);
      return null;
    }
    return {
      version: 1,
      etape: Number.isInteger(lu.etape) && lu.etape! > 0 ? lu.etape! : 0,
      performed: lu.performed ?? {},
      faits: Array.isArray(lu.faits) ? lu.faits : [],
      tours: lu.tours ?? {},
      majLe: lu.majLe,
    };
  } catch {
    // Stockage refusé (navigation privée, quota, données corrompues) :
    // la séance marche sans, elle ne se souvient simplement de rien.
    return null;
  }
};

/** Écrit ce qui change, et garde le reste. */
export const ecrireSeance = (
  sessionId: string,
  parcelle: Partial<Omit<SeanceEnCours, 'version' | 'majLe'>>
) => {
  try {
    const actuel = lireSeance(sessionId) ?? vide();
    const suivant: SeanceEnCours = {
      ...actuel,
      ...parcelle,
      version: 1,
      majLe: Date.now(),
    };
    localStorage.setItem(cle(sessionId), JSON.stringify(suivant));
  } catch {
    // idem : on continue sans mémoire plutôt que de casser la séance.
  }
};

/**
 * La séance est partie au serveur, ou le client a demandé à recommencer.
 *
 * C'est le seul moment où l'on efface. Quitter le mode guidé n'efface plus
 * rien : sortir pour répondre au téléphone ne doit pas coûter la séance.
 */
export const oublierSeance = (sessionId: string) => {
  try {
    localStorage.removeItem(cle(sessionId));
  } catch {
    // idem
  }
};

/** Combien d'exercices portent au moins une valeur notée. */
export const compterNotes = (
  performed: Record<string, PerformedValues>
): number =>
  Object.values(performed).filter((v) =>
    v.sets?.some(
      (s) => s.weight != null || s.reps != null || s.duration != null
    )
  ).length;
