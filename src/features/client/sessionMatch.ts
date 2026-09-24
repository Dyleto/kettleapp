import {
  BlockSnapshot,
  CompletedSession,
  Session,
  SessionBlock,
} from '@/types';

/**
 * Has this session already been done — this session, not its identifier?
 *
 * The programme screen used to answer with `originalSessionId`, and that id
 * survives an edit. From the field: "I changed my programme by editing the
 * sessions rather than deleting and recreating them, so they kept the same
 * id, and it marks a session as done that I have never done."
 *
 * An id says where a session sits in the programme. It says nothing about
 * what is in it. A coach who rewrites session 2 from top to bottom leaves
 * the id untouched, and the client is told they have already done something
 * that did not exist last week.
 *
 * So we compare the content. Every wrap-up carries `blocks` — a snapshot of
 * the session as it stood that day — which is exactly what is needed, and it
 * is already in hand: nothing to ask the API for.
 */
export type SessionMatch =
  /** Same content as a recorded wrap-up. `on` is the most recent one. */
  | { state: 'done'; on: Date }
  /** Done under another form: the id matches, the content no longer does. */
  | { state: 'changed' }
  /** No wrap-up carries this id at all. */
  | { state: 'never' };

/**
 * What describes the work to do, and nothing else.
 *
 * Two sessions are the same session when what there is to do is the same.
 * Which leaves out, deliberately:
 *
 *   — names and labels, on the session and on the blocks: renaming "Full
 *     body A" to "Full body" changes nothing you do;
 *   — the coach's instructions, for the same reason — they describe how, not
 *     what;
 *   — everything performed (loads, completed rounds): that is the answer,
 *     not the question.
 *
 * A change of load, of repetitions or of rounds does break the match, and
 * that is the point: the coach made it a different session on purpose.
 */
const doseOf = (block: SessionBlock | BlockSnapshot): string => {
  const exercises = [...block.exercises]
    .sort((a, b) => a.order - b.order)
    .map((ex) => {
      // A snapshot's exercise is an untyped record — it went through the
      // API and came back. Only its identity is read here.
      const id =
        typeof ex.exercise === 'object' && ex.exercise !== null
          ? String((ex.exercise as { _id?: unknown })._id ?? '')
          : String(ex.exercise ?? '');
      return [
        id,
        ex.order,
        ex.sets ?? '',
        ex.restBetweenSets ?? '',
        ex.reps ?? '',
        ex.duration ?? '',
        ex.customMetric
          ? `${ex.customMetric.value}${ex.customMetric.unit}`
          : '',
      ].join(':');
    })
    .join('|');

  return [
    block.type,
    block.order,
    block.durationMinutes ?? '',
    block.intervalMinutes ?? '',
    block.rounds ?? '',
    block.restBetweenRounds ?? '',
    block.workDuration ?? '',
    block.restDuration ?? '',
    (block.repsScheme ?? []).join(','),
    exercises,
  ].join(';');
};

/** The whole session's dose, block order included. */
export const sessionDose = (blocks: (SessionBlock | BlockSnapshot)[]): string =>
  [...blocks]
    .sort((a, b) => a.order - b.order)
    .map(doseOf)
    .join('\n');

/**
 * When this session was last done in the form it has today.
 *
 * Three answers, and the middle one is why there are three. Saying "jamais
 * faite" about a session the client did last week — under another form —
 * would be true to the letter and wrong to the ear. `changed` says what
 * actually happened: you did it, it is no longer the same.
 */
export const matchSession = (
  session: Session,
  history: CompletedSession[]
): SessionMatch => {
  const onThisId = history.filter((h) => h.originalSessionId === session._id);
  if (onThisId.length === 0) return { state: 'never' };

  const dose = sessionDose(session.blocks);
  const sameDose = onThisId.filter((h) => sessionDose(h.blocks ?? []) === dose);
  if (sameDose.length === 0) return { state: 'changed' };

  const latest = sameDose.reduce((best, h) =>
    new Date(h.completedAt) > new Date(best.completedAt) ? h : best
  );
  return { state: 'done', on: new Date(latest.completedAt) };
};

/** « Faite le 12 sept. », « Modifiée depuis », « Jamais faite ». */
export const matchLabel = (match: SessionMatch): string => {
  if (match.state === 'never') return 'Jamais faite';
  if (match.state === 'changed') return 'Modifiée depuis';
  return `Faite le ${new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(match.on)}`;
};
