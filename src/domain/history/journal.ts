import type { CompletedSession, FeedbackTag } from '@/shared/types';
import { dayKey, formatDayLabel } from '@/domain/week/dates';
import { sessionName } from '@/domain/session/name';
import { doneInWeek } from '@/domain/week/ring';
import { getEffortLevel, type EffortZone } from './effort';
import { TAG_NOUN, countWord, type TagCount } from './pulse';

/**
 * Les ressentis d'un client, tout l'historique d'un coup d'œil : ce que la
 * carte du résumé dit, et ce que la liste et le calendrier en gardent.
 *
 * L'ancien journal n'avait pas de résumé : une liste, un calendrier qui la
 * filtrait, et pour comprendre une tendance il fallait lire chaque ligne.
 * La maquette pose une carte au-dessus — cinq points, une phrase, le
 * rythme, les étiquettes —, et ce qui s'y décide se teste ici, sans écran.
 */

/** Combien de points la carte montre : les cinq dernières séances. */
const WINDOW = 5;

const byDate = (history: readonly CompletedSession[]) =>
  [...history].sort(
    (a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)
  );

/**
 * Les cinq dernières séances, de la plus ancienne à la plus récente : leur
 * zone d'effort, ou rien pour un ancien bilan qui n'en portait pas.
 *
 * Les séances et non les ressentis : un ancien bilan reste un passage, et
 * le sauter ferait remonter dans les points une séance d'il y a deux mois
 * comme si elle était d'hier. Complété par des points vides devant, comme
 * le pouls d'une séance.
 */
export const recentZones = (
  history: readonly CompletedSession[]
): (EffortZone | null)[] => {
  const zones = byDate(history)
    .slice(-WINDOW)
    .map((c) => getEffortLevel(c.feedback?.effort)?.zone ?? null);
  return [...Array<null>(WINDOW - zones.length).fill(null), ...zones];
};

/** « dures », « justes », « faciles » : l'adjectif d'une zone, accordé à
 * « séances » — le seul accord que l'on connaisse ici. */
const ZONE_WORD: Record<EffortZone, [string, string]> = {
  easy: ['facile', 'faciles'],
  target: ['juste', 'justes'],
  hard: ['dure', 'dures'],
};

/**
 * La phrase de la carte : depuis combien de séances le ressenti tombe du
 * même côté.
 *
 * « Les deux dernières : dures », et non la dérive du pouls d'une séance :
 * ici les séances diffèrent, et dire qu'« elle devient trop dure » n'aurait
 * pas de sujet. Une série qui se prolonge, en revanche, se lit d'une phrase
 * — c'est ce qu'un coach vient chercher avant un rendez-vous.
 *
 * Les seuls ressentis comptent : un ancien bilan n'a pas de côté, il
 * n'interrompt ni ne prolonge rien.
 */
export const streakHeadline = (
  history: readonly CompletedSession[]
): { text: string; tone: EffortZone | null } =>
  streakOfZones(
    byDate(history)
      .map((c) => getEffortLevel(c.feedback?.effort)?.zone)
      .filter((zone): zone is EffortZone => zone !== undefined)
  );

/**
 * La même phrase, sur une suite de zones déjà rangée du plus ancien au plus
 * récent : le panneau d'un client la tire des ressentis de sa ligne
 * (`recentEfforts`), pour ne pas dire autre chose que les points posés à
 * côté.
 */
export const streakOfZones = (
  zones: readonly EffortZone[]
): { text: string; tone: EffortZone | null } => {
  const last = zones[zones.length - 1];
  if (!last) return { text: 'Aucun ressenti donné', tone: null };
  let streak = 0;
  for (let i = zones.length - 1; i >= 0 && zones[i] === last; i--) streak += 1;
  const [one, many] = ZONE_WORD[last];
  return streak === 1
    ? { text: `La dernière : ${one}`, tone: last }
    : { text: `Les ${countWord(streak)} dernières : ${many}`, tone: last };
};

/** « le 12 août » ; l'année quand ce n'est pas celle de `now`. */
const onDay = (iso: string, now: Date) => {
  const date = new Date(iso);
  return `le ${new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date)}`;
};

/** Combien de semaines le rythme regarde. */
const RHYTHM_WEEKS = 4;

/**
 * Le rythme, en trois morceaux : depuis quand, combien par semaine, et
 * cette semaine.
 *
 * « 2 par semaine » sur les quatre dernières semaines, au demi près : une
 * moyenne sur tout l'historique effacerait la reprise d'un client revenu
 * après l'été. Sous quatre séances, une moyenne dirait « 0,5 par semaine »
 * de quelqu'un qui en a fait une : on donne le compte.
 *
 * `complete` est faux quand l'historique reçu s'arrête à une page : la
 * première séance n'est alors pas la première, et « depuis le » mentirait.
 */
export const rhythmLine = (
  history: readonly CompletedSession[],
  {
    target,
    now = new Date(),
    complete = true,
  }: { target: number; now?: Date; complete?: boolean }
): string => {
  const sorted = byDate(history);
  const first = sorted[0];
  if (!first) return '';
  const lead = !complete
    ? `Les ${sorted.length} dernières depuis ${onDay(first.completedAt, now)}`
    : sorted.length === 1
      ? `1 séance, ${onDay(first.completedAt, now)}`
      : `${sorted.length} séances depuis ${onDay(first.completedAt, now)}`;

  const since = now.getTime() - RHYTHM_WEEKS * 7 * 86_400_000;
  const recent = sorted.filter((c) => {
    const at = Date.parse(c.completedAt);
    return at > since && at <= now.getTime();
  }).length;
  const rate = Math.round((recent / RHYTHM_WEEKS) * 2) / 2;
  const pace =
    recent === 0
      ? 'aucune ces quatre dernières semaines'
      : recent < RHYTHM_WEEKS
        ? `${recent} en quatre semaines`
        : `${String(rate).replace('.', ',')} par semaine`;

  const done = doneInWeek(sorted, now);
  const week =
    target > 0
      ? `${done} sur ${target} cette semaine`
      : done > 0
        ? `${done} cette semaine`
        : null;

  return [lead, pace, week].filter(Boolean).join(' · ');
};

/** L'ordre des étiquettes à compte égal : celui du choix du client. */
const TAG_ORDER = Object.keys(TAG_NOUN) as FeedbackTag[];

/**
 * Les étiquettes de santé sur tout l'historique reçu, chacune avec son
 * compte.
 *
 * Tout l'historique, et non les cinq derniers points : une étiquette du
 * résumé filtre la liste, et la liste filtrée doit compter autant de lignes
 * que la pastille l'annonce. La douleur d'abord — c'est elle qui demande
 * d'agir —, puis le compte.
 */
export const tagCounts = (history: readonly CompletedSession[]): TagCount[] => {
  const counts = new Map<FeedbackTag, number>();
  for (const completed of history)
    for (const tag of new Set(completed.feedback?.tags ?? []))
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort(
      (a, b) =>
        Number(b.tag === 'pain') - Number(a.tag === 'pain') ||
        b.count - a.count ||
        TAG_ORDER.indexOf(a.tag) - TAG_ORDER.indexOf(b.tag)
    );
};

/** « Fatigue × 2 », « Douleur × 1 » : un décompte, que l'on écrit même à
 * un — la pastille filtre, et dit combien de lignes elle laissera. */
export const tagCountLabel = ({ tag, count }: TagCount): string =>
  `${TAG_NOUN[tag]} × ${count}`;

/** Les séances qui portent une étiquette ; toutes, sans étiquette. */
export const withTag = (
  history: readonly CompletedSession[],
  tag: FeedbackTag | null
): CompletedSession[] =>
  tag ? history.filter((c) => c.feedback?.tags?.includes(tag)) : [...history];

/**
 * La date d'une ligne : « dim. 30 août », et l'année quand ce n'est pas
 * celle de `now`.
 *
 * Absolue, pas « il y a trois jours » : un journal se relit avant un
 * rendez-vous, et une date relative oblige à recompter.
 */
export const rowDate = (iso: string, now: Date = new Date()): string => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
};

/**
 * Les séances du calendrier, par jour : la plus récente de chaque jour.
 *
 * Une pastille ouvre une séance, et il n'en faut qu'une par case. Deux
 * séances le même jour sont rares ; la plus récente est celle qu'on vient
 * lire, et l'autre reste dans la liste.
 */
export const latestByDay = (
  history: readonly CompletedSession[]
): Map<string, CompletedSession> => {
  const days = new Map<string, CompletedSession>();
  for (const completed of byDate(history))
    days.set(dayKey(new Date(completed.completedAt)), completed);
  return days;
};

/**
 * Les séances de chaque jour, la plus récente d'abord.
 *
 * Progrès ouvre un jour à deux séances sur la liste des deux, au lieu
 * d'en choisir une : la maquette le veut, et la seconde ne se perd pas.
 */
export const sessionsByDay = (
  history: readonly CompletedSession[]
): Map<string, CompletedSession[]> => {
  const days = new Map<string, CompletedSession[]>();
  for (const completed of [...byDate(history)].reverse()) {
    const day = dayKey(new Date(completed.completedAt));
    days.set(day, [...(days.get(day) ?? []), completed]);
  }
  return days;
};

/**
 * Ce que la pastille d'un jour porte : la zone de la séance la plus
 * récente, et ce qu'un lecteur d'écran en entend — « dimanche 30 août :
 * Full body A, Trop dure », ou « mercredi 26 août : 2 séances ».
 *
 * Écrit ici et non dans un écran : le journal du coach et Progrès en ont
 * chacun un calendrier, et deux écritures auraient fini par ne plus dire
 * la même chose du même jour.
 */
export const calendarMarks = (
  history: readonly CompletedSession[]
): Map<string, { zone: EffortZone | null; label: string }> =>
  new Map(
    [...sessionsByDay(history)].map(([day, sessions]) => {
      const [latest] = sessions;
      const level = getEffortLevel(latest.feedback?.effort);
      const what =
        sessions.length > 1
          ? `${sessions.length} séances`
          : `${
              latest.sessionName ||
              sessionName({
                order: latest.sessionOrder,
                name: latest.sessionName,
              })
            }${level ? `, ${level.label}` : ''}`;
      return [
        day,
        {
          zone: level?.zone ?? null,
          label: `${formatDayLabel(day)} : ${what}`,
        },
      ];
    })
  );

/** Le premier jour d'un mois. */
const monthOf = (date: Date) => new Date(date.getFullYear(), date.getMonth());

/**
 * Les mois que le calendrier parcourt : de la première séance au mois en
 * cours, et celui qu'il montre d'abord — celui de la dernière séance.
 *
 * Pas le mois en cours : un client revenu de vacances aurait ouvert sur un
 * mois vide, et le coach serait reparti en arrière d'une flèche à chaque
 * fois.
 */
export const calendarBounds = (
  history: readonly CompletedSession[],
  now: Date = new Date()
): { first: Date; last: Date; start: Date } => {
  const sorted = byDate(history);
  const current = monthOf(now);
  if (sorted.length === 0)
    return { first: current, last: current, start: current };
  const oldest = monthOf(new Date(sorted[0].completedAt));
  const newest = monthOf(new Date(sorted[sorted.length - 1].completedAt));
  return {
    first: oldest,
    last: newest > current ? newest : current,
    start: newest,
  };
};
