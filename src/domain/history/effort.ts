import { CompletedSession } from '@/shared/types';

/** Trois zones, pas cinq : ce qui compte est de savoir de quel côté de la
 * cible on est tombé. */
export type EffortZone = 'easy' | 'target' | 'hard';

/** Un cran de l'échelle : sa valeur enregistrée, son mot, sa zone. */
export interface EffortLevel {
  value: number;
  label: string;
  description: string;
  zone: EffortZone;
}

// La cible est au centre et elle est nommée : il n'y a aucun « plus =
// mieux » à interpréter. 1 et 5 sont deux problèmes différents, pas les deux
// bouts d'une échelle de qualité.
//
// Cet ordre est le seul : celui des valeurs enregistrées, que le client
// choisit et que le coach lit. Il a existé une seconde échelle, inversée et
// numérotée à rebours pour l'affichage du client — « 1 » y voulait dire
// « Trop dure », valeur 5. Deux sens pour une même réponse : elle est partie.
export const EFFORT_LEVELS: EffortLevel[] = [
  {
    value: 1,
    label: 'Trop facile',
    description: "j'aurais pu en faire beaucoup plus",
    zone: 'easy',
  },
  {
    value: 2,
    label: 'Facile',
    description: 'confortable du début à la fin',
    zone: 'easy',
  },
  {
    value: 3,
    label: 'Juste',
    description: 'engagée, mais tenue',
    zone: 'target',
  },
  {
    value: 4,
    label: 'Dure',
    description: 'finie en serrant les dents',
    zone: 'hard',
  },
  {
    value: 5,
    label: 'Trop dure',
    description: "je n'ai pas pu tout faire",
    zone: 'hard',
  },
];

// L'effort a sa propre échelle (voir `effort` dans le thème). Jusqu'ici il
// empruntait l'ambre de la marque pour son milieu et les accents de bloc pour
// ses extrêmes : trois couleurs qui disent déjà autre chose ailleurs, dont
// l'une à quelques centimètres sur la même ligne — dans la liste des clients,
// le rouge d'effort voisinait avec l'or de ce qui attend le coach.
export const EFFORT_ZONE_COLOR: Record<EffortZone, string> = {
  easy: 'effort.easy',
  target: 'effort.target',
  hard: 'effort.hard',
};

/** Rend `undefined` et non un cran par défaut : un bilan sans ressenti est
 * une absence de réponse, pas un « Juste ». */
export const getEffortLevel = (effort?: number): EffortLevel | undefined =>
  EFFORT_LEVELS.find((l) => l.value === effort);

/**
 * Le cran d'effort que le client a choisi — celui dont le mot est « Juste »,
 * « Dure ». Le cran entier et non son libellé : les appelants en lisent aussi
 * la zone, pour la couleur.
 *
 * `null` pour un bilan enregistré avant la refonte de l'échelle d'effort : la
 * question ne lui a jamais été posée, et on n'invente pas de réponse — un
 * « Juste » par défaut se lirait comme un ressenti.
 */
export const getEffortSummary = (completed: CompletedSession) =>
  getEffortLevel(completed.feedback?.effort) ?? null;
