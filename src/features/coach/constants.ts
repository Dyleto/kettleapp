/**
 * Les deux largeurs de l'espace coach.
 *
 * Une colonne de lecture s'arrête à 720 px — au-delà, l'œil perd sa ligne en
 * revenant à gauche. Une grille, elle, remplit ce qu'on lui donne : on la
 * balaye, on ne la lit pas ligne à ligne.
 *
 * Écrites ici parce que deux écrans doivent s'aligner sur la même : un filtre
 * plus large que ce qu'il filtre a l'air de chercher ailleurs.
 */
export const COACH_CONTENT_MAX_W = '720px';
export const COACH_GRID_MAX_W = '6xl';
