import { Box, HStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/shared/components/hitArea';
import { Timer } from './Timer';

/**
 * Le repos entre deux séries, posé à l'intérieur de la liste.
 *
 * C'était un panneau plein écran : on cochait « Fait », et le bloc qu'on
 * était en train de lire disparaissait derrière un mur turquoise. Retour du
 * terrain : « pas agréable de se retrouver d'un coup avec un REPOS en pleine
 * page ». C'est aussi la même erreur que celle du déroulé page à page
 * partout ailleurs — mettre en scène une attente comme un événement.
 *
 * Un repos n'est pas un événement. C'est un intervalle entre deux séries, et
 * il appartient là où cet intervalle se trouve : entre la série qu'on vient
 * de cocher et celle qui vient. La liste reste lisible tout du long — on voit
 * ce qu'il reste, on relit la dose du mouvement suivant, on corrige une
 * charge — ce qui est exactement ce qu'on fait en attendant.
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
        color="session.rest"
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
    {/* Passer reste à une touche, et garde ses 44 px : c'est le geste de
        quelqu'un déjà revenu sur la barre. */}
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
