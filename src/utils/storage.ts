/**
 * A safe wrapper around localStorage.
 * Handles the errors (private mode, quota exceeded, and so on).
 */

/**
 * Save a value to localStorage.
 * @param key - the storage key
 * @param value - the value to store
 * @returns true on success, false on error
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
 * Read a value back from localStorage.
 * @param key - the storage key
 * @returns the value, or null on error or when not found
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
 * Remove a value from localStorage.
 * @param key - the storage key
 * @returns true on success, false on error
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
 * Check whether localStorage is available.
 * @returns true when available, false otherwise
 */
export const isAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Save a JSON object to localStorage.
 * @param key - the storage key
 * @param value - the object to store
 * @returns true on success, false on error
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
 * Read a JSON object back from localStorage.
 * @param key - the storage key
 * @returns the parsed object, or null on error
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
 * Clear localStorage entirely.
 * @returns true on success, false on error
 */
export const clear = (): boolean => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('[Storage] Impossible de vider le localStorage:', error);
    return false;
  }
};

// Default export: one object carrying every method.
export default {
  setItem,
  getItem,
  removeItem,
  isAvailable,
  setJSON,
  getJSON,
  clear,
};
