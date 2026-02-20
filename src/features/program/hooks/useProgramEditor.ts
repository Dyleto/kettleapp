import { useState, useCallback } from "react";
import { ClientWithDetails, Session, Exercise, ClientProgram } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Ce hook gère uniquement la logique de modification d'un programme client
export const useProgramEditor = (initialProgram: ClientProgram | null) => {
  const [program, setProgram] = useState<ClientProgram | null>(initialProgram);

  // Réinitialise avec de nouvelles données (ex: après un fetch)
  const initialize = useCallback((data: ClientProgram) => {
    setProgram(data);
  }, []);

  // --- ACTIONS SESSIONS ---

  const addSession = useCallback(() => {
    if (!program) return;

    const newSession: Session = {
      _id: `temp-${uuidv4()}`,
      order: program.sessions.length + 1,
      warmup: { exercises: [] },
      workout: { exercises: [], rounds: 3, restBetweenRounds: 60 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProgram((prev) =>
      prev
        ? {
            ...prev,
            sessions: [...prev.sessions, newSession],
          }
        : null,
    );
  }, [program]);

  const removeSession = useCallback((sessionId: string) => {
    setProgram((prev) => {
      if (!prev) return null;

      // 1. Filtrer la session supprimée
      const remainingSessions = prev.sessions.filter(
        (s) => s._id !== sessionId,
      );

      // 2. Ré-indexer et renommer si nécessaire
      const reorderedSessions = remainingSessions.map((session, index) => {
        const newOrder = index + 1;

        return {
          ...session,
          order: newOrder,
        };
      });

      return {
        ...prev,
        sessions: reorderedSessions,
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

  // --- ACTIONS EXERCICES ---

  // Helper pour éviter la répétition de la logique de recherche
  const updateSessionExercise = useCallback(
    (
      sessionId: string,
      type: "warmup" | "workout",
      updater: (exercises: any[]) => any[],
    ) => {
      setProgram((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session._id !== sessionId) return session;

            const newSession = { ...session };

            if (type === "warmup") {
              newSession.warmup = {
                ...session.warmup,
                exercises: updater(session.warmup?.exercises ?? []),
              };
            } else {
              newSession.workout = {
                ...session.workout,
                exercises: updater(session.workout.exercises),
              };
            }

            return newSession;
          }),
        };
      });
    },
    [],
  );

  const addExercise = useCallback(
    (
      sessionId: string,
      type: "warmup" | "workout",
      exercise: Partial<Exercise>,
    ) => {
      const newExerciseEntry = {
        exercise: { ...exercise },
        sets: type === "workout" ? 3 : undefined,
        reps: 10,
        duration: 0,
        restBetweenSets: type === "workout" ? 60 : undefined,
        mode: "reps",
      };

      updateSessionExercise(sessionId, type, (list) => [
        ...list,
        newExerciseEntry,
      ]);
    },
    [updateSessionExercise],
  );

  const removeExercise = useCallback(
    (sessionId: string, type: "warmup" | "workout", index: number) => {
      updateSessionExercise(sessionId, type, (list) =>
        list.filter((_, i) => i !== index),
      );
    },
    [updateSessionExercise],
  );

  const updateExerciseDetails = useCallback(
    (
      sessionId: string,
      type: "warmup" | "workout",
      index: number,
      updates: any,
    ) => {
      updateSessionExercise(sessionId, type, (list) =>
        list.map((ex, i) => (i === index ? { ...ex, ...updates } : ex)),
      );
    },
    [updateSessionExercise],
  );

  const updateRounds = useCallback((sessionId: string, rounds: number) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s._id === sessionId
            ? {
                ...s,
                workout: { ...s.workout, rounds },
              }
            : s,
        ),
      };
    });
  }, []);

  const updateRestBetweenRounds = useCallback(
    (sessionId: string, rest: number) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s._id === sessionId
              ? {
                  ...s,
                  workout: { ...s.workout, restBetweenRounds: rest },
                }
              : s,
          ),
        };
      });
    },
    [],
  );

  return {
    program,
    initialize,
    actions: {
      addSession,
      removeSession,
      updateSessionNotes,
      addExercise,
      removeExercise,
      updateExerciseDetails,
      updateRounds,
      updateRestBetweenRounds,
    },
  };
};
