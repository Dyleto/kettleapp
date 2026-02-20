import { Session } from "@/types";

/**
 * Calcule la durée totale d'une séance en secondes
 * Inclut : échauffement + (workout par tour × nombre de tours) + repos entre tours
 * Prend en compte le mode d'édition (_uiMode) s'il est présent pour ne pas additionner timer + reps.
 */
export const calculateSessionDuration = (session: Session): number => {
  let totalSeconds = 0;

  // Temps d'échauffement
  if (session.warmup?.exercises) {
    session.warmup.exercises.forEach((ex: any) => {
      // Si mode explicite
      if (ex.mode) {
        if (ex.mode === "timer") {
          totalSeconds += ex.duration || 0;
        } else {
          // Estimation arbitraire pour reps en warmup (souvent 1 set)
          totalSeconds += 60;
        }
      } else {
        // Mode classique (lecture ou données propres)
        if (ex.duration) {
          totalSeconds += ex.duration;
        } else if (ex.reps) {
          totalSeconds += 60;
        }
      }
    });
  }

  // Temps d'entraînement par tour
  let workoutTimePerRound = 0;
  session.workout.exercises.forEach((ex: any) => {
    // Déterminer le mode actif
    const isTimerMode = ex.mode
      ? ex.mode === "timer"
      : (ex.duration || 0) > 0 && !ex.sets; // Fallback simple

    if (isTimerMode) {
      workoutTimePerRound += ex.duration || 0;
    } else {
      // Mode Séries/Reps
      const sets = ex.sets || 1; // Minimum 1 série si on est en mode reps
      // Estimation : 1 rep = 3-4s ? ou juste 1 min par set comme avant
      workoutTimePerRound += sets * 45; // Ex: 45s d'effort par série

      // Repos entre séries
      if (sets > 1 && ex.restBetweenSets) {
        workoutTimePerRound += (sets - 1) * ex.restBetweenSets;
      }
    }
  });

  // Multiplier par le nombre de tours
  totalSeconds += workoutTimePerRound * session.workout.rounds;

  // Ajouter repos entre tours
  if (session.workout.restBetweenRounds && session.workout.rounds > 1) {
    totalSeconds +=
      (session.workout.rounds - 1) * session.workout.restBetweenRounds;
  }

  return totalSeconds;
};
