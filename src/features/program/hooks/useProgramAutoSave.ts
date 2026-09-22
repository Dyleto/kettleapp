import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientProgram, Session } from '@/types';

/** What the status line has to say. */
export type SaveState = 'idle' | 'pending' | 'saving' | 'error';

/**
 * Delay before sending a value change. Short enough that closing the tab
 * right after a keystroke loses nothing, long enough that we do not send the
 * whole programme on every character.
 */
const DELAI_VALEUR = 800;

/**
 * A fingerprint of the programme's structure: the identifiers and the number
 * of exercises, nothing of the values.
 *
 * It tells apart two gestures the coach does not experience the same way.
 * Adding a block or deleting an exercise is a decisive action, saved at once.
 * Retyping "12 reps" produces one per character: that one waits until they
 * have finished.
 */
const empreinte = (sessions: Session[]): string =>
  sessions
    .map(
      (s) =>
        `${s._id}:${s.blocks
          .map((b) => `${b._id}.${b.exercises.length}`)
          .join(',')}`
    )
    .join('|');

interface Params {
  /** The editor's local state, the one the coach manipulates. */
  program: ClientProgram | null;
  /** The programme as the server sent it, or `undefined` while it loads. */
  serverProgram: ClientProgram | undefined;
  /** Replaces the local state — first arrival, and adopting the response. */
  initialize: (data: ClientProgram) => void;
  /** Sends the programme and returns what the server actually recorded. */
  save: (sessions: Session[]) => Promise<Session[]>;
}

interface Retour {
  state: SaveState;
  /** True while a change has not left, or has not been confirmed. */
  isDirty: boolean;
  savedAt: Date | null;
  /** Forces an immediate send: the retry button after a failure. */
  flush: () => void;
}

/**
 * Saves the programme as you go.
 *
 * Three things to hold together, and it is their combination that is
 * delicate:
 *
 * 1. A background refetch must never overwrite a change in progress. React
 *    Query refreshes on window focus once the data is stale; the editor then
 *    reset itself silently and unsaved work disappeared without a word. That
 *    is the defect this hook fixes first.
 *
 * 2. One send at a time. Two concurrent requests on the same programme means
 *    last one wins — and we do not know which that is. Anything that happens
 *    during a send waits for the response.
 *
 * 3. The response is authoritative, but only if nothing moved meanwhile.
 *    Otherwise we drop it: the next send, which carries the same
 *    identifiers, will replace it.
 */
export const useProgramAutoSave = ({
  program,
  serverProgram,
  initialize,
  save,
}: Params): Retour => {
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  /**
   * What the server has, as far as we know, and `null` before the first load.
   * It is state and not a ref: `isDirty` derives from it, and so it has to
   * trigger a render.
   */
  const [enregistre, setEnregistre] = useState<string | null>(null);

  const courant = program ? JSON.stringify(program.sessions) : null;
  const isDirty =
    courant !== null && enregistre !== null && courant !== enregistre;

  /** The same content, readable from `send` which runs outside render. */
  const refEnregistre = useRef<string | null>(null);
  /** The content of the send in flight, or `null` when there is none. */
  const enVol = useRef<string | null>(null);
  /** The last known state, read by the deferred send without re-triggering it. */
  const dernier = useRef<Session[] | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const structure = useRef<string>('');
  /** `send` calls itself; it goes through here in order to be able to. */
  const relancer = useRef<() => void>(() => {});

  useEffect(() => {
    dernier.current = program?.sessions ?? null;
  });

  /** Adopts a version as being the server's. */
  const adopter = useCallback((sessions: Session[], contenu: string) => {
    refEnregistre.current = contenu;
    structure.current = empreinte(sessions);
    setEnregistre(contenu);
  }, []);

  const envoyer = useCallback(() => {
    const sessions = dernier.current;
    if (!sessions) return;
    const contenu = JSON.stringify(sessions);

    if (contenu === refEnregistre.current) {
      // The coach went back to the saved version themselves during the
      // wait: there is nothing left to send.
      if (enVol.current === null) setState('idle');
      return;
    }
    // A send has already gone: this one will happen when it returns.
    if (enVol.current !== null) return;

    enVol.current = contenu;
    setState('saving');

    save(sessions)
      .then((renvoye) => {
        const inchange = enVol.current === JSON.stringify(dernier.current);
        enVol.current = null;
        setSavedAt(new Date());

        if (inchange) {
          // The server is authoritative: it set the orders, the dates and
          // the final identifiers. We adopt its version so the next
          // comparison is against the same shape.
          adopter(renvoye, JSON.stringify(renvoye));
          initialize({ sessions: renvoye });
          setState('idle');
          return;
        }

        // The coach carried on during the send. We touch nothing and go
        // again: the request carries the same identifiers, so it is safe to
        // replay.
        setState('pending');
        relancer.current();
      })
      .catch(() => {
        enVol.current = null;
        setState('error');
      });
  }, [adopter, initialize, save]);

  useEffect(() => {
    relancer.current = envoyer;
  }, [envoyer]);

  // ── First arrival, and background refreshes ──────────────────────────────
  useEffect(() => {
    if (!serverProgram) return;
    const recu = JSON.stringify(serverProgram.sessions);

    if (refEnregistre.current === null) {
      adopter(serverProgram.sessions, recu);
      initialize(serverProgram);
      return;
    }

    // Everything that arrives afterwards is a background refetch. It only
    // replaces the editor when there is nothing to lose: no pending change,
    // no send in flight, no failure to retry.
    if (isDirty || enVol.current !== null || state === 'error') return;
    if (recu === refEnregistre.current) return;

    adopter(serverProgram.sessions, recu);
    initialize(serverProgram);
    // `isDirty` and `state` are read to decide whether to ignore, not to
    // trigger: listing them as dependencies would rerun the effect on every
    // keystroke without changing the result. And writing state here is the
    // work itself: copying an external source into local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverProgram, adopter, initialize]);

  // ── Scheduling the send ──────────────────────────────────────────────────
  useEffect(() => {
    if (courant === null || enregistre === null) return;
    if (courant === enregistre) return;

    const nouvelleStructure = empreinte(program?.sessions ?? []);
    const structurel = nouvelleStructure !== structure.current;
    structure.current = nouvelleStructure;

    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(envoyer, structurel ? 0 : DELAI_VALEUR);

    return () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    };
    // `program` is only read for its fingerprint, which `current` already
    // triggers on: adding it would run the effect twice per keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courant, enregistre, envoyer]);

  // A scheduled send is not yet a send: say so, so the status line does not
  // stay mute during the wait.
  useEffect(() => {
    if (!isDirty) return;
    // Copying information the render already knows, and nothing else: no
    // cascade to fear, the state converges on the first pass.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((precedent) => (precedent === 'idle' ? 'pending' : precedent));
  }, [isDirty]);

  const flush = useCallback(() => {
    if (minuteur.current) clearTimeout(minuteur.current);
    envoyer();
  }, [envoyer]);

  // ── Safety net on close ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty && state !== 'saving') return;
    const avertir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avertir);
    return () => window.removeEventListener('beforeunload', avertir);
  }, [isDirty, state]);

  // ── Leaving the editor is not giving up ──────────────────────────────────
  //
  // `beforeunload` only covers closing the tab. An internal navigation — the
  // phone's back button, a link — unmounted the editor without a word, and
  // the 800 ms wait on a value in progress went with it. A coach experienced
  // that as "the app cancelled my session".
  //
  // The send is safe to fire for nothing: it compares against the last saved
  // state and only goes when there is something to say. Declared last so the
  // scheduling cleanup above has already released its timer.
  useEffect(
    () => () => {
      relancer.current();
    },
    []
  );

  return { state, isDirty, savedAt, flush };
};
