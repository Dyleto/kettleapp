import { createContext, useContext } from 'react';

/**
 * La séance est en pause : toutes ses horloges s'arrêtent.
 *
 * Un contexte plutôt qu'une propriété passée de main en main : une scène
 * porte une horloge de tour, une de repos, parfois une à la demande sous
 * une ligne, et la pause doit toutes les atteindre sans que la scène ait à
 * les connaître. Une horloge oubliée continuerait de tourner derrière la
 * feuille — exactement ce qu'une pause promet de ne pas faire.
 */
export const PauseContext = createContext(false);

/** Ce que lit une horloge pour savoir si elle doit se figer. */
export const useScenePaused = (): boolean => useContext(PauseContext);
