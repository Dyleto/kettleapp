import { useRef, useState, type ReactNode } from 'react';
import { Box, chakra, HStack, Text, VStack } from '@chakra-ui/react';
import { ActionButton, Dots, Mascot, Ring } from '@/kit';
import type { CoachVoice } from '@/features/client/common/coach';
import { EffortFace } from '@/features/client/end/EffortScale';

/** Les cinq visages du ressenti, le juste milieu touché. */
const Faces = () => (
  <HStack gap="8px" aria-hidden>
    {[1, 2, 3, 4, 5].map((value) => (
      <Box
        key={value}
        w="50px"
        h="50px"
        borderRadius="full"
        display="grid"
        placeItems="center"
        bg={value === 3 ? 'effort.target/20' : 'bg.surface'}
        color={value === 3 ? 'effort.target' : 'fg.muted'}
      >
        <EffortFace value={value} size={34} />
      </Box>
    ))}
  </HStack>
);

interface Card {
  art: ReactNode;
  title: string;
  line: string;
}

/** Ce que les trois cartes disent, selon le nom du coach. */
const cards = (coach: CoachVoice): Card[] => [
  {
    art: <Mascot mood="hello" size={150} />,
    title: `${coach.opening} prépare ton programme`,
    // « dans l'ordre qu'elle a choisi » accordait le coach : on ne connaît
    // pas son genre.
    line: 'Tes séances arrivent ici, dans l’ordre choisi pour toi.',
  },
  {
    art: (
      <Ring part={0.3} size={210} color="app.primary">
        <VStack gap="2px">
          <Text fontSize="52px" fontWeight="800" lineHeight="1">
            0:42
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Tour 3 sur 10
          </Text>
        </VStack>
      </Ring>
    ),
    title: 'Tu suis la séance, pas à pas',
    line: 'Le chrono, les séries, les repos : l’application compte pour toi.',
  },
  {
    art: <Faces />,
    title: 'Tu dis comment c’était',
    line: `Une touche à la fin. ${coach.opening} s’en sert pour régler la suite.`,
  },
];

/** Combien un doigt doit glisser, en pixels, pour changer de carte. */
const SWIPE = 50;

/**
 * Les trois cartes qu'un nouveau client voit avant son accueil : ce que
 * prépare son coach, ce que fait l'application pendant la séance, ce qu'on
 * lui demande à la fin.
 *
 * « Suivant », ou glisser ; « Passer » et « Commencer » mènent au même
 * endroit — la question du partage s'il ne l'a pas encore reçue, l'accueil
 * sinon —, et les cartes ne reviennent plus sur cet appareil. Sur grand
 * écran, la même carte, centrée dans 480 px.
 */
export const Welcome = ({
  coach,
  onDone,
}: {
  coach: CoachVoice;
  onDone: () => void;
}) => {
  const [index, setIndex] = useState(0);
  const all = cards(coach);
  const card = all[index];
  const last = index === all.length - 1;
  const start = useRef<number | null>(null);

  const go = (next: number) =>
    setIndex(Math.max(0, Math.min(all.length - 1, next)));

  return (
    <Box minH="100dvh" bg="bg.canvas" display="flex" justifyContent="center">
      <VStack
        as="section"
        aria-label={`Bienvenue, ${index + 1} sur ${all.length}`}
        w="full"
        maxW="480px"
        minH="100dvh"
        px={5}
        pt="12px"
        pb="calc(env(safe-area-inset-bottom, 0px) + 20px)"
        gap={0}
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const moved = e.clientX - start.current;
          start.current = null;
          if (moved <= -SWIPE) go(index + 1);
          else if (moved >= SWIPE) go(index - 1);
        }}
        data-welcome={index + 1}
      >
        <HStack w="full" justify="flex-end" minH="44px">
          <chakra.button
            type="button"
            onClick={onDone}
            minH="44px"
            px="8px"
            color="fg.muted"
            fontSize="sm"
            fontWeight="600"
            _hover={{ color: 'fg' }}
          >
            Passer
          </chakra.button>
        </HStack>
        <VStack
          flex={1}
          justify="center"
          gap="22px"
          textAlign="center"
          w="full"
        >
          <Box h="220px" display="grid" placeItems="center">
            {card.art}
          </Box>
          <Text
            as="h1"
            fontWeight="800"
            fontSize={{ base: '32px', md: '34px' }}
            lineHeight="1.1"
          >
            {card.title}
          </Text>
          <Text fontSize="17px" color="fg.muted" maxW="320px">
            {card.line}
          </Text>
        </VStack>
        <VStack w="full" gap="14px">
          <Dots
            marks={all.map((_, i) =>
              i < index ? 'done' : i === index ? 'now' : 'todo'
            )}
          />
          <ActionButton
            w="full"
            onClick={() => (last ? onDone() : go(index + 1))}
          >
            {last ? 'Commencer' : 'Suivant'}
          </ActionButton>
        </VStack>
      </VStack>
    </Box>
  );
};
