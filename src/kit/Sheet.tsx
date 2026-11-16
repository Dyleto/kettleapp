import type { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

interface SheetProps {
  /** Le nom de la feuille pour un lecteur d'écran : ce qu'elle demande. */
  label: string;
  children: ReactNode;
  /**
   * Toucher le fond ferme la feuille. Absent quand elle pose une question
   * qui doit recevoir une réponse — fermer par mégarde la laisserait sans.
   */
  onDismiss?: () => void;
}

/**
 * Une feuille basse : ce qui monte du bas de l'écran pour une question ou
 * un réglage, sans quitter l'écran d'où l'on vient.
 *
 * Elle remplace les pleins écrans de confirmation. « Quitter le mode
 * guidé ? » prenait tout l'écran et faisait disparaître la séance derrière
 * lui : on ne savait plus ce qu'on s'apprêtait à quitter. Une feuille laisse
 * voir, assombri, ce qu'elle recouvre — et sous le pouce, parce que c'est là
 * que tombe la main sur un téléphone.
 *
 * Le mouvement se coupe quand l'appareil en demande moins.
 */
export const Sheet = ({ label, children, onDismiss }: SheetProps) => (
  <Box position="fixed" inset={0} zIndex={70}>
    <Box
      position="absolute"
      inset={0}
      bg="blackAlpha.700"
      animation="scrimFade 200ms ease-out"
      _motionReduce={{ animation: 'none' }}
      onClick={onDismiss}
      aria-hidden
    />
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={label}
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      mx="auto"
      maxW="560px"
      maxH="88dvh"
      overflowY="auto"
      bg="bg.surface"
      borderRadius="30px 30px 0 0"
      px={5}
      pt={3}
      pb="calc(env(safe-area-inset-bottom, 0px) + 26px)"
      display="flex"
      flexDirection="column"
      gap="14px"
      boxShadow="0 -24px 60px rgba(0, 0, 0, 0.5)"
      // Une feuille trop haute pour l'écran défile ; ses lignes ne se
      // tassent pas. Sans cela, téléphone couché, la colonne flexible
      // écrasait la dernière rangée de 32 à 20 px plutôt que de laisser
      // défiler — « Passer ce bloc » était rogné, et rien ne le disait.
      css={{ '& > *': { flexShrink: 0 } }}
      animation="sheetRise 380ms cubic-bezier(0.22, 1, 0.36, 1)"
      _motionReduce={{ animation: 'none' }}
    >
      <Box
        aria-hidden
        w="44px"
        h="5px"
        borderRadius="3px"
        bg="bg.raised"
        alignSelf="center"
        flexShrink={0}
      />
      {children}
    </Box>
  </Box>
);
