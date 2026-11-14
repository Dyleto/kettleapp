import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuPlay, LuX } from 'react-icons/lu';
import { Session, SessionBlock } from '@/shared/types';
import {
  BLOCK_ACCENT_COLOR,
  blockSupportsRepsOnly,
  getBlockAccent,
} from '@/features/program/constants';
import { ActionButton } from '@/shared/components/ActionButton';
import { Mascot } from '@/shared/components/Mascot';
import { SoundToggle } from '../SoundToggle';
import { setsOfBlock } from '../../guidedSteps';
import {
  blockMarker,
  blockTitle,
  distinctExerciseCount,
  estimatedMinutes,
  openingEyebrow,
  openingTitle,
} from '../../guided/outline';

/** Une pastille de repère : la durée, le nombre de blocs, d'exercices. */
const Chip = ({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) => (
  <Box
    px="14px"
    py="8px"
    borderRadius="full"
    bg={accent ? 'app.primary.bg' : 'bg.surface'}
    color={accent ? 'app.primary.fg' : 'fg'}
    fontSize="14.5px"
    fontWeight="600"
    lineHeight="1.25"
    whiteSpace="nowrap"
  >
    {children}
  </Box>
);

/** Au-delà, les traits deviennent trop fins pour se compter : on montre le
 * rythme, pas un inventaire. */
const MAX_BARS = 12;

/**
 * Le dessin d'un bloc : un trait par tour ou par série.
 *
 * Il dit d'un coup d'œil si le bloc est une rafale ou une longue série, ce
 * qu'un nombre seul ne montre pas. Un Tabata alterne travail et repos ; les
 * autres blocs alignent leurs efforts.
 */
const Rhythm = ({ block }: { block: SessionBlock }) => {
  const color = BLOCK_ACCENT_COLOR[getBlockAccent(block.type)];
  const alternates =
    blockSupportsRepsOnly(block.type) && (block.restDuration ?? 0) > 0;
  const count = Math.min(
    MAX_BARS,
    Math.max(
      1,
      ['emom', 'every', 'tabata', 'onoff'].includes(block.type)
        ? (block.rounds ?? 1)
        : setsOfBlock(block).length
    )
  );

  return (
    <HStack gap="3px" h="18px" align="flex-end" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <HStack key={i} gap="3px" flex={1} h="full" align="flex-end">
          <Box flex={2} h="full" borderRadius="3px" bg={color} />
          {alternates && (
            <Box
              flex={1}
              h="55%"
              borderRadius="3px"
              bg="session.rest"
              opacity={0.8}
            />
          )}
        </HStack>
      ))}
    </HStack>
  );
};

interface OpeningProps {
  session: Session;
  onStart: () => void;
  onClose: () => void;
}

/**
 * L'ouverture : ce qui attend, avant de s'engager.
 *
 * Elle ne répète plus la fiche de séance, qu'on vient de quitter. Elle
 * répond à trois questions — combien de temps, quoi, et qu'a dit le coach —
 * puis laisse un seul geste sous le pouce.
 *
 * Le mot du coach ouvre le parcours parce que c'est le moment où il sert :
 * « aujourd'hui on garde deux répétitions en réserve » ne se relit pas en
 * plein effort. C'est aussi le seul endroit qui rappelle qu'un humain a
 * écrit cette séance.
 *
 * « 3 exercices » compte les mouvements distincts. L'écran annonçait « 12
 * exercices » pour une séance de sept : il comptait ses propres étapes.
 */
export const Opening = ({ session, onStart, onClose }: OpeningProps) => {
  const blocks = [...session.blocks].sort((a, b) => a.order - b.order);
  const eyebrow = openingEyebrow(session);
  const exerciseCount = distinctExerciseCount(session);
  const note = session.notes?.trim();

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Avant de commencer"
      position="fixed"
      inset={0}
      zIndex={50}
      bg="bg.canvas"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="space-between" px={5} pt="18px" pb={3} minH="66px">
        <Box
          as="button"
          aria-label="Revenir à la séance"
          display="grid"
          placeItems="center"
          w="44px"
          h="44px"
          borderRadius="full"
          color="fg"
          onClick={onClose}
        >
          <LuX size={20} />
        </Box>
        <SoundToggle />
      </HStack>

      {/* `flex: 1` sans `min-height: 0` ne rétrécit jamais sous son contenu :
          sur un écran posé à plat, le corps poussait le bouton hors de
          l'écran — il existait, figurait dans l'arbre, et ne pouvait pas être
          touché. `safe center` centre tant qu'il y a la place et se rabat en
          haut quand il n'y en a plus, au lieu de couper des deux côtés. */}
      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        justifyContent="safe center"
        align="stretch"
        gap={4}
        px={5}
        pb={4}
      >
        <Mascot mood="effort" size={92} />

        <VStack align="start" gap={2}>
          {eyebrow && (
            <Text
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="fg.muted"
            >
              {eyebrow}
            </Text>
          )}
          <Text
            as="h1"
            fontSize="44px"
            fontWeight="800"
            // Pas plus serré : à 1,02 la boîte de ligne était plus basse que
            // les lettres, et le bas des jambages était rogné par le
            // conteneur — quatre pixels, mesurés téléphone couché.
            lineHeight="1.15"
            letterSpacing="-0.01em"
            fontStretch="88%"
          >
            {openingTitle(session)}
          </Text>
        </VStack>

        <HStack gap={1.5} wrap="wrap">
          <Chip accent>≈&nbsp;{estimatedMinutes(session)}&nbsp;min</Chip>
          <Chip>
            {blocks.length}&nbsp;bloc{blocks.length > 1 ? 's' : ''}
          </Chip>
          <Chip>
            {exerciseCount}&nbsp;exercice{exerciseCount > 1 ? 's' : ''}
          </Chip>
        </HStack>

        {note && (
          <Box
            bg="bg.surface"
            borderRadius="20px 20px 20px 6px"
            px="14px"
            py={3}
          >
            <Text fontSize="xs" color="fg.muted" mb={1}>
              Ton coach te dit&nbsp;:
            </Text>
            <Text fontSize="15px" lineHeight="1.5" whiteSpace="pre-wrap">
              {note}
            </Text>
          </Box>
        )}

        <VStack
          as="ul"
          aria-label="Les blocs de la séance"
          align="stretch"
          gap="14px"
          bg="surface.card"
          borderRadius="card"
          p="18px"
          listStyleType="none"
        >
          {blocks.map((block) => (
            <HStack as="li" key={block._id ?? block.order} gap={3}>
              <VStack align="stretch" gap={1.5} flex={1} minW={0}>
                <Text fontWeight="bold" lineClamp={1}>
                  {blockTitle(block)}
                </Text>
                <Rhythm block={block} />
              </VStack>
              {/* Sur une seule ligne, quelle que soit sa longueur : c'est le
                  dessin du bloc qui cède la place, pas le repère qui se
                  replie — « 2 exercices · 8 min » passait sur deux lignes. */}
              <Text
                fontSize="13px"
                color="fg.muted"
                textAlign="right"
                whiteSpace="nowrap"
                flexShrink={0}
              >
                {blockMarker(block)}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>

      <Box px={5} pt={3} pb="22px">
        <ActionButton size="xl" w="full" onClick={onStart}>
          <LuPlay size={20} fill="currentColor" />
          C'est parti
        </ActionButton>
      </Box>
    </Box>
  );
};
