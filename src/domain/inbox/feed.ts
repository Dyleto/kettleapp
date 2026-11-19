import type { CompletedSession, InboxItem } from '@/shared/types';
import { formatWeight, heaviest } from '@/domain/history/load';
import { scoreChip } from '@/domain/history/blockScore';
import { dayKey } from '@/domain/week/dates';

/**
 * Le fil « À lire » : dans quel ordre le coach lit, et ce que chaque carte
 * lui dit sans qu'il l'ouvre.
 *
 * Écrit à part de l'écran parce que chaque règle se trompe sur un cas que
 * l'écran ne fabrique pas : un « trop facile » qui n'en suit pas un autre,
 * une séance calme seule chez son client, une charge qui ne bouge pas.
 */

/** Pourquoi une séance passe devant les autres — ou se range avec elles. */
export type Concern = 'alert' | 'repeatedEasy' | 'quiet' | 'other';

/**
 * Ce qu'une séance demande au coach.
 *
 * — `alert` : « Trop dure », ou une douleur. Ce sont les deux cas où
 *   attendre coûte quelque chose au client.
 * — `repeatedEasy` : « Trop facile » deux fois de suite sur la même séance.
 *   Une fois peut être un bon jour ; deux fois, c'est la séance qui est mal
 *   réglée.
 * — `quiet` : « Juste », sans un mot, sans rien d'inquiétant. La séance s'est
 *   passée comme prévu, et c'est tout ce qu'il y a à en savoir.
 * — `other` : le reste, qui se lit dans l'ordre où il est arrivé.
 *
 * Un mot du client n'est jamais calme : il l'a écrit pour être lu.
 */
export const concernOf = ({ completed, previous }: InboxItem): Concern => {
  const effort = completed.feedback?.effort;
  const tags = completed.feedback?.tags ?? [];
  if (effort === 5 || tags.includes('pain')) return 'alert';
  if (effort === 1 && previous?.feedback?.effort === 1) return 'repeatedEasy';
  const said = completed.clientNotes?.trim();
  const worrying = tags.some((tag) => tag !== 'great_shape');
  if (effort === 3 && !said && !worrying) return 'quiet';
  return 'other';
};

/** Une ligne du fil : une carte, ou les séances calmes d'un client
 * repliées en une. */
export type FeedEntry =
  | { kind: 'card'; item: InboxItem; concern: Concern }
  | { kind: 'fold'; clientId: string; items: InboxItem[] };

const RANK: Record<Concern, number> = {
  alert: 0,
  repeatedEasy: 1,
  quiet: 2,
  other: 2,
};

const at = (item: InboxItem) => Date.parse(item.completed.completedAt);

/**
 * Le fil dans l'ordre de lecture.
 *
 * D'abord ce qui fait mal, puis ce qui est mal réglé, puis le reste du plus
 * récent au plus ancien — la maquette. Les séances calmes d'un même client
 * se replient en une ligne dès qu'il y en a deux : trois cartes « Juste »
 * de Thomas se lisent comme « Thomas va bien », pas comme trois choses à
 * lire. Seule, une séance calme reste une carte : la replier ne cacherait
 * rien, et rendrait une séance moins lisible qu'une carte.
 *
 * La ligne repliée prend sa place à la date de sa séance la plus récente.
 */
export const feedOf = (items: readonly InboxItem[]): FeedEntry[] => {
  const quietByClient = new Map<string, InboxItem[]>();
  for (const item of items) {
    if (concernOf(item) !== 'quiet') continue;
    const list = quietByClient.get(item.client._id) ?? [];
    list.push(item);
    quietByClient.set(item.client._id, list);
  }

  const ranked: { entry: FeedEntry; rank: number; time: number }[] = [];
  const folded = new Set<InboxItem>();
  for (const [clientId, quiet] of quietByClient) {
    if (quiet.length < 2) continue;
    const sorted = [...quiet].sort((a, b) => at(b) - at(a));
    sorted.forEach((item) => folded.add(item));
    ranked.push({
      entry: { kind: 'fold', clientId, items: sorted },
      rank: RANK.quiet,
      time: at(sorted[0]),
    });
  }
  for (const item of items) {
    if (folded.has(item)) continue;
    const concern = concernOf(item);
    ranked.push({
      entry: { kind: 'card', item, concern },
      rank: RANK[concern],
      time: at(item),
    });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || b.time - a.time)
    .map(({ entry }) => entry);
};

/**
 * Le nom d'un client, ou ce qu'on dit quand son compte n'en porte plus —
 * un compte supprimé laisse ses séances dans le fil.
 */
export const clientLabel = (client: InboxItem['client']): string =>
  `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() ||
  'Client sans nom';

/**
 * Les étiquettes de santé dans l'ordre où elles se lisent : la douleur
 * d'abord, puisque c'est elle qui fait passer la séance devant les autres.
 */
export const tagsInOrder = <T extends string>(tags: readonly T[] = []): T[] =>
  [...tags].sort((a, b) => Number(b === 'pain') - Number(a === 'pain'));

/** Une pastille de ce qui a été fait. */
export interface DoneChip {
  text: string;
  /** Une charge qui monte, une qui baisse, ou un score qui se lit tel quel. */
  tone: 'up' | 'down' | 'score';
}

/** La charge la plus lourde d'un mouvement dans une séance, par identifiant
 * d'exercice : c'est le mouvement qu'on compare, pas sa place. */
export const loadsOf = (completed: CompletedSession | undefined) => {
  const loads = new Map<string, number>();
  completed?.blocks.forEach((block) =>
    block.exercises.forEach((entry) => {
      const id = entry.exercise?._id;
      const load = heaviest(entry.performed?.sets);
      if (typeof id === 'string' && load !== undefined)
        loads.set(id, Math.max(loads.get(id) ?? 0, load));
    })
  );
  return loads;
};

/**
 * Ce qui a été fait, en pastilles : les charges comparées au passage d'avant,
 * et les scores des blocs qui se comptent.
 *
 * Une charge qui ne bouge pas ne fait pas de pastille : le coach cherche ce
 * qui a changé, et « Goblet Squat 26 kg » sans flèche ne lui dit rien qu'il
 * n'ait déjà prescrit. Sans passage d'avant, aucune charge ne se compare.
 *
 * Trois au plus, puis le compte du reste : une carte se lit sans s'ouvrir,
 * et six pastilles ne se lisent plus.
 */
export const doneChips = (
  { completed, previous }: InboxItem,
  max = 3
): { chips: DoneChip[]; more: number } => {
  const before = loadsOf(previous);
  const all: DoneChip[] = [];
  const seen = new Set<string>();
  completed.blocks.forEach((block) => {
    block.exercises.forEach((entry) => {
      const id = entry.exercise?._id;
      const name = entry.exercise?.name;
      const load = heaviest(entry.performed?.sets);
      if (typeof id !== 'string' || typeof name !== 'string') return;
      if (load === undefined || seen.has(id)) return;
      seen.add(id);
      const was = before.get(id);
      if (was === undefined || was === load) return;
      all.push({
        text: `${name} ${formatWeight(load)} kg ${load > was ? '↗' : '↘'}`,
        tone: load > was ? 'up' : 'down',
      });
    });
    const score = scoreChip(block);
    if (score) all.push({ text: score, tone: 'score' });
  });
  return { chips: all.slice(0, max), more: Math.max(0, all.length - max) };
};

/**
 * Ce que la carte dit à la place du mot du client.
 *
 * Son mot, quand il en a écrit un. Sinon, une phrase utile quand il y en a
 * une — un « trop facile » qui se répète se dit, puisque le mot manque pour
 * le dire — et rien dans les autres cas : « Aucun mot » sous chaque carte
 * calme serait du bruit.
 */
export const noteOf = (
  item: InboxItem
): { kind: 'quote' | 'hint'; text: string } | null => {
  const said = item.completed.clientNotes?.trim();
  if (said) return { kind: 'quote', text: said };
  if (concernOf(item) === 'repeatedEasy')
    return {
      kind: 'hint',
      text: 'Aucun mot. Deuxième « trop facile » de suite.',
    };
  return null;
};

const hour = (date: Date) => `${date.getHours()} h`;

/**
 * Quand la séance a été faite, comme on le dirait : « aujourd'hui, 9 h »,
 * « hier, 18 h », « il y a 3 jours », puis la date.
 *
 * Au jour près en heure locale : une séance de 23 h n'est pas « aujourd'hui »
 * le lendemain matin. Au-delà d'une semaine, compter les jours ne dit plus
 * rien — la date se lit mieux.
 */
export const whenLabel = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso);
  const day = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(date)) / 86_400_000);
  if (dayKey(date) === dayKey(now)) return `aujourd’hui, ${hour(date)}`;
  if (days === 1) return `hier, ${hour(date)}`;
  if (days > 1 && days < 7) return `il y a ${days} jours`;
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(date);
};
