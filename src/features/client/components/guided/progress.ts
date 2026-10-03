import { type GuidedStep } from '../../guidedSteps';
import { writeProgress, readProgress } from '../../sessionProgress';

// C'est le seul écran qu'on utilise en s'entraînant, celui où perdre sa
// place coûte le plus cher : un appel entrant, ou un écran verrouillé trop
// longtemps, ne doit pas renvoyer à l'étape 1 d'une séance qui en compte
// quarante.
//
// La position rejoint les charges dans un unique enregistrement durable —
// voir `sessionProgress`. Elles étaient séparées, rangées dans deux mémoires
// de durées de vie différentes : l'application gardait ce qui se retrouve et
// perdait ce qui ne se retrouve pas.
export const readSavedIndex = (sessionId: string): number =>
  readProgress(sessionId)?.step ?? 0;

/** Écrit la position dans l'enregistrement durable de la séance — le même
 * que celui des charges, voir `sessionProgress`. */
export const writeSavedIndex = (sessionId: string, index: number) =>
  writeProgress(sessionId, { step: index });

/**
 * Les étapes groupées par bloc, dans l'ordre.
 *
 * Trente tirets de deux pixels ne se lisent pas : on ne sait ni où l'on est
 * ni ce qu'il reste. Trois segments — échauffement, EMOM, AMRAP — se lisent
 * d'un coup d'œil, et le client raisonne en blocs, pas en pages.
 *
 * La largeur de chaque segment suit son poids : un EMOM de douze pages est
 * plus large qu'un échauffement de deux. Des segments égaux mentiraient sur
 * ce qu'il reste.
 */
/**
 * Ce qu'une étape pèse dans la barre : le temps qu'elle demande.
 *
 * Elle pesait des pages, et elle se trompait d'un facteur dix. Mesuré sur la
 * séance de test : l'AMRAP de douze minutes obtenait 24 px, l'EMOM 239 — la
 * barre annonçait la séance faite à 85 % à la fin de l'EMOM, alors qu'en
 * temps vécu les deux blocs se valent. Un client qui la regardait après
 * l'EMOM se croyait arrivé.
 *
 * Le coach donne la durée là où elle fait partie du format : l'intervalle
 * d'un tour, la longueur d'un AMRAP. On la prend telle quelle. Ailleurs — une
 * série, un palier — il ne la donne pas, et l'on compte une minute par série.
 * C'est une approximation, et elle est délibérée : un intervalle d'EMOM EST
 * une minute, et une série avec son repos vaut à peu près autant. C'est
 * infiniment mieux que de compter combien de fois quelqu'un tape
 * « Suivant ».
 */
export const weightOf = (step: GuidedStep): number => {
  if (step.type === 'rest') return step.duration / 60;
  if (step.type === 'round')
    return (step.workSeconds ?? 60) / 60 + (step.restSeconds ?? 0) / 60;
  // Une boucle porte sa durée ; une liste, ses séries.
  if (step.shape === 'loop')
    return Math.max(1, step.block.durationMinutes ?? step.sets.length);
  return Math.max(1, step.sets.length);
};

/** Découpe les étapes en tronçons de bloc : un segment de barre par bloc,
 * large à proportion du temps qu'il demande. */
export const splitIntoBlockRuns = (steps: GuidedStep[]) => {
  const blockRuns: {
    label: string;
    start: number;
    /** Nombre d'étapes — ce qui fait avancer le remplissage. */
    size: number;
    /** Ce que le bloc représente — ce qui fait la largeur du segment. */
    weight: number;
  }[] = [];
  steps.forEach((step, i) => {
    const last = blockRuns[blockRuns.length - 1];
    if (last && last.label === step.blockLabel) {
      last.size += 1;
      last.weight += weightOf(step);
      return;
    }
    blockRuns.push({
      label: step.blockLabel,
      start: i,
      size: 1,
      weight: weightOf(step),
    });
  });
  return blockRuns;
};
