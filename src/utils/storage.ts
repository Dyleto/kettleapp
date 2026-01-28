/**
 * Wrapper sécurisé pour localStorage
 * Gère les erreurs (mode privé, quota dépassé, etc.)
 */

/**
 * Sauvegarder une valeur dans localStorage
 * @param key - Clé de stockage
 * @param value - Valeur à stocker
 * @returns true si succès, false si erreur
 */
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
 * Récupérer une valeur depuis localStorage
 * @param key - Clé de stockage
 * @returns La valeur ou null si erreur/non trouvée
 */
export const getItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[Storage] Impossible de récupérer "${key}":`, error);
    return null;
  }
};

/**
 * Supprimer une valeur de localStorage
 * @param key - Clé de stockage
 * @returns true si succès, false si erreur
 */
export const removeItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[Storage] Impossible de supprimer "${key}":`, error);
    return false;
  }
};

/**
 * Vérifier si localStorage est disponible
 * @returns true si disponible, false sinon
 */
export const isAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sauvegarder un objet JSON dans localStorage
 * @param key - Clé de stockage
 * @param value - Objet à stocker
 * @returns true si succès, false si erreur
 */
export const setJSON = <T>(key: string, value: T): boolean => {
  try {
    const json = JSON.stringify(value);
    return setItem(key, json);
  } catch (error) {
    console.warn(`[Storage] Impossible de sérialiser "${key}":`, error);
    return false;
  }
};

/**
 * Récupérer un objet JSON depuis localStorage
 * @param key - Clé de stockage
 * @returns L'objet parsé ou null si erreur
 */
export const getJSON = <T>(key: string): T | null => {
  try {
    const json = getItem(key);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn(`[Storage] Impossible de parser "${key}":`, error);
    return null;
  }
};

/**
 * Vider tout le localStorage
 * @returns true si succès, false si erreur
 */
export const clear = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn("[Storage] Impossible de vider le localStorage:", error);
    return false;
  }
};

// Export par défaut d'un objet avec toutes les méthodes
export default {
  setItem,
  getItem,
  removeItem,
  isAvailable,
  setJSON,
  getJSON,
  clear,
};
