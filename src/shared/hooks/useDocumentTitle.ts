import { useEffect } from 'react';

const PRODUIT = 'Kettle';

/**
 * Ce que dit l'onglet du navigateur.
 *
 * Toutes les pages s'appelaient « Kettle ». Deux clients ouverts dans deux
 * onglets étaient indiscernables, l'historique du navigateur ne servait à
 * rien, et un favori ne disait pas sur quoi il pointait.
 *
 * Le sujet vient en premier, parce qu'un onglet rétréci ne montre que ses
 * premiers caractères : « Corentin Le Moullec · Kettle » reste lisible à dix
 * caractères, « Kettle · Corentin Le Moullec » non.
 *
 * `undefined` est un état d'attente, pas une absence de titre : pendant qu'un
 * nom charge, l'onglet garde le nom du produit plutôt que d'afficher un blanc
 * puis de sauter.
 */
export const useDocumentTitle = (sujet?: string) => {
  useEffect(() => {
    document.title = sujet?.trim() ? `${sujet.trim()} · ${PRODUIT}` : PRODUIT;
  }, [sujet]);
};
