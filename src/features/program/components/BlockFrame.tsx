import { Box, Flex, HStack, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { TACTILE } from '@/components/hitArea';
import { Text } from '@chakra-ui/react';
import { SessionBlock } from '@/types';
import {
  BLOCK_ACCENT_COLOR,
  getBlockAccent,
  getBlockLabel,
} from '@/features/program/constants';

interface BlockFrameProps {
  block: SessionBlock;
  /** Nom libre : du texte en lecture, un champ en édition. */
  name?: ReactNode;
  /** Réglages : un résumé en lecture, des contrôles en édition. */
  config?: ReactNode;
  /** Commandes de bloc, à droite de l'en-tête. Absent en lecture. */
  gutter?: ReactNode;
  /** Les lignes d'exercices. */
  children: ReactNode;
  /** Consigne du bloc : du texte en lecture, un champ en édition. */
  notes?: ReactNode;
  /** Sous les exercices — « + exercice » en édition. */
  footer?: ReactNode;
}

/**
 * La charpente d'un bloc, identique que le coach l'écrive ou que le client
 * le lise.
 *
 * Le même objet portait auparavant deux habillages : une carte arrondie avec
 * fond et bordures côté client, un filet et de la typographie côté atelier.
 * Le coach ne pouvait pas se fier à ce qu'il voyait pour savoir ce que son
 * client verrait, et chaque nouveau type de bloc se dessinait deux fois.
 *
 * La loi retenue est celle de l'atelier : un filet dans l'accent du bloc, de
 * la typographie, et rien qui ressemble à une boîte. Ce qui change entre les
 * deux modes, ce sont les contenus glissés dans les emplacements — jamais la
 * géométrie.
 */
export const BlockFrame = ({
  block,
  name,
  config,
  gutter,
  children,
  notes,
  footer,
}: BlockFrameProps) => (
  <Box
    className="group"
    borderLeftWidth="2px"
    borderLeftColor={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}
    pl={3}
    py={1}
  >
    {/* ── En-tête : type · nom libre · réglages ── */}
    <HStack justify="space-between" align="flex-start" gap={3} pb={1}>
      {/* Titre et réglages partagent une colonne souple : les réglages
          passent à la ligne quand ils ne tiennent plus, plutôt que de
          pousser la gouttière hors de l'écran. */}
      <Flex flex={1} minW={0} wrap="wrap" align="baseline" gap={2} rowGap={1}>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg"
          textTransform="uppercase"
          letterSpacing="wider"
          flexShrink={0}
        >
          {getBlockLabel(block.type)}
        </Text>
        {name}
        {config && <Box minW={0}>{config}</Box>}
      </Flex>

      {gutter && (
        <HStack gap={1} flexShrink={0} align="flex-start">
          {gutter}
        </HStack>
      )}
    </HStack>

    <VStack align="stretch" gap={0}>
      {children}
    </VStack>

    {footer && <Box pt={1.5}>{footer}</Box>}
    {/* 4 px suffisent à l'œil, pas au doigt : la consigne porte une zone de
        44 px au tactile, qui mordait de 6 px sur « + exercice » juste
        au-dessus — et c'est le dernier du DOM qui aurait gagné. */}
    {notes && (
      <Box mt={1} css={{ [TACTILE]: { marginTop: '10px' } }}>
        {notes}
      </Box>
    )}
  </Box>
);
