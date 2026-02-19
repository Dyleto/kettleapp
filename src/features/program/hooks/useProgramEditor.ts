import { useState, useCallback } from "react";
import { ClientWithDetails, Session, Exercise, ClientProgram } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Ce hook gère uniquement la logique de modification d'un programme client
export const useProgramEditor = (initialProgram: ClientProgram | null) => {
  const [program, setProgram] = useState<ClientProgram | null>(initialProgram);
  const [isDirty, setIsDirty] = useState(false);

  // Réinitialise avec de nouvelles données (ex: après un fetch)
  const initialize = useCallback((data: ClientProgram) => {
    setProgram(data);
    setIsDirty(false);
  }, []);

  // --- ACTIONS SESSIONS ---

  const addSession = useCallback(() => {
    if (!program) return;
    const newSession: Session = {
      _id: `temp-${uuidv4()}`,
      name: `Séance ${program.sessions.length + 1}`,
      order: program.sessions.length + 1,
      warmup: { exercises: [], notes: "" },
      workout: { exercises: [], notes: "", rounds: 3, restBetweenRounds: 60 },
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
    setIsDirty(true);
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

        // Vérifie si le nom correspond au format par défaut "Séance X"
        // Si oui, on le met à jour. Si non (nom custom), on le garde.
        const isDefaultName = /^Séance \d+$/.test(session.name);

        return {
          ...session,
          order: newOrder,
          name: isDefaultName ? `Séance ${newOrder}` : session.name,
        };
      });

      return {
        ...prev,
        sessions: reorderedSessions,
      };
    });
    setIsDirty(true);
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
    setIsDirty(true);
  }, []);

  // --- ACTIONS EXERCICES ---

  // Helper pour éviter la répétition de la logique de recherche
  const updateSessionExercise = (
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

          // Clone profond nécessaire pour éviter mutation directe
          const newSession = JSON.parse(JSON.stringify(session));

          if (type === "warmup" && newSession.warmup) {
            newSession.warmup.exercises = updater(newSession.warmup.exercises);
          } else if (type === "workout") {
            newSession.workout.exercises = updater(
              newSession.workout.exercises,
            );
          }
          return newSession;
        }),
      };
    });
    setIsDirty(true);
  };

  const addExercise = useCallback(
    (sessionId: string, type: "warmup" | "workout", exercise: Exercise) => {
      const newExerciseEntry = {
        exercise: { ...exercise, type }, // Copie minimale
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
    [],
  );

  const removeExercise = useCallback(
    (sessionId: string, type: "warmup" | "workout", index: number) => {
      updateSessionExercise(sessionId, type, (list) =>
        list.filter((_, i) => i !== index),
      );
    },
    [],
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
    [],
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
    setIsDirty(true);
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
      setIsDirty(true);
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
    isDirty,
  };
};
