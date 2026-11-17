import { Box, HStack, Text, VisuallyHidden, VStack } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import type { Session } from '@/shared/types';
import { blockMarker, blockTitle } from '@/domain/session/measure';
import { sortByOrder } from '@/domain/session/sets';
import { WIDE } from '@/kit';

/**
 * Le plan de la séance, sur grand écran : ses blocs, ce qui est fait, ce
 * qui vient.
 *
 * Le téléphone n'a pas la place de le montrer à côté de la série ; la barre
 * du haut en tient lieu, un segment par bloc. Un grand écran l'a, et une
 * barre lue à trois mètres ne dit pas les noms. Les raccourcis s'y lisent
 * aussi : c'est là qu'on a un clavier.
 */
export const SessionOutline = ({
  session,
  current,
}: {
  session: Pick<Session, 'blocks'>;
  /** Le bloc en cours, parmi les blocs rangés par ordre. */
  current: number;
}) => {
  const blocks = sortByOrder(session.blocks);
  return (
    <VStack
      as="section"
      aria-label="La séance"
      align="stretch"
      gap={3.5}
      bg="bg.surface"
      borderRadius="xl"
      px={4}
      py={4}
      display="none"
      css={{ [WIDE]: { display: 'flex' } }}
      data-session-outline
    >
      <Text
        fontSize="11px"
        fontWeight="800"
        letterSpacing="0.14em"
        textTransform="uppercase"
        color="fg.muted"
      >
        La séance
      </Text>
      <VStack as="ol" align="stretch" gap={3} listStyleType="none">
        {blocks.map((block, i) => {
          const state = i < current ? 'done' : i === current ? 'now' : 'todo';
          return (
            <HStack
              as="li"
              key={block._id ?? block.order}
              gap={3}
              aria-current={state === 'now' ? 'step' : undefined}
              data-outline-state={state}
            >
              <Box
                w="26px"
                h="26px"
                borderRadius="full"
                display="grid"
                placeItems="center"
                flexShrink={0}
                bg={
                  state === 'done'
                    ? 'session.rest'
                    : state === 'now'
                      ? 'app.primary'
                      : 'bg.canvas'
                }
                color={state === 'todo' ? 'fg.muted' : 'bg.canvas'}
                fontSize="12px"
                fontWeight="bold"
                aria-hidden
              >
                {state === 'done' ? <LuCheck size={16} /> : i + 1}
              </Box>
              <VStack align="start" gap={0.5} minW={0}>
                <Text fontWeight="bold" lineClamp={1}>
                  {blockTitle(block)}
                  <VisuallyHidden>
                    {state === 'done'
                      ? ' — fait'
                      : state === 'now'
                        ? ' — en cours'
                        : ''}
                  </VisuallyHidden>
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {blockMarker(block)}
                </Text>
              </VStack>
            </HStack>
          );
        })}
      </VStack>
      <Box h="1px" bg="line" />
      <Text fontSize="sm" color="fg.muted" data-shortcuts>
        Espace : valider · P : pause · ← → : précédent, suivant
      </Text>
    </VStack>
  );
};
