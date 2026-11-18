import type { CompletedSession, Session } from '@/shared/types';
import { getEffortLevel, type EffortZone } from '@/domain/history/effort';
import { WEEKDAY_SHORT } from '@/domain/week/dates';
import { estimatedMinutes } from '@/domain/session/measure';

/**
 * Ce que le rail et l'en-tête disent d'une séance sans l'ouvrir : sa durée,
 * ses jours, et comment le client l'a vécue.
 *
 * Le rail disait « 2 blocs » et « faite 4 fois » : un compte, pas une
 * lecture. La maquette y met la durée qu'elle demande, les jours où elle se
 * fait, et les cinq derniers ressentis — ce qui dit, d'un coup d'œil sur
 * tout le programme, quelle séance devient trop dure.
 */

/** Combien de ressentis le pouls montre. */
export const PULSE_LENGTH = 5;

/** « ≈ 45 min » ; « vide » pour une séance sans bloc, qui ne dure rien. */
export const durationLabel = (session: Session): string =>
  session.blocks.length === 0 ? 'vide' : `≈ ${estimatedMinutes(session)} min`;

/** « lun, jeu » : les jours conseillés, dans l'ordre de la semaine. */
export const daysLine = (days: readonly number[] = []): string =>
  [...days]
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_SHORT[d].toLowerCase())
    .join(', ');

/** « Lun · Jeu » : les mêmes, dans la pastille de l'en-tête. */
export const daysChip = (days: readonly number[] = []): string =>
  days.length === 0
    ? 'Jours conseillés'
    : [...days]
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_SHORT[d])
        .join(' · ');

/**
 * La ligne sous le nom, dans le rail : « ≈ 45 min · lun, jeu », ou
 * « ≈ 25 min · jamais faite ».
 *
 * « jamais faite » ne s'écrit que pour un programme qui a un client : un
 * modèle n'est fait par personne, et l'écrire sous chacune de ses séances
 * serait une notion de client sur un écran qui n'en a pas.
 */
export const railLine = (
  session: Session,
  { tracked, done }: { tracked: boolean; done: boolean }
): string =>
  [
    durationLabel(session),
    daysLine(session.suggestedDays),
    tracked && !done ? 'jamais faite' : '',
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * La ligne d'une carte de la bande, sur téléphone : « ≈ 45 min », ou
 * « ≈ 25 min · jamais faite ».
 *
 * Sans les jours : la carte fait 176 px, et « ≈ 45 min · lun, jeu ·
 * jamais faite » s'y coupait au milieu. Les jours se lisent dans la feuille
 * de la séance. « jamais faite » reste, parce que la maquette ne le dit
 * nulle part ailleurs sur téléphone : sans lui, la bande perdait ce que les
 * pastilles estompées disaient.
 */
export const cardLine = (
  session: Session,
  { tracked, done }: { tracked: boolean; done: boolean }
): string =>
  [durationLabel(session), tracked && !done ? 'jamais faite' : '']
    .filter(Boolean)
    .join(' · ');

/**
 * Les cinq derniers ressentis d'une séance, du plus ancien au plus récent :
 * la zone de chacun, `null` pour un bilan sans ressenti ou une place vide.
 *
 * Les places vides sont en tête : une séance faite une fois montre quatre
 * points vides puis le sien, à droite — là où se lit le plus récent sur
 * toutes les lignes du rail.
 */
export const pulseOf = (
  history: readonly CompletedSession[],
  sessionId: string
): (EffortZone | null)[] => {
  const zones = history
    .filter((c) => c.originalSessionId === sessionId)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))
    .slice(-PULSE_LENGTH)
    .map((c) => getEffortLevel(c.feedback?.effort)?.zone ?? null);
  return [
    ...Array.from({ length: PULSE_LENGTH - zones.length }, () => null),
    ...zones,
  ];
};
