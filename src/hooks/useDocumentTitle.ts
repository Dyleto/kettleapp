import { useEffect } from 'react';

const PRODUIT = 'Kettle';

/**
 * What the browser tab says.
 *
 * Every page was called "Kettle". Two clients open in two tabs were
 * indistinguishable, browser history was useless, and a bookmark did not say
 * what it pointed at.
 *
 * The subject comes first, because a shrunk tab only shows its first few
 * characters: "Corentin Le Moullec · Kettle" is still readable at ten
 * characters, "Kettle · Corentin Le Moullec" is not.
 *
 * `undefined` is a waiting state, not an absence of title: while a name
 * loads, the tab keeps the product name rather than showing a blank and then
 * jumping.
 */
export const useDocumentTitle = (sujet?: string) => {
  useEffect(() => {
    document.title = sujet?.trim() ? `${sujet.trim()} · ${PRODUIT}` : PRODUIT;
  }, [sujet]);
};
