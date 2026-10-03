/**
 * Les gabarits de grille, à une seule adresse.
 *
 * Réécrits dans chaque écran, ils divergeaient : deux listes de cartes
 * n'avaient pas le même nombre de colonnes à la même largeur.
 */
export const GRID_LAYOUTS = {
  /** Quatre colonnes qui s'adaptent : cartes, exercices, tout ce qui se
   * lit en vignettes. */
  fourColumns: {
    base: 'repeat(2, 1fr)',
    sm: 'repeat(3, 1fr)',
    lg: 'repeat(4, 1fr)',
    xl: 'repeat(5, 1fr)',
  },

  /** Trois colonnes : séances et programmes, dont les cartes sont plus
   * larges que des vignettes d'exercice. */
  threeColumns: {
    base: 'repeat(2, 1fr)',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
  },

  /**
   * Grid 2 colonnes responsive
   */
  twoColumns: {
    base: 'repeat(2, 1fr)',
  },

  /** Les séances, à largeur fixe plutôt qu'élastique : une carte de séance
   * qui s'étire perd sa colonne de réglages. */
  sessions: {
    base: '1fr',
    md: 'repeat(auto-fill, minmax(450px, 450px))',
    lg: 'repeat(auto-fill, minmax(500px, 500px))',
  },
} as const;
