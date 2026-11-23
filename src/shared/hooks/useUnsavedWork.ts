import { useEffect, useRef, useSyncExternalStore } from 'react';

/** Ce qu'un écran déclare tant qu'un rechargement lui coûterait quelque
 * chose. */
interface Claim {
  /** Envoie tout de suite ce qui attend : « Maintenant » sur le bandeau. */
  flush?: () => void;
  /**
   * Rien à enregistrer, mais un rechargement couperait quelque chose : une
   * séance guidée en cours. La nouvelle version attend sans bandeau — on ne
   * pose pas une question par-dessus une série.
   */
  quiet: boolean;
}

/**
 * Y a-t-il, quelque part dans l'application, du travail pas encore enregistré ?
 *
 * Une seule question, posée par la mise à jour automatique : elle recharge la
 * page quand une nouvelle version arrive, et recharger au milieu d'une frappe
 * reprendrait d'une main ce que l'enregistrement automatique répare de
 * l'autre. L'atelier du coach a 800 ms de délai avant d'envoyer une valeur, et
 * son état vit en mémoire.
 *
 * Un registre de module plutôt qu'un contexte, comme pour le bas de l'écran :
 * celui qui réclame vit dans l'atelier, celui qui demande vit à la racine, et
 * les faire parler par un fournisseur obligerait à traverser tout l'arbre pour
 * un booléen.
 *
 * Un ensemble et non un booléen : deux occupants simultanés sont improbables,
 * mais si cela arrivait, le départ du premier annoncerait « plus rien à
 * perdre » alors que le second a encore quelque chose à enregistrer. Se
 * tromper dans ce sens-là coûte le travail de quelqu'un.
 *
 * Observable depuis G4 : le bandeau, monté à la racine, n'apprenait pas
 * qu'un enregistrement venait d'aboutir — rien ne le redessinait —, et la
 * nouvelle version attendait le prochain rendu de hasard.
 */
const claimants = new Map<symbol, Claim>();
const listeners = new Set<() => void>();
let version = 0;

const changed = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Lu au moment de décider, et pas pendant un rendu : une fonction, pas un
 * hook. */
export const hasUnsavedWork = (): boolean =>
  [...claimants.values()].some((claim) => !claim.quiet);

/** Une séance en cours, ou tout ce qu'un rechargement couperait sans rien
 * avoir à enregistrer. */
export const isBusy = (): boolean =>
  [...claimants.values()].some((claim) => claim.quiet);

/** Fait partir tout de suite ce qui attend, partout où quelque chose
 * attend. */
export const flushUnsavedWork = () => {
  claimants.forEach((claim) => claim.flush?.());
};

/**
 * Redessine qui l'appelle quand le registre change : une frappe qui part,
 * une séance qui se ferme. La valeur ne sert à rien d'autre.
 */
export const useUnsavedWorkChanges = (): number =>
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version
  );

/**
 * Déclare qu'il y a quelque chose à perdre, tant que `active`.
 *
 * Le démontage libère aussi : quitter l'atelier ne doit pas laisser
 * l'application pour toujours persuadée qu'une frappe attend.
 */
export const useClaimUnsavedWork = (
  active: boolean,
  { flush, quiet = false }: { flush?: () => void; quiet?: boolean } = {}
) => {
  // La dernière fonction d'envoi, sans refaire la déclaration à chaque
  // rendu : l'atelier en fabrique une nouvelle à chaque changement.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => {
    if (!active) return;
    const id = Symbol('unsaved');
    claimants.set(id, { flush: () => flushRef.current?.(), quiet });
    changed();
    return () => {
      claimants.delete(id);
      changed();
    };
  }, [active, quiet]);
};
