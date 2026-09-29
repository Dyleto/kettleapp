import { Box, HStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/shared/components/hitArea';
import { Timer } from './Timer';

/**
 * The rest between two sets, laid inside the list.
 *
 * It used to be a full-screen panel: tick "Fait", and the block you were
 * reading vanished behind a wall of teal. From the field: "not pleasant to
 * suddenly get a full-page REST". It is also the same mistake the page-by-
 * page flow made everywhere else — staging a wait as an event.
 *
 * A rest is not an event. It is a gap between two sets, and it belongs where
 * that gap is: between the set just ticked and the one coming. The list
 * stays readable throughout — you can see what is left, reread the next
 * movement's dose, correct a load — which is exactly what people do while
 * they wait.
 */
export const RestStrip = ({
  duration,
  nextUp,
  onDone,
}: {
  duration: number;
  nextUp: string;
  onDone: () => void;
}) => (
  <HStack
    gap={3}
    px={4}
    py={2.5}
    my={1}
    minH="56px"
    borderRadius="lg"
    bg="session.rest/15"
    borderLeftWidth="3px"
    borderLeftColor="session.rest"
  >
    <Box flex={1} minW={0}>
      <Timer
        duration={duration}
        compact
        couleur="session.rest"
        track="blackAlpha.400"
        onComplete={onDone}
        title={
          <Text
            fontSize="2xs"
            letterSpacing="2px"
            textTransform="uppercase"
            fontWeight="800"
            color="session.rest"
          >
            Repos
            {nextUp ? (
              <Text
                as="span"
                color="fg.muted"
                letterSpacing="normal"
                textTransform="none"
                fontWeight="normal"
              >
                {' '}
                · ensuite {nextUp}
              </Text>
            ) : null}
          </Text>
        }
      />
    </Box>
    {/* Skipping stays one tap away, and keeps its 44 px: it is the gesture of
        someone already back on the bar. */}
    <Box
      as="button"
      onClick={onDone}
      flexShrink={0}
      alignSelf="center"
      color="session.rest"
      fontSize="sm"
      fontWeight="bold"
      css={hitArea(44)}
      _hover={{ color: 'fg' }}
    >
      Passer
    </Box>
  </HStack>
);
