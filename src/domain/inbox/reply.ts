import type { CoachReplyPayload } from '@/shared/types/contract';
import { dayKey } from '@/domain/week/dates';

/**
 * La réponse du coach vue de son côté : laquelle est la sienne, laquelle il
 * peut encore modifier, et ce qu'il en dit une fois partie.
 *
 * Les règles sont celles de l'API (D2), relues ici parce que l'écran doit
 * les montrer avant de les envoyer : une réaction allumée, une réponse que
 * le client a déjà lue et qui ne bouge plus.
 */

export type Reply = CoachReplyPayload;
export type Reaction = NonNullable<Reply['reaction']>;

/**
 * La dernière réponse de ce coach, s'il en a écrit une.
 *
 * Par identifiant de coach et non par prénom : un client suivi à deux peut
 * avoir deux Julie. Sans identifiant — un compte qui n'est pas coach —,
 * aucune réponse ne lui est égale, et rien n'est à lui.
 */
export const myLastReply = (
  replies: readonly Reply[],
  coachId: string | undefined
): Reply | undefined => {
  for (let i = replies.length - 1; i >= 0; i--)
    if (replies[i].coachId === coachId) return replies[i];
  return undefined;
};

/**
 * La réaction que le coach peut encore retirer.
 *
 * Celle de sa dernière réponse, tant que le client ne l'a pas lue. Lue,
 * elle ne bouge plus : la touche suivante en crée une nouvelle, et rien ne
 * doit paraître allumé.
 */
export const activeReaction = (
  replies: readonly Reply[],
  coachId: string | undefined
): Reaction | undefined => {
  const mine = myLastReply(replies, coachId);
  return mine && !mine.readAt ? mine.reaction : undefined;
};

/** Toucher la réaction allumée l'éteint ; toucher une autre la remplace. */
export const toggledReaction = (
  current: Reaction | undefined,
  tapped: Reaction
): Reaction | null => (current === tapped ? null : tapped);

/** Quand une réponse est partie, au jour près : on ne date pas une
 * réponse à l'heure. */
const sentWhen = (iso: string, now: Date): string => {
  const sent = new Date(iso);
  const day = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(sent)) / 86_400_000);
  if (dayKey(sent) === dayKey(now)) return 'aujourd’hui';
  if (days === 1) return 'hier';
  if (days > 1 && days < 7) return `il y a ${days} jours`;
  return `le ${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(sent)}`;
};

/**
 * Ce que le coach lit sous sa réponse : « Envoyée hier · lue par Sarah ».
 *
 * « pas encore lue » tant que le client ne l'a pas ouverte : c'est ce qui
 * dit au coach qu'il peut encore la modifier.
 */
export const sentLabel = (
  reply: Reply,
  clientFirstName: string | undefined,
  now: Date = new Date()
): string => {
  const read = reply.readAt
    ? clientFirstName?.trim()
      ? `lue par ${clientFirstName.trim()}`
      : 'lue'
    : 'pas encore lue';
  return `Envoyée ${sentWhen(reply.sentAt, now)} · ${read}`;
};
