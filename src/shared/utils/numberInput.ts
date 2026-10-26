/**
 * Ce qu'un champ numérique comprend de ce qu'on y tape.
 *
 * La virgule d'abord : c'est le séparateur décimal du français, et c'est
 * celui que le pavé numérique d'un téléphone propose en français.
 * `Number('22,5')` vaut `NaN`, donc « 22,5 » était purement rejeté — retour
 * du terrain : « les ,5 ne marchent pas, il peut pas écrire 22,5 par
 * exemple ».
 *
 * Une seule adresse, parce qu'il y en avait trois : l'atelier du coach, la
 * séance guidée et le formulaire de bilan portaient chacun leur copie, et
 * elles avaient divergé — deux convertissaient la virgule, la troisième non.
 *
 * Pas de signe accepté : aucun de ces champs ne reçoit de valeur négative —
 * une charge, des répétitions, une durée. Refuser le moins ici évite de
 * devoir le refuser dans chacun d'eux.
 */

/** Ce qu'on accepte comme nombre en cours de frappe : « 22 », « 22. »,
 * « .5 ». */
const SHAPE = /^\d*\.?\d*$/;

interface Options {
  /**
   * Les décimales sont-elles permises ?
   *
   * La frontière n'est pas esthétique, elle est au contrat : l'API déclare
   * `reps`, `sets`, `rounds` et `repsScheme` en entiers, et `customMetric`
   * et `weight` en nombres. Envoyer « 12,5 » dans un champ entier donnerait
   * un 400 que le coach lirait comme « ça n'enregistre pas » — soit
   * exactement le défaut qu'on répare, déplacé d'un cran.
   *
   * Par défaut non : un champ qui n'a pas dit qu'il acceptait les décimales
   * ne les accepte pas.
   */
  decimals?: boolean;
}

/**
 * Le nombre que porte ce texte, ou `undefined` s'il n'en porte aucun.
 *
 * `undefined` veut dire « rien ici », jamais « zéro » : c'est la distinction
 * que tout le reste de l'application tient, depuis le champ jusqu'à ce qu'on
 * envoie à l'API.
 */
export const parseNumberInput = (
  raw: string,
  { decimals = false }: Options = {}
): number | undefined => {
  const text = raw.trim().replace(',', '.');
  if (text === '' || text === '.') return undefined;
  if (!SHAPE.test(text)) return undefined;

  // Pas de contrôle de finitude ici : `SHAPE` a déjà garanti un numéral
  // décimal, et le vide est écarté au-dessus — `Number(text)` est donc
  // toujours fini. Le `Number.isFinite` qui vivait là ne pouvait pas se
  // déclencher : le sabotage qui le retirait ne faisait tomber aucune
  // assertion, et pour cause.
  const parsed = Number(text);

  return decimals ? parsed : Math.round(parsed);
};
