/**
 * localStorage, mais qui ne fait pas tomber l'application.
 *
 * Le simple fait de toucher `localStorage` lève en navigation privée sur
 * certains navigateurs, et l'écriture lève quand le quota est plein. Ces
 * accès-là servent à retenir l'état d'un retour OAuth : rien qui vaille un
 * écran blanc. Chaque appel échoue donc en silence, en disant seulement s'il
 * a réussi.
 *
 * Quatre autres fonctions vivaient ici — `isAvailable`, `setJSON`, `getJSON`,
 * `clear` — sans qu'aucune ne soit appelée nulle part. Ce qui n'est pas
 * utilisé ne se maintient pas : on le retire.
 */

/** Écrire, en disant si c'est passé plutôt qu'en le supposant. */
export const setItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[Storage] Impossible de sauvegarder "${key}":`, error);
    return false;
  }
};

/**
 * Relire. `null` ne distingue pas l'absence de l'échec : l'appelant repart de
 * zéro dans les deux cas.
 */
export const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[Storage] Impossible de récupérer "${key}":`, error);
    return null;
  }
};

/** Effacer une clé — un nettoyage de fin de parcours, jamais critique. */
export const removeItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[Storage] Impossible de supprimer "${key}":`, error);
    return false;
  }
};

// Les appelants importent l'objet par défaut (`storage.setItem`) : un seul
// nom à lire au point d'appel, et il dit d'où vient l'accès.
export default { setItem, getItem, removeItem };
