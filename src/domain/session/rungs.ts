/**
 * Les paliers d'une échelle, tels que le coach les tape.
 *
 * « 2-4-6-8 », « 2 4 6 8 » ou « 2,4,6,8 », au choix : tiret, espace, virgule
 * ou point médian, comme on veut. Le coach tape selon l'humeur, et lui
 * refuser l'une des écritures ne protège de rien. Ce qui n'est pas un nombre
 * entier positif ne fait pas de palier : un zéro serait une marche vide.
 */
export const parseRungs = (raw: string): number[] =>
  raw
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

/** Ce qui se relit sous le champ : « 2 · 4 · 6 · 8 — 4 paliers ». C'est ce
 * rappel qui rend la saisie libre sans danger. */
export const rungsLine = (rungs: readonly number[]): string =>
  rungs.length > 0
    ? `${rungs.join(' · ')} — ${rungs.length} palier${rungs.length > 1 ? 's' : ''}`
    : 'aucun palier';
