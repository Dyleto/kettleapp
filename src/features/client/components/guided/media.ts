/**
 * Le téléphone couché : c'est la hauteur qui décide, pas la largeur.
 *
 * Un client qui pose son téléphone contre un mur pendant un EMOM le pose à
 * plat, et l'écran tombe de 844 px de haut à 390. Une requête sur
 * l'orientation seule attraperait aussi les tablettes, qui n'ont pas ce
 * problème : 520 px de haut est le seuil au-delà duquel la mise en page debout
 * tient encore.
 */
export const PAYSAGE =
  '@media (orientation: landscape) and (max-height: 520px)';
