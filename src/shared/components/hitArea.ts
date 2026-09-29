import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * La question posée n'est pas « l'écran est-il petit », c'est « qu'est-ce qui
 * pointe ». Une tablette de 900 px se pilote au doigt, un portable de 1280 px
 * à écran tactile aussi ; la largeur ne le dit pas. `(hover: none)`, si.
 */
export const TACTILE = '@media (hover: none)';

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
 * Cet espacement n'est pas une fatalité : `hitAreaTactile`, plus bas, rend
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
 * The gap to put between two controls whose zones are 44 px.
 *
 * Three 24 px pictograms spaced 8 apart cannot carry three 44 px zones: they
 * overlap, and the last one in the DOM receives the finger — so "Supprimer"
 * instead of "Changer l'unité". 24 + 20 puts 44 px between two centres: the
 * zones touch without ever crossing.
 *
 * We push apart rather than enlarge, and that is a measured choice: with
 * 40 px boxes the gutter went from 103 to 136 px wide, the editor's row broke
 * into two levels and doubled in height — 36 px to 77. The spacing costs 9 px
 * of width and keeps the editor readable.
 */
export const ecartTactile: SystemStyleObject = {
  [TACTILE]: { gap: '20px' },
};

/**
 * L'écart vertical minimal d'une liste de commandes sous un doigt.
 *
 * La même règle dans l'autre sens : deux lignes qui se suivent à 36 px ne
 * peuvent pas porter chacune une zone de 44 px.
 */
export const pasTactile: SystemStyleObject = {
  [TACTILE]: { minHeight: '44px' },
};
