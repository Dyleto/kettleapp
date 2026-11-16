import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuPlay, LuX } from 'react-icons/lu';
import { Session } from '@/shared/types';
import { ActionButton, Chip, Mascot } from '@/kit';
import { SoundToggle } from '@/features/client/sound/SoundToggle';
import { BlockRhythm } from '@/features/client/sheet/BlockRhythm';
import { openingEyebrow } from '@/features/client/guided/outline';
import {
  blockMarker,
  blockTitle,
  distinctExerciseCount,
  estimatedMinutes,
} from '@/domain/session/measure';
import { CoachBubble } from '@/features/client/common/CoachBubble';
import { sessionName } from '@/domain/session/name';

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
            {sessionName(session)}
          </Text>
        </VStack>

        <HStack gap={1.5} wrap="wrap">
          <Chip tone="amber" size="lg">
            ≈&nbsp;{estimatedMinutes(session)}&nbsp;min
          </Chip>
          <Chip size="lg">
            {blocks.length}&nbsp;bloc{blocks.length > 1 ? 's' : ''}
          </Chip>
          <Chip size="lg">
            {exerciseCount}&nbsp;exercice{exerciseCount > 1 ? 's' : ''}
          </Chip>
        </HStack>

        {note && <CoachBubble>{note}</CoachBubble>}

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
                <BlockRhythm block={block} />
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
