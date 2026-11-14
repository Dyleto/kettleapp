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
