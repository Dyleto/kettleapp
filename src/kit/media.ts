/**
 * Le téléphone couché : c'est la hauteur qui décide, pas la largeur.
 *
 * Un client qui pose son téléphone contre un mur pendant un EMOM le pose à
 * plat, et l'écran tombe de 844 px de haut à 390. Une requête sur
 * l'orientation seule attraperait aussi les tablettes, qui n'ont pas ce
 * problème : 520 px de haut est le seuil au-delà duquel la mise en page debout
 * tient encore.
 */
export const LANDSCAPE =
  '@media (orientation: landscape) and (max-height: 520px)';

/**
 * Le grand écran : une tablette posée en largeur, un ordinateur au sol.
 *
 * La séance s'y affichait dans une boîte de 560 px au milieu d'un fond
 * assombri — l'écran du téléphone, centré, à trois mètres de distance. Ici
 * elle prend toute la place, sur deux colonnes. Il faut de la largeur et de
 * la hauteur : une tablette debout (768 px) garde la mise en page du
 * téléphone, qui lui va, et un téléphone couché a la sienne.
 */
export const WIDE = '@media (min-width: 1024px) and (min-height: 600px)';
