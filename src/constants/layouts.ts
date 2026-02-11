/**
 * Templates de grille réutilisables pour la cohérence du design
 */
export const GRID_LAYOUTS = {
  /**
   * Grid 4 colonnes responsive (cards, exercices, etc.)
   */
  fourColumns: {
    base: "repeat(2, 1fr)",
    sm: "repeat(3, 1fr)",
    lg: "repeat(4, 1fr)",
    xl: "repeat(5, 1fr)",
  },

  /**
   * Grid 3 colonnes responsive (sessions, programmes)
   */
  threeColumns: {
    base: "repeat(2, 1fr)",
    md: "repeat(2, 1fr)",
    lg: "repeat(3, 1fr)",
  },

  /**
   * Grid 2 colonnes responsive
   */
  twoColumns: {
    base: "repeat(2, 1fr)",
  },

  /**
   * Grid sessions avec largeur fixe
   */
  sessions: {
    base: "1fr",
    md: "repeat(auto-fill, minmax(450px, 450px))",
    lg: "repeat(auto-fill, minmax(500px, 500px))",
  },
} as const;
