import type { CompletedSession, FeedbackTag } from '@/shared/types';
import { noteWords } from '@/domain/inbox/concerned';
import { pulseOf } from '@/domain/session/rail';
import { getEffortLevel, type EffortLevel, type EffortZone } from './effort';

/**
 * Le pouls d'une séance : ce que le client en a dit, passage après passage,
 * lu en tête de la séance dans l'atelier.
 *
 * Il vivait dans un bandeau au-dessus de la séance et dans une colonne à
 * droite — un axe, un compte, une flèche —, et le composant décidait lui-même
 * ce qui était une dérive. La maquette en fait une carte sous l'en-tête :
 * cinq points, une phrase, les étiquettes. Ce qui s'y décide se teste ici,
 * sans écran.
 */

/** Le sens d'une dérive : la séance devient trop dure, ou trop facile. */
export type Drift = 'harder' | 'easier';

/** Combien de passages le pouls lit : ceux des cinq points. */
const WINDOW = 5;

/**
 * Une dérive n'est signalée que lorsqu'elle est nette : au moins trois
 * ressentis, aucun changement de sens, et deux crans d'amplitude. Le reste
 * est du bruit — et un coach qui voit une alerte pour du bruit cesse de les
 * lire, et elle ne vaut plus rien le jour où elle compte.
 */
export const effortDrift = (efforts: readonly number[]): Drift | null => {
  if (efforts.length < 3) return null;
  const first = efforts[0];
  const last = efforts[efforts.length - 1];
  if (
    last - first >= 2 &&
    efforts.every((v, i) => i === 0 || v >= efforts[i - 1])
  )
    return 'harder';
  if (
    first - last >= 2 &&
    efforts.every((v, i) => i === 0 || v <= efforts[i - 1])
  )
    return 'easier';
  return null;
};

/**
 * L'étiquette en nom, pour le coach : « Fatigue × 2 ».
 *
 * Le client choisit « Fatigué », un adjectif accordé au masculin — c'est
 * lui qui parle de lui. Le coach, lui, lit un compte sur cinq passages, et
 * ne sait pas comment accorder : la maquette écrit des noms.
 */
export const TAG_NOUN: Record<FeedbackTag, string> = {
  poor_sleep: 'Mal dormi',
  pain: 'Douleur',
  stress: 'Stress',
  fatigue: 'Fatigue',
  illness: 'Maladie',
  great_shape: 'En forme',
};

/**
 * Les endroits où l'on a mal, tels qu'un client les écrit — au singulier
 * grossier de `noteWords`, sans accent. Une liste et non une analyse : elle
 * ne nomme que ce qu'elle connaît, et se tait sur le reste plutôt que de
 * deviner.
 */
const SITES: Record<string, string> = {
  epaule: 'épaule',
  genou: 'genou',
  do: 'dos',
  lombaire: 'lombaires',
  poignet: 'poignet',
  cheville: 'cheville',
  hanche: 'hanche',
  coude: 'coude',
  nuque: 'nuque',
  mollet: 'mollet',
  ischio: 'ischios',
};

/** L'endroit qu'une note désigne, ou rien. */
export const painSite = (note: string | undefined): string | undefined =>
  noteWords(note ?? '')
    .map((word) => SITES[word])
    .find(Boolean);

/** Une étiquette et le nombre de passages qui la portent. */
export interface TagCount {
  tag: FeedbackTag;
  count: number;
  /** Pour une douleur : où, quand le client l'a écrit. */
  site?: string;
}

export interface SessionPulse {
  /** Tous les passages de la séance, et non les seuls cinq derniers. */
  passages: number;
  zones: (EffortZone | null)[];
  drift: Drift | null;
  /** Depuis combien de passages, au bout, le ressenti est du côté de la
   * dérive : « depuis deux passages ». */
  streak: number;
  /** Le dernier ressenti donné. */
  last?: EffortLevel;
  /** Le dernier mot du client sur cette séance, et quand. */
  lastWord?: { at: string; note: string };
  tags: TagCount[];
  /** Les passages que le coach n'a pas encore lus. */
  unread: number;
}

/**
 * Le pouls d'une séance, lu dans l'historique du client.
 *
 * La dérive et les étiquettes portent sur les cinq derniers passages, ceux
 * que montrent les points : une alerte doit se voir dans ce qu'on a sous
 * les yeux. Le dernier mot, lui, peut être plus ancien — c'est le dernier
 * que le client a écrit, et un passage sans mot n'efface pas celui d'avant.
 */
export const sessionPulse = (
  history: readonly CompletedSession[],
  sessionId: string
): SessionPulse => {
  const passages = history
    .filter((c) => c.originalSessionId === sessionId)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
  const recent = passages.slice(-WINDOW);
  const efforts = recent
    .map((c) => c.feedback?.effort)
    .filter((e): e is number => getEffortLevel(e) !== undefined);
  const drift = effortDrift(efforts);

  const inDrift = (effort: number) =>
    drift === 'harder' ? effort >= 4 : effort <= 2;
  let streak = 0;
  if (drift)
    for (let i = efforts.length - 1; i >= 0 && inDrift(efforts[i]); i--)
      streak += 1;

  const counts = new Map<FeedbackTag, TagCount>();
  for (const passage of recent)
    for (const tag of passage.feedback?.tags ?? []) {
      const seen = counts.get(tag) ?? { tag, count: 0 };
      seen.count += 1;
      // Le plus récent l'emporte : on parcourt dans l'ordre du temps.
      if (tag === 'pain')
        seen.site = painSite(passage.clientNotes) ?? seen.site;
      counts.set(tag, seen);
    }

  const worded = [...passages].reverse().find((c) => c.clientNotes?.trim());

  return {
    passages: passages.length,
    zones: pulseOf(history, sessionId),
    drift,
    streak,
    last: getEffortLevel(efforts[efforts.length - 1]),
    lastWord: worded
      ? { at: worded.completedAt, note: worded.clientNotes!.trim() }
      : undefined,
    // La douleur d'abord : c'est elle qui demande d'agir. Puis le compte.
    tags: [...counts.values()].sort(
      (a, b) =>
        Number(b.tag === 'pain') - Number(a.tag === 'pain') || b.count - a.count
    ),
    unread: passages.filter((c) => !c.viewedByCoach).length,
  };
};

const COUNT_WORDS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq'];

/**
 * La phrase du pouls, en deux temps : ce qui se passe, et depuis quand.
 *
 * « Devient trop dure » / « depuis deux passages » ; sans dérive, le dernier
 * ressenti — « Juste en dernier ». Le « depuis » ne s'écrit qu'à partir de
 * deux : « depuis un passage » ne dit rien que « Devient » ne dise déjà.
 */
export const pulseHeadline = (
  pulse: SessionPulse
): { text: string; tone: EffortZone | null; since?: string } => {
  const since =
    pulse.streak >= 2
      ? `depuis ${COUNT_WORDS[pulse.streak] ?? pulse.streak} passages`
      : undefined;
  if (pulse.drift === 'harder')
    return { text: 'Devient trop dure', tone: 'hard', since };
  if (pulse.drift === 'easier')
    return { text: 'Devient trop facile', tone: 'easy', since };
  if (pulse.last)
    return { text: `${pulse.last.label} en dernier`, tone: pulse.last.zone };
  return { text: 'Aucun ressenti donné', tone: null };
};

/** « Douleur · épaule », « Fatigue × 2 ». */
export const tagLabel = ({ tag, count, site }: TagCount): string =>
  `${TAG_NOUN[tag]}${site ? ` · ${site}` : ''}${count > 1 ? ` × ${count}` : ''}`;
