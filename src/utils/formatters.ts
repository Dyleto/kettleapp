/**
 * Formate une durée en secondes en format lisible (ex: 1h30, 45min, 30s)
 * @param seconds Durée en secondes
 * @returns Durée formatée
 */
export const formatDuration = (seconds: number): string => {
  const totalMinutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Si moins d'une minute, afficher en secondes uniquement
  if (totalMinutes === 0) {
    return `${seconds}s`;
  }

  // Si moins d'une heure
  if (totalMinutes < 60) {
    if (remainingSeconds > 0) {
      return `${totalMinutes}min${remainingSeconds}`;
    }
    return `${totalMinutes}min`;
  }

  // Sinon afficher en heures et minutes (on ignore les secondes)
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h${mins.toString().padStart(2, "0")}`;
};
