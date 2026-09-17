import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * La question posée n'est pas « l'écran est-il petit », c'est « qu'est-ce qui
 * pointe ». Une tablette de 900 px se pilote au doigt, et un portable de
 * 1280 px à tactile aussi ; la largeur ne le dit pas. `(hover: none)` le dit.
 */
export const TACTILE = '@media (hover: none)';

/**
 * Étend la zone touchable d'un contrôle à 44 px sans toucher à sa taille
 * visible.
 *
 * L'édition en place rend l'application dense et lisible, mais elle produit
 * mécaniquement des cibles de la taille de leur texte : 96 % des commandes de
 * l'atelier passaient sous 44 px sur mobile, certaines à 24 × 16. Plutôt que
 * de grossir la typographie — ce qui détruirait la densité — on superpose au
 * contrôle un rectangle transparent centré, qui reçoit le doigt.
 *
 * Deux contrôles voisins ne peuvent pas revendiquer 44 px chacun s'ils sont
 * espacés de moins : leurs zones se recouvrent, et c'est le dernier dans le
 * DOM qui gagne. D'où deux tailles dans l'application :
 *
 *   44 px — contrôles isolés : cellules de calendrier, lignes de liste,
 *           boutons de bas d'écran, crans du ressenti.
 *   32 px — gouttières et valeurs en ligne de l'atelier à la souris, où les
 *           commandes se suivent à 8 px. C'est au-dessus du plancher
 *           WCAG 2.5.8 (24 px), et c'est le maximum atteignable à cet
 *           écartement-là.
 *
 * Cet écartement n'est pas une fatalité : `hitAreaTactile`, plus bas, rend
 * les 44 px partout où la mise en page écarte d'abord les voisines au doigt.
 */
export const hitArea = (size = 44): SystemStyleObject => ({
  position: 'relative',
  _after: {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    width: '100%',
    height: '100%',
    // Ne capte que le pointeur : invisible, et jamais dans le flux.
    pointerEvents: 'auto',
  },
});

/**
 * La même zone, mais qui tient compte du doigt.
 *
 * Les 32 px de l'atelier sont un compromis de souris : à la précision d'un
 * curseur, ils suffisent. Au doigt, ils ne suffisent pas — et la raison qui
 * les plafonnait à 32 (les commandes voisines à 8 px) n'est pas une fatalité,
 * c'est une mise en page. Là où on écarte les commandes au tactile, la zone
 * peut reprendre ses 44 px sans recouvrir la voisine.
 *
 * D'où cette variante plutôt qu'un changement de `hitArea` : elle ne
 * s'applique qu'aux endroits dont on a d'abord écarté les voisins.
 */
export const hitAreaTactile = (souris = 32): SystemStyleObject => ({
  ...hitArea(souris),
  [TACTILE]: {
    '&::after': {
      minWidth: '44px',
      minHeight: '44px',
    },
  },
});

/**
 * L'écart à mettre entre deux commandes dont les zones font 44 px.
 *
 * Trois pictogrammes de 24 px espacés de 8 ne peuvent pas porter trois zones
 * de 44 : elles se recouvrent, et c'est le dernier du DOM qui reçoit le doigt
 * — donc « Supprimer » à la place de « Changer l'unité ». 24 + 20 met 44 px
 * entre deux centres : les zones se touchent sans jamais se croiser.
 *
 * On écarte plutôt qu'on ne grossit, et c'est un choix mesuré : avec des
 * boîtes de 40 px la gouttière passait de 103 à 136 px de large, la ligne de
 * l'atelier se cassait en deux niveaux et doublait de hauteur — 36 px à 77.
 * L'écartement coûte 9 px de large et garde l'atelier lisible.
 */
export const ecartTactile: SystemStyleObject = {
  [TACTILE]: { gap: '20px' },
};

/**
 * Le pas vertical minimal d'une liste de commandes au doigt.
 *
 * Même règle dans l'autre sens : deux lignes qui se suivent à 36 px ne
 * peuvent pas porter chacune une zone de 44.
 */
export const pasTactile: SystemStyleObject = {
  [TACTILE]: { minHeight: '44px' },
};
