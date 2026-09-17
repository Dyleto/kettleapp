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
 * Une commande de gouttière, dimensionnée pour le doigt.
 *
 * Les pictogrammes de l'atelier font 11 à 13 px et leur bouton 20 : trois de
 * suite espacés de 8 px ne peuvent pas porter trois zones de 44 sans se
 * recouvrir — et c'est alors le dernier du DOM qui reçoit le doigt, donc
 * « Supprimer » à la place de « Changer l'unité ». On écarte d'abord, on
 * élargit ensuite : au tactile la boîte visible passe à 40 px, ce qui met
 * 48 px entre deux centres, et les 44 px tiennent sans se chevaucher.
 *
 * À la souris, rien ne change : la densité de l'atelier reste entière.
 */
export const gouttiereTactile = (souris = 32): SystemStyleObject => ({
  ...hitArea(souris),
  [TACTILE]: {
    // Un plancher, pas une taille : « durée » écrit en 10 px fait déjà 39 px,
    // et une largeur fixe l'aurait coupé.
    minWidth: '40px',
    minHeight: '40px',
    '&::after': {
      minWidth: '44px',
      minHeight: '44px',
    },
  },
});
