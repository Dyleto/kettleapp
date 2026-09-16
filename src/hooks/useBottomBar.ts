import { useEffect, useSyncExternalStore } from 'react';

/**
 * Le bas de l'écran n'a qu'une place, et elle se réclame.
 *
 * Sous 768 px, la barre d'onglets est fixée en bas. Quand l'atelier échouait
 * à enregistrer, sa ligne « Modifications non enregistrées » venait s'empiler
 * par-dessus : deux bandeaux fixes sur 390 px, et une invitation à naviguer
 * ailleurs pendant que du travail n'est pas sauvé.
 *
 * Plutôt que de décaler l'une au-dessus de l'autre, la ligne d'échec prend la
 * place de la barre d'onglets tant qu'elle dure. C'est aussi plus juste sur le
 * fond : il n'y a rien à aller voir ailleurs tant que ce qu'on vient d'écrire
 * n'est pas parti.
 *
 * Un registre de module plutôt qu'un contexte : la place est unique dans
 * l'application, la barre d'onglets vit dans la mise en page et son occupant
 * potentiel cinq niveaux plus bas. Les faire dialoguer par un fournisseur
 * reviendrait à traverser tout l'arbre pour un booléen.
 */
let reclamee = false;
const abonnes = new Set<() => void>();

const publier = (valeur: boolean) => {
  if (valeur === reclamee) return;
  reclamee = valeur;
  abonnes.forEach((notifier) => notifier());
};

const abonner = (notifier: () => void) => {
  abonnes.add(notifier);
  return () => {
    abonnes.delete(notifier);
  };
};

/** Pour la mise en page : quelqu'un occupe-t-il le bas de l'écran ? */
export const useBottomBarClaimed = () =>
  useSyncExternalStore(
    abonner,
    () => reclamee,
    () => false
  );

/**
 * Pour l'occupant : réclame la place tant que `actif`, et la rend en partant.
 * Le démontage libère aussi — sinon quitter l'atelier en échec laisserait le
 * coach sans navigation.
 */
export const useClaimBottomBar = (actif: boolean) => {
  useEffect(() => {
    publier(actif);
    return () => publier(false);
  }, [actif]);
};
