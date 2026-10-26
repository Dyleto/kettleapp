import { useEffect } from 'react';

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
 */
const claimants = new Set<symbol>();

/** Lu au moment de décider, et pas pendant un rendu : une fonction, pas un
 * hook. */
export const hasUnsavedWork = (): boolean => claimants.size > 0;

/**
 * Déclare qu'il y a quelque chose à perdre, tant que `active`.
 *
 * Le démontage libère aussi : quitter l'atelier ne doit pas laisser
 * l'application pour toujours persuadée qu'une frappe attend.
 */
export const useClaimUnsavedWork = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    const id = Symbol('unsaved');
    claimants.add(id);
    return () => {
      claimants.delete(id);
    };
  }, [active]);
};
