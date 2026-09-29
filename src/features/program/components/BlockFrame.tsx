import { Box, Flex, HStack, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { TACTILE } from '@/shared/components/hitArea';
import { Text } from '@chakra-ui/react';
import { SessionBlock } from '@/shared/types';
import {
  BLOCK_ACCENT_COLOR,
  getBlockAccent,
  getBlockLabel,
} from '@/features/program/constants';

interface BlockFrameProps {
  block: SessionBlock;
  /** Free name: text in read mode, a field in edit mode. */
  name?: ReactNode;
  /** Settings: a summary in read mode, controls in edit mode. */
  config?: ReactNode;
  /** Les commandes du bloc, à droite de l'en-tête. Absentes en lecture. */
  gutter?: ReactNode;
  /** The exercise rows. */
  children: ReactNode;
  /** The block's instruction: text in read mode, a field in edit mode. */
  notes?: ReactNode;
  /** Below the exercises — "+ exercice" in edit mode. */
  footer?: ReactNode;
}

/**
 * Le cadre d'un bloc, identique que le coach l'écrive ou que le client le
 * lise.
 *
 * Le même objet portait deux habillages : une carte arrondie avec fond et
 * bordures côté client, un filet et de la typographie dans l'éditeur. Le
 * coach ne pouvait pas se fier à ce qu'il voyait pour savoir ce que son
 * client verrait, et chaque nouveau type de bloc se dessinait deux fois.
 *
 * La loi retenue est celle de l'éditeur : un filet dans l'accent du bloc, de
 * la typographie, et rien qui ressemble à une boîte. Ce qui change entre les
 * deux modes, c'est le contenu glissé dans les emplacements — jamais la
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
    /* Un point d'ancrage stable pour les mesures, comme
           `data-exercise-row` sur les lignes : sans lui, une sonde doit deviner
           le cadre d'un bloc en remontant le DOM depuis son titre. */
    data-block-type={block.type}
    borderLeftWidth="2px"
    borderLeftColor={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}
    pl={3}
    py={1}
  >
    {/* ── Header: type · free name · settings ── */}
    {/* Sa gouttière porte des zones de 44 px, comme celle de la
        première ligne juste en dessous : sans cet espacement, les deux se
        recouvraient de 5 px. */}
    <HStack
      justify="space-between"
      align="flex-start"
      gap={3}
      pb={1}
      /* L'espacement de 44 px vaut aussi entre la dernière ligne de
               l'en-tête et la première ligne d'exercice : 4 px les séparaient, et
               leurs zones se recouvraient de 5. */
      css={{ [TACTILE]: { minHeight: '44px', paddingBottom: '12px' } }}
    >
      {/* Le titre et les réglages partagent une colonne flexible : les
          réglages se replient quand ils ne tiennent plus, plutôt que de
          pousser la gouttière hors de l'écran. */}
      {/* Quand le titre, le nom et les réglages se replient, deux rangées
          de commandes se suivent à 4 px — et leurs zones de 44 px se
          recouvrent. Même règle que pour la gouttière : 20 px d'écart mettent
          44 px entre deux centres. */}
      <Flex
        flex={1}
        minW={0}
        wrap="wrap"
        align="baseline"
        gap={2}
        rowGap={1}
        css={{ [TACTILE]: { rowGap: '20px' } }}
      >
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
    {/* 4 px suffisent à l'œil, pas à un doigt : la consigne porte une
        zone de 44 px au tactile, qui mordait de 6 px sur « + exercice » juste
        au-dessus — et la dernière du DOM l'aurait emporté. */}
    {notes && (
      <Box mt={1} css={{ [TACTILE]: { marginTop: '10px' } }}>
        {notes}
      </Box>
    )}
  </Box>
);
