import { Session } from "@/types";

/**
 * Calcule la durée totale d'une séance en secondes
 * Inclut : échauffement + (workout par tour × nombre de tours) + repos entre tours
 * @param session La séance à calculer
 * @returns Durée totale en secondes
 */
export const calculateSessionDuration = (session: Session): number => {
  let totalSeconds = 0;

  // Temps d'échauffement
  if (session.warmup?.exercises) {
    session.warmup.exercises.forEach((ex) => {
      if (ex.duration) {
        totalSeconds += ex.duration;
      }
      if (ex.reps) {
        totalSeconds += 60; // 1 minute par exercice avec reps
      }
    });
  }

  // Temps d'entraînement par tour
  let workoutTimePerRound = 0;
  session.workout.exercises.forEach((ex) => {
    if (ex.duration) {
      workoutTimePerRound += ex.duration;
    }
    if (ex.sets) {
      workoutTimePerRound += ex.sets * 60; // 1 min par série
    }
    // Repos entre séries
    if (ex.sets && ex.restBetweenSets) {
      workoutTimePerRound += (ex.sets - 1) * ex.restBetweenSets;
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
