import type { Client } from '@/shared/types';
import { normalize } from '@/shared/utils/formatters';
import { getEffortLevel, type EffortZone } from '@/domain/history/effort';
import { streakOfZones } from '@/domain/history/journal';

/**
 * La liste des clients du coach : ce que dit chaque ligne, ce que comptent
 * les trois tuiles de tête, et l'ordre de la liste.
 *
 * Tout vivait dans le composant de la liste, où rien ne l'éprouvait sans
 * navigateur : le seuil du silence, la priorité des séances à lire, les
 * tournures de l'ancienneté. La maquette ajoute les tuiles, qui comptent
 * exactement ce que les lignes disent — deux calculs de la même chose
 * finiraient par se contredire, d'où un seul module.
 *
 * `now` est un paramètre et non une lecture de l'horloge : le banc et les
 * tests figent le jour, et un client « à relancer » ne doit pas le devenir
 * parce que le test tourne un lundi.
 */

/** Au-delà de quatorze jours sans séance, un client est à relancer. */
export const SILENCE_DAYS = 14;

const DAY = 86_400_000;

const daysSince = (iso: string, now: Date) =>
  Math.floor((now.getTime() - Date.parse(iso)) / DAY);

/** La dernière fois que ce client a bougé : sa dernière séance, ou son
 * arrivée quand il n'en a fait aucune. */
const lastActivity = (client: Client) =>
  Date.parse(client.lastCompletedAt ?? client.linkedAt);

/** Le nom affiché, ou ce qu'on dit d'un compte qui n'en porte pas. */
export const clientName = (client: Client): string =>
  `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim() ||
  'Client sans nom';

/**
 * Deux ressentis consécutifs du même côté de l'échelle : la séance est mal
 * réglée, et dans quel sens.
 *
 * Deux et pas un : une séance dure après une nuit courte ne dit rien du
 * programme. Le côté, et non la valeur exacte : « Dure » puis « Trop dure »
 * disent la même chose au coach.
 */
export const effortTrend = (
  efforts: readonly number[]
): 'hard' | 'easy' | null => {
  const [before, last] = efforts.slice(-2).map((e) => getEffortLevel(e)?.zone);
  if (!before || before !== last) return null;
  return last === 'hard' ? 'hard' : last === 'easy' ? 'easy' : null;
};

const TREND_WORDS = { hard: 'devient trop dure', easy: 'trop facile' };

/**
 * « 3 semaines », « 2 mois » : une durée qu'on lit d'un coup d'œil.
 *
 * Au-delà de deux mois on ne compte plus les semaines — personne ne lit
 * « 11 semaines ».
 */
const span = (days: number): string => {
  if (days < 14) return `${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks} semaines`;
  return `${Math.floor(days / 30)} mois`;
};

/** Un client sans séance depuis plus de quatorze jours, alors qu'il a un
 * programme : c'est au coach de le relancer. Sans programme, c'est au coach
 * de l'écrire, et la ligne le dit autrement. */
export const isSilent = (client: Client, now: Date): boolean =>
  client.unseenCount === 0 &&
  client.sessionCount > 0 &&
  daysSince(client.lastCompletedAt ?? client.linkedAt, now) > SILENCE_DAYS;

export type StatusTone = 'amber' | 'coral' | 'blue' | 'green' | 'muted';

/**
 * La ligne d'état d'un client : ce qui l'attend, en toutes lettres, et sa
 * couleur.
 *
 * Une seule phrase, dans cet ordre de priorité : des séances à lire (et la
 * tendance quand il y en a une), un programme à écrire, un silence, une
 * tendance, sinon « à jour ». L'ancienne ligne avait quatre anatomies et un
 * « 3 » ambre sans légende ; la maquette n'en garde qu'une.
 *
 * Rien ne s'accorde avec la personne : on ne connaît pas son genre. C'est
 * la séance qui « devient trop dure », et un « nouveau suivi » qui commence
 * — « nouvelle » dans la maquette, que le prénom seul ne permet pas d'écrire.
 */
export const statusLine = (
  client: Client,
  now: Date
): { text: string; tone: StatusTone } => {
  const trend = effortTrend(client.recentEfforts);
  const n = client.unseenCount;
  if (n > 0)
    return trend
      ? {
          text: `${n} à lire · ${TREND_WORDS[trend]}`,
          tone: trend === 'hard' ? 'coral' : 'blue',
        }
      : { text: `${n} séance${n > 1 ? 's' : ''} à lire`, tone: 'amber' };
  if (client.sessionCount === 0)
    return {
      text:
        !client.lastCompletedAt &&
        daysSince(client.linkedAt, now) <= SILENCE_DAYS
          ? 'nouveau suivi · programme à écrire'
          : 'programme à écrire',
      tone: 'muted',
    };
  if (isSilent(client, now)) {
    const days = daysSince(client.lastCompletedAt ?? client.linkedAt, now);
    return {
      text: client.lastCompletedAt
        ? `rien depuis ${span(days)}`
        : `aucune séance depuis ${span(days)}`,
      tone: 'coral',
    };
  }
  if (trend)
    return {
      text: TREND_WORDS[trend],
      tone: trend === 'hard' ? 'coral' : 'blue',
    };
  return { text: 'à jour', tone: 'green' };
};

/** Ce que filtrent les trois tuiles de tête. */
export type ClientFilter = 'unread' | 'silent' | 'misjudged';

/** Le client répond-il à ce filtre ? Les tuiles comptent avec la même
 * règle, pour qu'une tuile qui dit « 2 » montre deux lignes. */
export const passesFilter = (
  client: Client,
  filter: ClientFilter,
  now: Date
): boolean =>
  filter === 'unread'
    ? client.unseenCount > 0
    : filter === 'silent'
      ? isSilent(client, now)
      : effortTrend(client.recentEfforts) !== null;

/**
 * Les trois chiffres de tête : les séances à lire et chez combien de
 * clients, les clients à relancer, ceux dont la séance est mal réglée.
 */
export const tileCounts = (clients: readonly Client[], now: Date) => ({
  unreadSessions: clients.reduce((sum, c) => sum + c.unseenCount, 0),
  unreadClients: clients.filter((c) => passesFilter(c, 'unread', now)).length,
  silent: clients.filter((c) => passesFilter(c, 'silent', now)).length,
  misjudged: clients.filter((c) => passesFilter(c, 'misjudged', now)).length,
});

export type ClientSort = 'triage' | 'recent' | 'alpha';

const byName = (a: Client, b: Client) =>
  clientName(a).localeCompare(clientName(b), 'fr', { sensitivity: 'base' });

/**
 * L'ordre de la liste.
 *
 * Par défaut, ce qui demande de l'attention : les séances à lire d'abord
 * (les plus nombreuses en tête), puis les clients à relancer (le plus long
 * silence en tête), puis les autres par dernière activité. Le premier nom
 * est toujours le prochain à traiter. « Activité » et « A → Z » restent,
 * dans le menu de tri.
 */
export const sortClients = (
  clients: readonly Client[],
  sort: ClientSort,
  now: Date
): Client[] => {
  const list = [...clients];
  if (sort === 'alpha') return list.sort(byName);
  if (sort === 'recent')
    return list.sort(
      (a, b) => lastActivity(b) - lastActivity(a) || byName(a, b)
    );
  const group = (c: Client) =>
    c.unseenCount > 0 ? 0 : isSilent(c, now) ? 1 : 2;
  return list.sort(
    (a, b) =>
      group(a) - group(b) ||
      (group(a) === 0 ? b.unseenCount - a.unseenCount : 0) ||
      (group(a) === 1
        ? lastActivity(a) - lastActivity(b)
        : lastActivity(b) - lastActivity(a)) ||
      byName(a, b)
  );
};

/**
 * La recherche : chaque mot tapé doit se trouver dans le prénom ou le nom,
 * sans tenir compte des accents ni de la casse.
 *
 * Chaque mot séparément : « mar du » doit trouver « Marie Dupont », parce
 * qu'on tape le prénom puis le début du nom sans savoir lequel est lequel.
 */
export const matchesQuery = (client: Client, query: string): boolean => {
  const needle = normalize(query);
  if (!needle) return true;
  const haystack = normalize(
    `${client.firstName ?? ''} ${client.lastName ?? ''}`
  );
  return needle.split(/\s+/).every((word) => haystack.includes(word));
};

/**
 * « avec toi depuis le 1er juin » : l'ancienneté du suivi, en tête du
 * panneau d'un client.
 *
 * Le premier du mois s'écrit « 1er », comme on l'écrit à la main ; l'année
 * n'apparaît que lorsqu'elle n'est pas celle de `now`.
 */
export const followedSince = (linkedAt: string, now: Date): string => {
  const date = new Date(linkedAt);
  const day = date.getDate() === 1 ? '1er' : String(date.getDate());
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(
    date
  );
  const year =
    date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`;
  return `avec toi depuis le ${day} ${month}${year}`;
};

/**
 * La semaine et le total : « 1 séance sur 3 cette semaine · 6 séances au
 * total ».
 *
 * La semaine vient de la ligne de la liste, le total de l'historique, qui
 * arrive par sa propre requête : tant qu'il n'est pas là (`total` absent),
 * la phrase s'arrête à la semaine plutôt que d'afficher « 0 séance ».
 * Un historique qui remplit sa page n'est pas complet : « au moins 50 ».
 */
export const weekSummary = (
  client: Client,
  history?: { total: number; complete: boolean }
): string => {
  const done = client.weekDone;
  const sessions = (n: number) => `${n} séance${n > 1 ? 's' : ''}`;
  const week =
    client.weekTarget > 0
      ? `${sessions(done)} sur ${client.weekTarget} cette semaine`
      : done > 0
        ? `${sessions(done)} cette semaine`
        : 'aucune séance cette semaine';
  if (!history) return week;
  const total =
    history.total === 0
      ? 'aucune encore'
      : history.complete
        ? `${sessions(history.total)} au total`
        : `au moins ${history.total} séances`;
  return `${week} · ${total}`;
};

/**
 * La phrase du panneau, sous les points : la tendance de la ligne quand il
 * y en a une — « Devient trop dure », « Trop facile » —, sinon la série en
 * cours, dite comme dans le journal (« Les trois dernières : justes »).
 *
 * Tirée des ressentis de la ligne, comme les points posés à côté : la tirer
 * de l'historique, qui arrive par une autre requête, laissait le panneau
 * dire « dures » sous cinq points verts.
 */
export const previewHeadline = (
  client: Client
): { text: string; tone: EffortZone | null } => {
  const trend = effortTrend(client.recentEfforts);
  if (trend === 'hard') return { text: 'Devient trop dure', tone: 'hard' };
  if (trend === 'easy') return { text: 'Trop facile', tone: 'easy' };
  return streakOfZones(
    client.recentEfforts
      .map((effort) => getEffortLevel(effort)?.zone)
      .filter((zone): zone is EffortZone => zone !== undefined)
  );
};
