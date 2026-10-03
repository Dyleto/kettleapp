import { useEffect, useSyncExternalStore } from 'react';

/**
 * Le bas de l'écran n'a qu'un emplacement, et il se réclame.
 *
 * En dessous de 768 px, la barre d'onglets est fixée en bas. Quand l'éditeur
 * échouait à enregistrer, sa ligne « Modifications non enregistrées »
 * s'empilait par-dessus : deux barres fixes sur 390 px, et une invitation à
 * naviguer ailleurs alors que du travail n'est pas enregistré.
 *
 * Plutôt que de décaler l'une au-dessus de l'autre, la ligne d'échec prend la
 * place de la barre d'onglets le temps qu'elle dure. C'est aussi plus juste sur
 * le fond : il n'y a rien à aller voir ailleurs tant que ce qu'on vient
 * d'écrire n'est pas parti.
 *
 * Un registre de module plutôt qu'un contexte : l'emplacement est unique dans
 * l'application, la barre d'onglets vit dans la mise en page et son occupant
 * éventuel cinq niveaux plus bas. Les faire parler par un fournisseur
 * obligerait à traverser tout l'arbre pour un booléen.
 */
let claimed = false;
const subscribers = new Set<() => void>();

const publish = (value: boolean) => {
  if (value === claimed) return;
  claimed = value;
  subscribers.forEach((notify) => notify());
};

const subscribe = (notify: () => void) => {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
};

/** Pour la mise en page : quelqu'un occupe-t-il le bas de l'écran ? */
export const useBottomBarClaimed = () =>
  useSyncExternalStore(
    subscribe,
    () => claimed,
    () => false
  );

/**
 * Pour l'occupant : réclame l'emplacement tant que `active`, et le rend en
 * sortant. Le démontage le libère aussi — sinon quitter l'atelier alors qu'un
 * enregistrement a échoué laisserait le coach sans navigation.
 */
export const useClaimBottomBar = (active: boolean) => {
  useEffect(() => {
    publish(active);
    return () => publish(false);
  }, [active]);
};
