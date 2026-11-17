import type {
  ChipperDoneEntry,
  CompletedSession,
  LadderDoneEntry,
  PerformedEntry,
  PerformedValues,
  RoundsDoneEntry,
  Session,
} from '@/shared/types';
import { truncateAtFirstEmpty } from '@/domain/history/performedFormat';
import {
  daysDone,
  doneInWeek,
  plannedDays,
  weekStreak,
  weekTarget,
} from '@/domain/week/ring';

/**
 * Ce que la fin d'une séance envoie, et ce qu'elle en montre ensuite.
 *
 * Ces conversions vivaient en tête de l'écran de la séance, à côté de ses
 * cinq cents lignes de mise en page, et ne se vérifiaient qu'en menant une
 * séance jusqu'au bout dans un navigateur.
 */

/**
 * Les charges notées, telles que l'API les attend.
 *
 * La clé est « rang du bloc : rang de l'exercice », exactement l'adressage
 * de l'API. Un exercice dont aucune série n'est renseignée n'est pas envoyé
 * du tout : ne rien avoir à dire n'est pas une valeur. Une série vide arrête
 * l'exercice là, comme le serveur le comprend.
 */
export const toPerformedEntries = (
  performed: Record<string, PerformedValues>
): PerformedEntry[] =>
  Object.entries(performed)
    .map(([key, value]) => {
      const [blockOrder, exerciseOrder] = key.split(':').map(Number);
      return {
        blockOrder,
        exerciseOrder,
        sets: truncateAtFirstEmpty(value.sets ?? []),
      };
    })
    .filter((entry) => entry.sets.length > 0);

/**
 * Les tours bouclés, tels que l'API les attend.
 *
 * Zéro part avec le reste : un client qui n'a bouclé aucun tour l'a vécu, et
 * ne rien envoyer reviendrait à dire qu'il n'a pas fait le bloc.
 */
export const toRoundsDone = (
  rounds?: Record<string, number>
): RoundsDoneEntry[] =>
  Object.entries(rounds ?? {}).map(([blockOrder, count]) => ({
    blockOrder: Number(blockOrder),
    rounds: count,
  }));

/** Ce que les échelles bornées ont donné, tel que l'API l'attend. */
export const toLadderDone = (
  ladder?: Record<string, { rungs: number; seconds: number }>
): LadderDoneEntry[] =>
  Object.entries(ladder ?? {}).map(([blockOrder, result]) => ({
    blockOrder: Number(blockOrder),
    ...result,
  }));

/** Ce que les chipper et TimeCap bornés ont donné, tel que l'API
 * l'attend. */
export const toChipperDone = (
  chipper?: Record<string, { movements: number; seconds: number }>
): ChipperDoneEntry[] =>
  Object.entries(chipper ?? {}).map(([blockOrder, result]) => ({
    blockOrder: Number(blockOrder),
    ...result,
  }));

/** La semaine que montre le dernier écran de la fin. */
export interface WeekSummary {
  /** Les jours conseillés : ce que la semaine vise. */
  target: number;
  /** Les séances de la semaine avant celle-ci… */
  before: number;
  /** … et avec elle. */
  after: number;
  streak: number;
  doneDays: Set<number>;
  plannedDays: Set<number>;
}

/**
 * La semaine, avant et après la séance qu'on vient d'envoyer.
 *
 * Calculée sur l'historique tel qu'il était à l'envoi, plus cette séance à
 * sa date — celle du jour, ou celle de « Ce n'était pas aujourd'hui ».
 * Relire l'historique une fois rechargé l'aurait comptée deux fois, ou pas
 * du tout selon le moment où il revient.
 *
 * Midi et non minuit pour une date choisie : une date sans heure, lue en
 * UTC, tombe la veille à Paris.
 */
export const weekAfter = (
  history: readonly Pick<CompletedSession, 'completedAt'>[],
  sessions: readonly Session[],
  completedAt?: string,
  now: Date = new Date()
): WeekSummary => {
  const when = completedAt ? new Date(`${completedAt}T12:00:00`) : now;
  const withThis = [...history, { completedAt: when.toISOString() }];
  const target = weekTarget(sessions);
  return {
    target,
    before: doneInWeek(history, now),
    after: doneInWeek(withThis, now),
    streak: weekStreak(withThis, target, now),
    doneDays: daysDone(withThis, now),
    plannedDays: plannedDays(sessions),
  };
};
