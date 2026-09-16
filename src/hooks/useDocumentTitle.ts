import { useEffect } from 'react';

const PRODUIT = 'Kettle';

/**
 * Ce que dit l'onglet du navigateur.
 *
 * Toutes les pages s'appelaient « Kettle ». Deux clients ouverts dans deux
 * onglets étaient indiscernables, l'historique du navigateur ne servait à
 * rien, et un signet ne disait pas ce qu'il pointait.
 *
 * Le sujet passe devant, parce qu'un onglet réduit ne montre que ses premiers
 * caractères : « Corentin Le Moullec · Kettle » reste lisible à dix
 * caractères, « Kettle · Corentin Le Moullec » ne l'est plus.
 *
 * `undefined` est un état d'attente, pas une absence de titre : pendant qu'un
 * nom se charge, l'onglet garde le nom du produit plutôt que d'afficher un
 * blanc puis de sauter.
 */
export const useDocumentTitle = (sujet?: string) => {
  useEffect(() => {
    document.title = sujet?.trim() ? `${sujet.trim()} · ${PRODUIT}` : PRODUIT;
  }, [sujet]);
};
