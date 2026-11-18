import { Box, chakra, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { LuEllipsis } from 'react-icons/lu';
import { TOUCH } from '@/kit';
import { SessionBlock } from '@/shared/types';
import { BLOCK_ACCENT_COLOR, getBlockAccent } from '@/domain/session/blocks';
import { formatName } from '@/domain/session/dose';

interface BlockFrameProps {
  block: SessionBlock;
  /** La poignée pour glisser le bloc, devant son nom. Absente en lecture. */
  handle?: ReactNode;
  /** Nom libre : une pastille à contour. */
  name?: ReactNode;
  /** Réglages : des pastilles ambre. */
  config?: ReactNode;
  /** Les commandes du bloc, à droite de l'en-tête. Absentes en lecture. */
  gutter?: ReactNode;
  /**
   * Sur téléphone, l'en-tête entier ouvre les réglages du bloc : des
   * pastilles de 26 px sous un pouce, c'était viser. Le nom donné ici est
   * celui du bouton.
   */
  headerAction?: { label: string; onPress: () => void };
  /** Les lignes d'exercice. */
  children: ReactNode;
  /** La consigne du bloc, en bulle sous l'en-tête. */
  notes?: ReactNode;
  /** Sous les exercices — « + exercice » en édition. */
  footer?: ReactNode;
}

/**
 * Le cadre d'un bloc, que le coach l'écrive ou le relise dans un bilan.
 *
 * Une carte, et non plus un filet : la maquette pose chaque bloc sur son
 * fond, l'accent de sa famille en bordure gauche, l'en-tête en capitales
 * suivi de ses pastilles, la consigne en bulle avant les exercices — c'est
 * ce qu'on lit avant de les faire. Les deux usages glissent leur contenu
 * dans les mêmes emplacements ; la géométrie, elle, ne change pas.
 */
export const BlockFrame = ({
  block,
  handle,
  name,
  config,
  gutter,
  headerAction,
  children,
  notes,
  footer,
}: BlockFrameProps) => {
  const title = (
    <Text
      as="span"
      fontSize="12.5px"
      fontWeight="800"
      color="fg"
      textTransform="uppercase"
      letterSpacing="0.1em"
      flexShrink={0}
    >
      {formatName(block.type)}
    </Text>
  );

  // Le titre et les pastilles partagent une colonne flexible : elles se
  // replient quand elles ne tiennent plus, plutôt que de pousser la
  // gouttière hors de l'écran. Repliées, deux rangées de pastilles se
  // suivent à 20 px au tactile : leurs zones de 44 px ne se recouvrent pas.
  const heading = (
    <Flex
      flex={1}
      minW={0}
      wrap="wrap"
      align="center"
      gap="8px"
      rowGap="6px"
      css={{ [TOUCH]: { rowGap: '20px' } }}
    >
      {title}
      {name}
      {config}
    </Flex>
  );

  return (
    <Box
      className="group"
      // Un point d'ancrage stable pour les mesures : sans lui, une sonde
      // doit deviner le cadre d'un bloc en remontant le DOM depuis son titre.
      data-block-type={block.type}
      bg="bg.surface"
      borderRadius="20px"
      boxShadow={`inset 5px 0 0 {colors.${BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}}`}
    >
      <HStack gap="8px" pl="20px" pr="12px" pt="12px" pb="8px" align="center">
        {handle}
        {headerAction ? (
          <chakra.button
            type="button"
            aria-label={headerAction.label}
            onClick={headerAction.onPress}
            display="flex"
            alignItems="center"
            gap="8px"
            flex={1}
            minW={0}
            minH="44px"
            textAlign="left"
          >
            {heading}
            <Box color="fg.muted" flexShrink={0} aria-hidden>
              <LuEllipsis size={18} />
            </Box>
          </chakra.button>
        ) : (
          <Box flex={1} minW={0} minH="32px" display="flex" alignItems="center">
            {heading}
          </Box>
        )}
        {gutter && (
          <HStack gap={1} flexShrink={0}>
            {gutter}
          </HStack>
        )}
      </HStack>

      {notes && (
        <Box px="18px" pl="20px" pb="10px">
          {notes}
        </Box>
      )}

      <VStack align="stretch" gap={0}>
        {children}
      </VStack>

      {footer && (
        <Box
          borderTopWidth="1px"
          borderColor="line"
          pl="20px"
          pr="18px"
          py="2px"
        >
          {footer}
        </Box>
      )}
    </Box>
  );
};
