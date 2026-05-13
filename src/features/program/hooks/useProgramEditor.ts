import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  BlockExercise,
  BlockType,
  ClientProgram,
  Exercise,
  Session,
  SessionBlock,
} from "@/types";
import { blockSupportsSets } from "@/constants/blockTypes";

type ExerciseUpdate = Partial<Omit<BlockExercise, "exercise">>;

const BLOCK_DEFAULTS: Record<BlockType, Partial<SessionBlock>> = {
  warmup:  {},
  classic: {},
  chipper: {},
  emom:    { durationMinutes: 10 },
  amrap:   { durationMinutes: 8 },
  timecap: { durationMinutes: 15 },
  every:   { intervalMinutes: 3, rounds: 5, restBetweenRounds: 60 },
  tabata:  { rounds: 8, workDuration: 20, restDuration: 10 },
  onoff:   { rounds: 10, workDuration: 30, restDuration: 30 },
  pyramid: { repsScheme: [5, 10, 15, 20, 15, 10, 5], restBetweenRounds: 60 },
  ladder:  { repsScheme: [5, 10, 15, 20], restBetweenRounds: 60 },
};

const getExerciseDefaults = (blockType: BlockType): Partial<BlockExercise> => {
  if (blockSupportsSets(blockType)) return { sets: 3, reps: 10, restBetweenSets: 60 };
  if (["tabata", "onoff", "pyramid", "ladder"].includes(blockType)) return {};
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
        _id: `temp-${uuidv4()}`,
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

  const updateSessionNotes = useCallback((sessionId: string, notes: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s._id === sessionId ? { ...s, notes } : s,
        ),
      };
    });
  }, []);

  // ─── Blocks ────────────────────────────────────────────────────────────────

  const addBlock = useCallback((sessionId: string, type: BlockType) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s._id !== sessionId) return s;
          const newBlock: SessionBlock = {
            _id: `temp-${uuidv4()}`,
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
                b._id === blockId ? { ...b, ...updates } : b,
              ),
            };
          }),
        };
      });
    },
    [],
  );

  // ─── Exercises ─────────────────────────────────────────────────────────────

  const updateBlockExercises = useCallback(
    (
      sessionId: string,
      blockId: string,
      updater: (exercises: BlockExercise[]) => BlockExercise[],
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
    [],
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
    [],
  );

  const removeExercise = useCallback(
    (sessionId: string, blockId: string, index: number) => {
      updateBlockExercises(sessionId, blockId, (exs) =>
        exs
          .filter((_, i) => i !== index)
          .map((e, i) => ({ ...e, order: i + 1 })),
      );
    },
    [updateBlockExercises],
  );

  const updateExercise = useCallback(
    (
      sessionId: string,
      blockId: string,
      index: number,
      updates: ExerciseUpdate,
    ) => {
      updateBlockExercises(sessionId, blockId, (exs) =>
        exs.map((e, i) => (i === index ? { ...e, ...updates } : e)),
      );
    },
    [updateBlockExercises],
  );

  return {
    program,
    initialize,
    actions: {
      addSession,
      removeSession,
      updateSessionNotes,
      addBlock,
      removeBlock,
      updateBlock,
      addExercise,
      removeExercise,
      updateExercise,
    },
  };
};
