import { useCallback, useState } from 'react';
import { newObjectId } from '@/utils/objectId';
import {
  BlockExercise,
  BlockType,
  ClientProgram,
  Exercise,
  Session,
  SessionBlock,
} from '@/types';
import { blockSupportsSets } from '@/features/program/constants';

type ExerciseUpdate = Partial<Omit<BlockExercise, 'exercise'>>;

const BLOCK_DEFAULTS: Record<BlockType, Partial<SessionBlock>> = {
  warmup: {},
  classic: {},
  chipper: {},
  // An EMOM is set in rounds and interval — never in total duration, which
  // neither its settings nor its summary read. A new block therefore showed
  // "sans limite" although a default had just been set on it.
  emom: { rounds: 10, intervalMinutes: 1 },
  amrap: { durationMinutes: 8 },
  timecap: { durationMinutes: 15 },
  every: { intervalMinutes: 3, rounds: 5 },
  tabata: { rounds: 8, workDuration: 20, restDuration: 10 },
  onoff: { rounds: 10, workDuration: 30, restDuration: 30 },
  pyramid: { repsScheme: [5, 10, 15, 20, 15, 10, 5], restBetweenRounds: 60 },
  ladder: { repsScheme: [5, 10, 15, 20], restBetweenRounds: 60 },
};

const getExerciseDefaults = (blockType: BlockType): Partial<BlockExercise> => {
  // The warm-up accepts sets but sets none: the common case is still a
  // single pass. Defaulting to three sets would also take guided mode from
  // one page to three on every new warm-up. So this test comes before the
  // set-based blocks test.
  if (blockType === 'warmup') return { reps: 10 };
  if (blockSupportsSets(blockType))
    return { sets: 3, reps: 10, restBetweenSets: 60 };
  if (['tabata', 'onoff'].includes(blockType)) return { reps: 5 };
  if (['pyramid', 'ladder'].includes(blockType)) return {};
  return { reps: 10 };
};

export const useProgramEditor = (initialProgram: ClientProgram | null) => {
  const [program, setProgram] = useState<ClientProgram | null>(initialProgram);

  const initialize = useCallback((data: ClientProgram) => {
    setProgram(data);
  }, []);

  // ─── Sessions ──────────────────────────────────────────────────────────────

  const addSession = useCallback(() => {
    setProgram((prev) => {
      if (!prev) return null;
      const newSession: Session = {
        _id: newObjectId(),
        order: prev.sessions.length + 1,
        blocks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { ...prev, sessions: [...prev.sessions, newSession] };
    });
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions
          .filter((s) => s._id !== sessionId)
          .map((s, i) => ({ ...s, order: i + 1 })),
      };
    });
  }, []);

  /**
   * Puts a session back at its rank — the undo safety net's return path.
   */
  const insertSession = useCallback((index: number, session: Session) => {
    setProgram((prev) => {
      if (!prev) return null;
      const sessions = [...prev.sessions];
      sessions.splice(Math.min(index, sessions.length), 0, session);
      return {
        ...prev,
        sessions: sessions.map((s, i) => ({ ...s, order: i + 1 })),
      };
    });
  }, []);

  /**
   * "Session 4 is session 2, heavier" is the central gesture of building a
   * programme. Zero server cost: the whole programme is already in memory and
   * the batched save handles it, exactly as for an empty session.
   */
  const duplicateSession = useCallback((sessionId: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      const index = prev.sessions.findIndex((s) => s._id === sessionId);
      if (index === -1) return prev;

      const source = prev.sessions[index];
      const copy: Session = {
        ...source,
        _id: newObjectId(),
        // Fresh identifiers down to the blocks: two sessions cannot share
        // one block's key, drag and drop would lose its way.
        blocks: source.blocks.map((block) => ({
          ...block,
          _id: newObjectId(),
          exercises: block.exercises.map((ex) => ({ ...ex })),
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const sessions = [
        ...prev.sessions.slice(0, index + 1),
        copy,
        ...prev.sessions.slice(index + 1),
      ].map((s, i) => ({ ...s, order: i + 1 }));

      return { ...prev, sessions };
    });
  }, []);

  const reorderSessions = useCallback((orderedSessionIds: string[]) => {
    setProgram((prev) => {
      if (!prev) return null;
      const byId = new Map(prev.sessions.map((s) => [s._id, s]));
      const reordered = orderedSessionIds
        .map((id) => byId.get(id))
        .filter((s): s is Session => s !== undefined)
        .map((s, index) => ({ ...s, order: index + 1 }));
      return { ...prev, sessions: reordered };
    });
  }, []);

  /**
   * The session's free name.
   *
   * Without trimming whitespace: the field sends as you type, and cutting the
   * trailing space on every character made it impossible to type one. "Full
   * body A" became "FullbodyA". Cleaning belongs at the boundary — at the
   * send to the server — not at the keystroke.
   */
  const updateSessionName = useCallback((sessionId: string, name?: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s._id === sessionId ? { ...s, name } : s
        ),
      };
    });
  }, []);

  const updateSessionNotes = useCallback((sessionId: string, notes: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s._id === sessionId ? { ...s, notes } : s
        ),
      };
    });
  }, []);

  const updateSessionDays = useCallback(
    (sessionId: string, suggestedDays: number[]) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s._id === sessionId
              ? {
                  ...s,
                  suggestedDays: [...new Set(suggestedDays)].sort(
                    (a, b) => a - b
                  ),
                }
              : s
          ),
        };
      });
    },
    []
  );

  // ─── Blocks ────────────────────────────────────────────────────────────────

  const addBlock = useCallback((sessionId: string, type: BlockType) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s._id !== sessionId) return s;
          const newBlock: SessionBlock = {
            _id: newObjectId(),
            type,
            order: s.blocks.length + 1,
            exercises: [],
            ...BLOCK_DEFAULTS[type],
          };
          return { ...s, blocks: [...s.blocks, newBlock] };
        }),
      };
    });
  }, []);

  const removeBlock = useCallback((sessionId: string, blockId: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s._id !== sessionId) return s;
          return {
            ...s,
            blocks: s.blocks
              .filter((b) => b._id !== blockId)
              .map((b, i) => ({ ...b, order: i + 1 })),
          };
        }),
      };
    });
  }, []);

  /**
   * Puts a block back in its place — the undo safety net's return path.
   *
   * A block takes its exercises with it when it goes: so it comes back whole,
   * as it was, and at its rank. Putting it back last would move the warm-up
   * after the AMRAP.
   */
  const insertBlock = useCallback(
    (sessionId: string, index: number, block: SessionBlock) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            const blocks = [...s.blocks];
            blocks.splice(Math.min(index, blocks.length), 0, block);
            return {
              ...s,
              blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })),
            };
          }),
        };
      });
    },
    []
  );

  const updateBlock = useCallback(
    (sessionId: string, blockId: string, updates: Partial<SessionBlock>) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            return {
              ...s,
              blocks: s.blocks.map((b) =>
                b._id === blockId ? { ...b, ...updates } : b
              ),
            };
          }),
        };
      });
    },
    []
  );

  // ─── Exercises ─────────────────────────────────────────────────────────────

  const updateBlockExercises = useCallback(
    (
      sessionId: string,
      blockId: string,
      updater: (exercises: BlockExercise[]) => BlockExercise[]
    ) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            return {
              ...s,
              blocks: s.blocks.map((b) => {
                if (b._id !== blockId) return b;
                return { ...b, exercises: updater(b.exercises) };
              }),
            };
          }),
        };
      });
    },
    []
  );

  const addExercise = useCallback(
    (sessionId: string, blockId: string, exercise: Exercise) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            return {
              ...s,
              blocks: s.blocks.map((b) => {
                if (b._id !== blockId) return b;
                const newExercise: BlockExercise = {
                  exercise,
                  order: b.exercises.length + 1,
                  ...getExerciseDefaults(b.type),
                };
                return { ...b, exercises: [...b.exercises, newExercise] };
              }),
            };
          }),
        };
      });
    },
    []
  );

  const removeExercise = useCallback(
    (sessionId: string, blockId: string, index: number) => {
      updateBlockExercises(sessionId, blockId, (exs) =>
        exs
          .filter((_, i) => i !== index)
          .map((e, i) => ({ ...e, order: i + 1 }))
      );
    },
    [updateBlockExercises]
  );

  /**
   * Puts an exercise back in its place — the undo safety net's return path.
   *
   * In its place, not at the end: an exercise removed by mistake from the
   * middle of a block has not changed its mind about its rank, and seeing it
   * reappear last would force another move.
   */
  const insertExercise = useCallback(
    (
      sessionId: string,
      blockId: string,
      index: number,
      exercise: BlockExercise
    ) => {
      updateBlockExercises(sessionId, blockId, (exs) => {
        const suivants = [...exs];
        suivants.splice(Math.min(index, suivants.length), 0, exercise);
        return suivants.map((e, i) => ({ ...e, order: i + 1 }));
      });
    },
    [updateBlockExercises]
  );

  const updateExercise = useCallback(
    (
      sessionId: string,
      blockId: string,
      index: number,
      updates: ExerciseUpdate
    ) => {
      updateBlockExercises(sessionId, blockId, (exs) =>
        exs.map((e, i) => (i === index ? { ...e, ...updates } : e))
      );
    },
    [updateBlockExercises]
  );

  const reorderBlocks = useCallback(
    (sessionId: string, orderedBlockIds: string[]) => {
      setProgram((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session._id !== sessionId) return session;

            const blockById = new Map(session.blocks.map((b) => [b._id, b]));
            const reordered = orderedBlockIds
              .map((id) => blockById.get(id))
              .filter((block): block is SessionBlock => block !== undefined)
              .map((block, index) => ({ ...block, order: index + 1 }));

            return { ...session, blocks: reordered };
          }),
        };
      });
    },
    []
  );

  return {
    program,
    initialize,
    actions: {
      addSession,
      removeSession,
      insertSession,
      duplicateSession,
      reorderSessions,
      updateSessionName,
      updateSessionNotes,
      updateSessionDays,
      addBlock,
      removeBlock,
      insertBlock,
      updateBlock,
      addExercise,
      removeExercise,
      insertExercise,
      updateExercise,
      reorderBlocks,
    },
  };
};
