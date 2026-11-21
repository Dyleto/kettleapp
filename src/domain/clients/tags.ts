import type { Client, Tag } from '@/shared/types';

/**
 * Les étiquettes du coach : leur clé, leur couleur, ce qu'elles filtrent.
 *
 * L'API garde le nom et rien d'autre ; la couleur se déduit du nom, pour que
 * la même étiquette ait toujours la même, d'un écran à l'autre et d'une
 * visite à l'autre, sans qu'on ait à la choisir ni à la stocker.
 */

/** 24 caractères au plus, comme l'API (`TAG_NAME_MAX`). */
export const TAG_NAME_MAX = 24;

/** Le nom tel que l'API le garde : sans espaces autour, ni en double. */
export const tagName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ');

/**
 * La clé d'un nom, celle de l'API : sans accent ni casse. « Reprise » et
 * « reprise » sont la même étiquette, et la création de la seconde serait
 * refusée — le champ ne la propose donc pas.
 */
export const tagKey = (name: string): string =>
  tagName(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Les six teintes d'une étiquette : celles des pastilles du kit, que le
 * domaine nomme sans les importer. */
export type TagTone = 'coral' | 'blue' | 'green' | 'teal' | 'amber' | 'neutral';
const TONES: TagTone[] = ['coral', 'blue', 'green', 'teal', 'amber', 'neutral'];

/**
 * La teinte d'une étiquette, tirée de sa clé : la même étiquette a toujours
 * la même, et la renommer en change — c'est une autre étiquette à l'œil.
 */
export const tagTone = (name: string): TagTone => {
  let hash = 0;
  for (const char of tagKey(name))
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
};

/**
 * Les étiquettes d'un client à afficher sur sa ligne : trois au plus, dans
 * l'ordre de la liste du coach, puis combien il en reste (« + 2 »). Un
 * identifiant que la liste ne connaît plus — une étiquette supprimée
 * ailleurs — est ignoré.
 */
export const visibleTags = (
  tagIds: readonly string[],
  tags: readonly Tag[],
  max = 3
): { shown: Tag[]; more: number } => {
  const mine = tags.filter((tag) => tagIds.includes(tag._id));
  return { shown: mine.slice(0, max), more: Math.max(0, mine.length - max) };
};

/**
 * Les étiquettes qu'appelle ce qui est tapé : celles dont un mot commence
 * ainsi, sans accent ni casse — « se » trouve « Senior » et « Sèche », pas
 * « Prise de masse ». Chercher au milieu des mots faisait remonter tout ce
 * qui finit en « -se ».
 */
export const matchingTags = (tags: readonly Tag[], query: string): Tag[] => {
  const needle = tagKey(query);
  if (!needle) return [...tags];
  return tags.filter((tag) => {
    const key = tagKey(tag.name);
    return (
      key.startsWith(needle) ||
      key.split(' ').some((word) => word.startsWith(needle))
    );
  });
};

/**
 * Ce qui est tapé peut-il devenir une étiquette ? Pas vide, pas trop long,
 * et aucune étiquette de même clé : « Créer “Sen” » n'apparaît que dans ce
 * cas.
 */
export const canCreateTag = (tags: readonly Tag[], query: string): boolean => {
  const name = tagName(query);
  return (
    name.length > 0 &&
    name.length <= TAG_NAME_MAX &&
    !tags.some((tag) => tagKey(tag.name) === tagKey(name))
  );
};

/**
 * Le filtre de la barre : sans étiquette choisie, tout le monde ; sinon,
 * les clients qui en portent au moins une.
 */
export const hasAnyTag = (
  client: Client,
  selected: ReadonlySet<string>
): boolean =>
  selected.size === 0 || client.tagIds.some((id) => selected.has(id));

/** Combien de clients portent cette étiquette : ce que la suppression
 * retirera, dit avant de confirmer. */
export const tagUsage = (clients: readonly Client[], tagId: string): number =>
  clients.filter((client) => client.tagIds.includes(tagId)).length;
