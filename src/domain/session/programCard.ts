import type { CompletedSession, Session } from '@/shared/types';
import { matchSession } from '@/domain/history/sessionMatch';
import { dayKey, mondayIndex, WEEKDAY_FULL } from '@/domain/week/dates';
import { distinctExerciseCount, estimatedMinutes } from './measure';

/**
 * Ce qu'une carte du programme dit d'une séance sans l'ouvrir : combien de
 * temps, quelle ampleur, et où le client en est avec elle.
 *
 * L'ancien écran disait « 3 blocs · 12 exercices », puis les formats, puis
 * « Faite le 12 sept. » en petit : ni durée, ni état de ce qu'il fallait
 * faire aujourd'hui. La maquette y met la durée estimée, un compte de
 * mouvements, et une pastille — « À faire aujourd'hui », « Faite
 * dimanche », « Modifiée depuis ta dernière fois », « Jamais faite », « En
 * cours ».
 */

const plural = (count: number, word: string) =>
  `${count} ${word}${count > 1 ? 's' : ''}`;

/**
 * « ≈ 45 min · 3 blocs · 7 exercices ».
 *
 * Les exercices se comptent par mouvement distinct : un swing repris dans
 * deux blocs est un exercice à savoir faire, pas deux. L'ancien compte
 * additionnait les lignes, et annonçait douze exercices là où il y en avait
 * sept. `null` pour une séance sans bloc : elle ne dure rien, et « ≈ 5 min
 * · 0 bloc » le dirait mal.
 */
export const programLine = (session: Session): string | null => {
  if (session.blocks.length === 0) return null;
  return [
    `≈ ${estimatedMinutes(session)} min`,
    plural(session.blocks.length, 'bloc'),
    plural(distinctExerciseCount(session), 'exercice'),
  ].join(' · ');
};

/** Ce que la pastille d'une carte dit, et de quelle couleur. */
export type CardTone = 'local' | 'today' | 'done' | 'changed' | 'never';

/**
 * Une séance laissée sur ce téléphone, avant que le serveur ne l'ait reçue
 * — les trois états de l'accueil (`unfinishedSession`), avec ses mots :
 * commencée, finie sans ressenti, ou ressenti en attente de réseau.
 */
export type LocalState = 'running' | 'finished' | 'pending';

const LOCAL_LABEL: Record<LocalState, string> = {
  running: 'En cours',
  finished: 'À valider',
  pending: 'En attente de réseau',
};

export interface CardState {
  tone: CardTone;
  label: string;
}

/** Les jours entre deux dates, au calendrier et non à l'heure : une séance
 * faite hier à 23 h est d'hier, même le lendemain à 8 h. */
const daysBetween = (from: Date, to: Date) =>
  Math.round(
    (new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime() -
      new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()) /
      86_400_000
  );

/**
 * « Faite dimanche » : le jour quand c'est cette semaine-ci ou presque —
 * moins de sept jours —, la date au-delà, où « faite mardi » ne dirait plus
 * lequel.
 */
const doneLabel = (on: Date, now: Date): string => {
  const days = daysBetween(on, now);
  if (days <= 0) return 'Faite aujourd’hui';
  if (days === 1) return 'Faite hier';
  if (days < 7) return `Faite ${WEEKDAY_FULL[mondayIndex(on)]}`;
  return `Faite le ${new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(on)}`;
};

/**
 * L'état d'une séance, dans l'ordre où il compte.
 *
 *   « En cours »                 — commencée sur ce téléphone, pas finie ;
 *                                  « À valider » ou « En attente de
 *                                  réseau » quand elle l'est, comme sur
 *                                  l'accueil ;
 *   « Faite aujourd'hui »        — passe devant le conseil du jour, qui est
 *                                  tenu ;
 *   « À faire aujourd'hui »      — conseillée ce jour-ci ;
 *   « Faite dimanche »           — la dernière fois, telle qu'elle est ;
 *   « Modifiée depuis ta dernière fois » — faite, mais le coach l'a
 *                                  réécrite depuis ;
 *   « Jamais faite ».
 *
 * « Faite » ne vaut que pour le contenu d'aujourd'hui (`matchSession`) :
 * l'identifiant d'une séance survit à une réécriture, et l'ancien écran
 * annonçait faite une séance que le client n'avait jamais vue. Une séance
 * remaniée le dit, au lieu de se taire ou de mentir.
 */
export const sessionState = (
  session: Session,
  history: CompletedSession[],
  { now = new Date(), local }: { now?: Date; local?: LocalState } = {}
): CardState => {
  if (local) return { tone: 'local', label: LOCAL_LABEL[local] };
  const match = matchSession(session, history);
  const doneToday = match.state === 'done' && dayKey(match.on) === dayKey(now);
  if (doneToday) return { tone: 'done', label: doneLabel(match.on, now) };
  if (session.suggestedDays?.includes(mondayIndex(now)))
    return { tone: 'today', label: 'À faire aujourd’hui' };
  if (match.state === 'done')
    return { tone: 'done', label: doneLabel(match.on, now) };
  if (match.state === 'changed')
    return { tone: 'changed', label: 'Modifiée depuis ta dernière fois' };
  return { tone: 'never', label: 'Jamais faite' };
};
