import type { Exercise } from '@/shared/types';
import { normalize } from '@/shared/utils/formatters';

/**
 * Ce que « + exercice » propose, et dans quel ordre.
 *
 * Le champ de l'atelier et le tiroir du téléphone portaient chacun leur
 * copie de ce rangement — même code, deux fois. La règle vit ici une seule
 * fois, et se teste sans écran.
 */

/** Un groupe du sélecteur : son titre, ses mouvements. */
export interface ChoiceGroup {
  label: string;
  exercises: Exercise[];
}

export const IN_PROGRAM = 'Dans ce programme';
export const MOST_USED = 'Tes plus utilisés';
export const LIBRARY = 'Dans ta bibliothèque';

const byName = (a: Exercise, b: Exercise) =>
  a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });

/**
 * À la frappe : ce qui commence par la frappe d'abord, puis le plus
 * utilisé, puis l'ordre alphabétique. Le compteur ordonne ; c'est la ligne
 * qui l'affiche.
 */
const ranked = (matches: Exercise[], q: string) =>
  [...matches].sort((a, b) => {
    const aStarts = normalize(a.name).startsWith(q);
    const bStarts = normalize(b.name).startsWith(q);
    if (aStarts !== bStarts) return aStarts ? -1 : 1;
    const byUsage = (b.usageCount ?? 0) - (a.usageCount ?? 0);
    return byUsage !== 0 ? byUsage : byName(a, b);
  });

/**
 * Les groupes du sélecteur, et le nom à créer s'il n'existe pas encore.
 *
 * À la frappe, la maquette range d'abord les mouvements déjà dans ce
 * programme, puis la bibliothèque, puis « Créer » : le mouvement qu'on
 * cherche est le plus souvent celui qu'on a déjà placé ailleurs dans le
 * programme. Ils se mêlaient en un seul « Résultats », où le Kettlebell
 * Swing de la séance d'avant passait derrière un Swing à une main jamais
 * utilisé dès que celui-ci commençait par la frappe.
 *
 * Sans frappe : ce programme, les cinq plus utilisés ailleurs, puis le
 * reste par ordre alphabétique.
 *
 * Rien n'est à créer quand le nom existe déjà, accents et capitales mis à
 * part : « goblet squat » ne doit pas faire un second Goblet Squat.
 */
export const exerciseChoices = (
  query: string,
  library: readonly Exercise[],
  inProgram: readonly Exercise[]
): { groups: ChoiceGroup[]; create?: string } => {
  const q = normalize(query);
  // Les mouvements du programme, tels que la bibliothèque les porte : un
  // programme les repeuple sans leurs compteurs, et Burpee, placé dans sept
  // séances, se lisait « jamais utilisé » en tête du sélecteur.
  const byId = new Map(library.map((e) => [e._id, e]));
  const placed = inProgram.map((e) => byId.get(e._id) ?? e);
  const programIds = new Set(placed.map((e) => e._id));
  const outside = library.filter((e) => !programIds.has(e._id));

  if (q.length === 0) {
    const mostUsed = outside
      .filter((e) => (e.usageCount ?? 0) > 0)
      .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
      .slice(0, 5);
    const mostUsedIds = new Set(mostUsed.map((e) => e._id));
    return {
      groups: [
        { label: IN_PROGRAM, exercises: [...placed].sort(byName) },
        { label: MOST_USED, exercises: mostUsed },
        {
          label: LIBRARY,
          exercises: outside
            .filter((e) => !mostUsedIds.has(e._id))
            .sort(byName),
        },
      ].filter((g) => g.exercises.length > 0),
    };
  }

  const matches = (list: readonly Exercise[]) =>
    ranked(
      list.filter((e) => normalize(e.name).includes(q)),
      q
    );
  const trimmed = query.trim();
  const exists = [...library, ...placed].some(
    (e) => normalize(e.name) === normalize(trimmed)
  );
  return {
    groups: [
      { label: IN_PROGRAM, exercises: matches(placed) },
      { label: LIBRARY, exercises: matches(outside) },
    ].filter((g) => g.exercises.length > 0),
    create: trimmed && !exists ? trimmed : undefined,
  };
};

/** Ce qu'une ligne du sélecteur dit de l'usage : « 12 séances »,
 * « jamais utilisé ». Le coach reconnaît le mouvement qu'il place
 * toujours, et celui qu'il a créé par erreur. */
export const usageLine = (exercise: Exercise): string => {
  const n = exercise.usageCount ?? 0;
  return n === 0 ? 'jamais utilisé' : `${n} séance${n > 1 ? 's' : ''}`;
};

/**
 * Ce que la fiche dit avant qu'on la modifie : « Utilisé dans 9 séances,
 * chez 4 clients. Ce que tu changes ici change partout. »
 *
 * La fiche se modifie pour tous les programmes qui l'utilisent : corriger la
 * vidéo de la séance de Sarah la corrige chez les trois autres. Le dire
 * avant, c'est éviter la surprise après.
 */
export const reachLine = (exercise: Exercise): string => {
  const sessions = exercise.usageCount ?? 0;
  if (sessions === 0) return 'Pas encore utilisé dans une séance.';
  const clients = exercise.clientCount ?? 0;
  const where = `Utilisé dans ${sessions} séance${sessions > 1 ? 's' : ''}`;
  const who =
    clients > 0 ? `, chez ${clients} client${clients > 1 ? 's' : ''}` : '';
  return `${where}${who}. Ce que tu changes ici change partout.`;
};
