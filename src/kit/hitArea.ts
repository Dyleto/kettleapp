import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * La question posée n'est pas « l'écran est-il petit », c'est « qu'est-ce qui
 * pointe ». Une tablette de 900 px se pilote au doigt, un portable de 1280 px
 * à écran tactile aussi ; la largeur ne le dit pas. `(hover: none)`, si.
 */
export const TOUCH = '@media (hover: none)';

/**
 * Étend la zone tactile d'une commande à 44 px sans toucher à sa taille
 * visible.
 *
 * L'édition sur place rend l'application dense et lisible, mais elle produit
 * mécaniquement des cibles de la taille de leur texte : 96 % des commandes de
 * l'éditeur tombaient sous 44 px sur mobile, certaines à 24 × 16. Plutôt que
 * de grossir la typographie — ce qui détruirait la densité — on pose sur la
 * commande un rectangle transparent centré, et c'est lui qui reçoit le doigt.
 *
 * Deux commandes voisines ne peuvent pas revendiquer 44 px chacune quand
 * elles sont espacées de moins que cela : leurs zones se recouvrent, et la
 * dernière du DOM l'emporte. D'où deux tailles dans l'application :
 *
 *   44 px — commandes isolées : cases du calendrier, lignes de liste, boutons
 *           de bas d'écran, crans de l'échelle d'effort.
 *   32 px — les gouttières de l'éditeur et les valeurs en ligne sous une
 *           souris, où les commandes se suivent à 8 px. C'est au-dessus du
 *           plancher WCAG 2.5.8 (24 px), et c'est le maximum atteignable à
 *           cet espacement.
 *
 * Cet espacement n'est pas une fatalité : `touchHitArea`, plus bas, rend
 * les 44 px partout où la mise en page écarte d'abord les voisines pour le
 * tactile.
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
    // Capture le pointeur, rien d'autre : invisible, et jamais dans le flux.
    pointerEvents: 'auto',
  },
});

/**
 * La même zone, mais à la mesure d'un doigt.
 *
 * Les 32 px de l'atelier sont un compromis de souris : à la précision d'un
 * curseur, ça suffit. Sous un doigt, non — et la raison qui plafonne à 32
 * (des commandes voisines espacées de 8 px) n'est pas une fatalité, c'est une
 * mise en page. Là où les commandes ont été écartées pour le tactile, la zone
 * peut reprendre ses 44 px sans recouvrir sa voisine.
 *
 * D'où cette variante plutôt qu'un changement de `hitArea` : elle ne
 * s'applique que là où les voisines ont d'abord été écartées.
 */
export const touchHitArea = (mouse = 32): SystemStyleObject => ({
  ...hitArea(mouse),
  [TOUCH]: {
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
 * de 44 px : elles se recouvrent, et la dernière du DOM reçoit le doigt — donc
 * « Supprimer » au lieu de « Changer l'unité ». 24 + 20 met 44 px entre deux
 * centres : les zones se touchent sans jamais se croiser.
 *
 * On écarte plutôt qu'on agrandit, et c'est un choix mesuré : avec des boîtes
 * de 40 px, la gouttière passait de 103 à 136 px de large, la ligne de
 * l'éditeur se cassait sur deux niveaux et doublait de hauteur — de 36 px à
 * 77. L'espacement coûte 9 px de largeur et garde l'éditeur lisible.
 */
export const touchGap: SystemStyleObject = {
  [TOUCH]: { gap: '20px' },
};

/**
 * L'écart vertical minimal d'une liste de commandes sous un doigt.
 *
 * La même règle dans l'autre sens : deux lignes qui se suivent à 36 px ne
 * peuvent pas porter chacune une zone de 44 px.
 */
export const touchRow: SystemStyleObject = {
  [TOUCH]: { minHeight: '44px' },
};
