/**
 * L'horloge d'un bloc chronométré, en fonctions pures.
 *
 * Elle remplace un décompte par tour. Chaque tour avait le sien, qui partait
 * de zéro à son montage : un téléphone verrouillé trois minutes pendant un
 * EMOM retrouvait le tour 3 là où il l'avait laissé, avec sa minute pleine,
 * alors que le client en était au tour 6. Ici le bloc n'a qu'une origine —
 * l'instant où son premier tour aurait commencé — et tout le reste s'en
 * déduit : le tour, la phase, les secondes. Revenir sur l'écran donne l'état
 * réel, tours écoulés compris, et se recaler d'un tour revient à déplacer
 * l'origine.
 */

/** Ce que le bloc impose, en secondes. */
export interface TimedPlan {
  /** Le travail d'un tour : tout l'intervalle sur un EMOM. */
  work: number;
  /** Le repos imposé après le travail ; zéro sur un EMOM, dont le repos est
   * ce qu'il reste de la minute. */
  rest: number;
  /** `null` : sans limite — l'horloge tourne jusqu'à ce qu'on l'arrête. */
  rounds: number | null;
}

/** Ce que l'horloge affiche à un instant donné. */
export interface ClockReading {
  /** Compté à partir de 1, plafonné au dernier tour. */
  round: number;
  phase: 'work' | 'rest';
  /** Les secondes affichées, arrondies vers le haut comme `secondsLeft`. */
  remaining: number;
  /** La durée de la phase en cours, pour l'anneau. */
  length: number;
  /** Le dernier tour est fini : le bloc l'est. */
  finished: boolean;
}

/** La durée d'un tour, repos compris, en millisecondes. */
const periodOf = (plan: TimedPlan): number =>
  (Math.max(1, plan.work) + Math.max(0, plan.rest)) * 1000;

/**
 * L'instant où commence un tour, compté depuis l'origine du bloc.
 *
 * C'est ce qui sert à lancer l'horloge sur un autre tour que le premier
 * — reprendre une séance au tour 4 — et à se recaler d'un tour.
 */
export const roundStart = (plan: TimedPlan, round: number): number =>
  (Math.min(Math.max(1, round), plan.rounds ?? Infinity) - 1) * periodOf(plan);

/**
 * Où en est le bloc, `elapsed` millisecondes après son origine.
 *
 * Le dernier tour fini, la lecture reste sur sa dernière phase à zéro : rien
 * ne doit afficher un tour 11 sur 10 pendant le rendu qui précède le passage
 * au bloc suivant.
 */
export const readClock = (plan: TimedPlan, elapsed: number): ClockReading => {
  const work = Math.max(1, plan.work) * 1000;
  const rest = Math.max(0, plan.rest) * 1000;
  const period = work + rest;
  const at = Math.max(0, elapsed);

  if (plan.rounds !== null && at >= period * plan.rounds) {
    const phase = rest > 0 ? 'rest' : 'work';
    return {
      round: plan.rounds,
      phase,
      remaining: 0,
      length: (phase === 'rest' ? rest : work) / 1000,
      finished: true,
    };
  }

  const round = Math.floor(at / period) + 1;
  const within = at % period;
  const phase = within < work ? 'work' : 'rest';
  const end = phase === 'work' ? work : period;
  return {
    round,
    phase,
    remaining: Math.ceil((end - within) / 1000),
    length: (phase === 'work' ? work : rest) / 1000,
    finished: false,
  };
};

/**
 * Le chiffre au centre de l'horloge.
 *
 * Toujours « m:ss » sur un tour d'EMOM, y compris sous la minute :
 * `formatCountdown` écrit « 42 s » sous soixante secondes, et le chiffre
 * changerait de forme au milieu de chaque tour, en passant de « 1:00 » à
 * « 59 s ». Un cadran garde la sienne. En Tabata et en On-Off la phase est
 * courte et le chiffre seul se lit de plus loin, en deux chiffres comme sur
 * un chronomètre de salle : « 07 ».
 */
export const clockFace = (reading: ClockReading, bare: boolean): string => {
  const { remaining, length } = reading;
  if (bare && length < 100) return String(remaining).padStart(2, '0');
  const minutes = Math.floor(remaining / 60);
  return `${minutes}:${String(remaining % 60).padStart(2, '0')}`;
};
