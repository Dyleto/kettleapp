import { useEffect, useRef } from 'react';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';

/**
 * Ce qui ferme une feuille basse, en plus de toucher le fond : le bouton
 * retour du téléphone, et Échap.
 *
 * Il vivait dans l'atelier, qui l'avait eu en premier ; le menu du compte,
 * dans `shared`, en a besoin aussi, et `shared` n'importe aucune
 * fonctionnalité. L'atelier le prête toujours, sous le même nom.
 *
 * La feuille du kit ne connaît ni l'un ni l'autre : elle sert aussi des
 * questions qui doivent recevoir une réponse. Les feuilles de réglage, elles,
 * se referment comme les autres couches de l'atelier — et un Échap déjà
 * consommé par un champ ne les ferme pas : il y rend la valeur d'avant.
 *
 * `close` est lu par une référence, comme dans `useOutsideDismiss` : un
 * écouteur réabonné à chaque rendu manque l'événement qui se distribue
 * pendant qu'il change.
 */
export const useSheetDismiss = (open: boolean, close: () => void) => {
  useBackDismiss(open, close);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
};
