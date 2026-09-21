import { PerformedValues } from '@/types';

/**
 * What an ongoing session keeps of itself between two openings.
 *
 * The app used to carefully remember where you were — the step index went
 * into `sessionStorage` on every move — and forget what you had done: the
 * loads lived in a bare `useState`. One reload, one incoming call killing
 * the tab, and forty minutes of notes were gone. That is the opposite of
 * what deserves keeping: a position can be found again, a load you lifted
 * cannot.
 *
 * So both live together, in `localStorage`, which survives the tab closing
 * where `sessionStorage` dies with it. That is precisely the case we set out
 * to cover.
 */
interface SessionProgress {
  /** So the shape can change without reading stale records. */
  version: 2;
  /** Where we were in guided mode. */
  step: number;
  /** What was recorded, keyed by `performedKey(blockOrder, exerciseOrder)`. */
  performed: Record<string, PerformedValues>;
  /**
   * The sets already done, by key.
   *
   * Distinct from the position: you can go back to a block without undoing
   * what you did there, and a ticked set stays ticked even if you scroll
   * back to read the previous movement's instructions.
   */
  done: string[];
  /**
   * Rounds completed, by block order.
   *
   * An AMRAP is not ticked off, it is counted. The count therefore lives
   * beside the sets, and it is lost just as easily — all the more reason for
   * it to be here.
   */
  rounds: Record<string, number>;
  /**
   * When the session started, in milliseconds.
   *
   * Set on first opening and never redefined: what we want to announce at
   * the end is the duration actually lived, not the one since the last
   * return to the app.
   */
  startedAt?: number;
  /** When, in milliseconds. Used to tell whether this still concerns today. */
  updatedAt: number;
}

const key = (sessionId: string) => `kettle-seance-${sessionId}`;

/**
 * Past this, the record belongs to another attempt.
 *
 * A training session fits in a few hours. Offering to "pick up where you
 * left off" three days later helps nobody, and repopulating the inputs with
 * last week's loads would be worse: they would be submitted unread.
 */
const LIFETIME = 12 * 60 * 60 * 1000;

const empty = (): SessionProgress => ({
  version: 2,
  step: 0,
  performed: {},
  done: [],
  rounds: {},
  updatedAt: Date.now(),
});

/**
 * The shape this record had when its fields were named in French.
 *
 * A client who is mid-session when the new build ships would otherwise lose
 * everything: the record is still there, but none of its fields answer to
 * their new names. It costs a handful of lines to read the old shape, and
 * the alternative is exactly the loss this module exists to prevent.
 */
interface LegacyProgress {
  version: 1;
  etape?: number;
  performed?: Record<string, PerformedValues>;
  faits?: string[];
  tours?: Record<string, number>;
  debutLe?: number;
  majLe: number;
}

/** This session's record, if it is still current. */
export const readProgress = (sessionId: string): SessionProgress | null => {
  try {
    const raw = localStorage.getItem(key(sessionId));
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<SessionProgress> &
      Partial<LegacyProgress>;

    const updatedAt =
      typeof stored.updatedAt === 'number'
        ? stored.updatedAt
        : typeof stored.majLe === 'number'
          ? stored.majLe
          : null;
    if (updatedAt === null) return null;
    if (stored.version !== 1 && stored.version !== 2) return null;

    if (Date.now() - updatedAt > LIFETIME) {
      forgetProgress(sessionId);
      return null;
    }

    const step = stored.version === 1 ? stored.etape : stored.step;
    const done = stored.version === 1 ? stored.faits : stored.done;
    const rounds = stored.version === 1 ? stored.tours : stored.rounds;
    const startedAt = stored.version === 1 ? stored.debutLe : stored.startedAt;

    return {
      version: 2,
      step: Number.isInteger(step) && step! > 0 ? step! : 0,
      performed: stored.performed ?? {},
      done: Array.isArray(done) ? done : [],
      rounds: rounds ?? {},
      startedAt: typeof startedAt === 'number' ? startedAt : undefined,
      updatedAt,
    };
  } catch {
    // Storage refused (private browsing, quota, corrupted data): the session
    // works without it, it simply remembers nothing.
    return null;
  }
};

/** Writes what changes, and keeps the rest. */
export const writeProgress = (
  sessionId: string,
  patch: Partial<Omit<SessionProgress, 'version' | 'updatedAt'>>
) => {
  try {
    const current = readProgress(sessionId) ?? empty();
    const next: SessionProgress = {
      ...current,
      ...patch,
      version: 2,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key(sessionId), JSON.stringify(next));
  } catch {
    // Same: carry on without memory rather than break the session.
  }
};

/**
 * The session went to the server, or the client asked to start over.
 *
 * This is the only moment we erase. Leaving guided mode no longer erases
 * anything: stepping out to answer the phone must not cost the session.
 */
export const forgetProgress = (sessionId: string) => {
  try {
    localStorage.removeItem(key(sessionId));
  } catch {
    // Same.
  }
};

/** How many exercises carry at least one recorded value. */
export const countRecorded = (
  performed: Record<string, PerformedValues>
): number =>
  Object.values(performed).filter((v) =>
    v.sets?.some(
      (s) => s.weight != null || s.reps != null || s.duration != null
    )
  ).length;
