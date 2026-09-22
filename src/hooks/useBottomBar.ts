import { useEffect, useSyncExternalStore } from 'react';

/**
 * The bottom of the screen has one slot, and it is claimed.
 *
 * Below 768 px the tab bar is fixed to the bottom. When the editor failed to
 * save, its "Modifications non enregistrées" line stacked on top: two fixed
 * bars on 390 px, and an invitation to navigate elsewhere while work is
 * unsaved.
 *
 * Rather than offsetting one above the other, the failure line takes the tab
 * bar's place for as long as it lasts. That is also truer on the substance:
 * there is nothing to go and see elsewhere while what you just wrote has not
 * left.
 *
 * A module registry rather than a context: the slot is unique in the app, the
 * tab bar lives in the layout and its potential occupant five levels below.
 * Making them talk through a provider would mean crossing the whole tree for
 * one boolean.
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
