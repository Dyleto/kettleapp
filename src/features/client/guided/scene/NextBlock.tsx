import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import type { SessionBlock } from '@/shared/types';
import { Chip, LANDSCAPE, Ring } from '@/kit';
import { blockMarker, blockTitle } from '@/domain/session/measure';
import { exerciseDose } from '@/domain/session/dose';
import { sortByOrder } from '@/domain/session/sets';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { BlockRhythm } from '@/features/client/sheet/BlockRhythm';
import { useCountdown } from '@/features/client/guided/useCountdown';
import { useScenePaused } from '@/features/client/guided/PauseContext';
import { ExerciseLines } from './ExerciseLines';

/** Trois secondes : le temps de lire le nom du bloc et de reposer le regard
 * sur sa kettlebell, pas assez pour qu'on attende. */
const SECONDS = 3;

interface NextBlockProps {
  /** Ce qui vient de finir : « Bloc 1 terminé · 8 tours ». */
  outcome: string;
  /** « Bloc 2 sur 3 ». */
  rank: string;
  /** Le bloc qui vient. */
  block: SessionBlock;
  lastPerformance?: Map<string, LastPerformance>;
  onDone: () => void;
}

/**
 * L'écran « Bloc suivant » : trois secondes entre deux blocs, puis la suite
 * vient seule.
 *
 * On passait d'un bloc au suivant sous le pouce : la dernière série cochée,
 * le format changeait d'un coup, et rien ne disait ce qui venait de finir
 * ni ce qui commençait. Un EMOM recevait son « Lancer » du même doigt qui
 * venait de toucher « Série faite ».
 *
 * Aucun geste n'est demandé : qui veut lire lit, qui est déjà en place
 * touche l'écran, n'importe où. Le pied est un vrai bouton pour qui avance
 * au clavier ; le reste de l'écran répond au doigt. Un bloc chronométré
 * attend ensuite son « Lancer », comme toujours : ces trois secondes ne
 * remplacent pas le décompte de départ.
 *
 * La pause fige le décompte : on ne revient pas de la feuille pour trouver
 * le bloc suivant déjà commencé.
 */
export const NextBlock = ({
  outcome,
  rank,
  block,
  lastPerformance,
  onDone,
}: NextBlockProps) => {
  const frozen = useScenePaused();
  const { remaining } = useCountdown(SECONDS, { frozen, onComplete: onDone });
  const chips = blockMarker(block).split(' · ');

  return (
    <Box
      flex={1}
      minH={0}
      display="flex"
      flexDirection="column"
      // L'écran entier enchaîne : on le touche les mains prises, sans viser.
      onClick={onDone}
      cursor="pointer"
      role="region"
      aria-label="Bloc suivant"
      data-next-block
    >
      {/* Posé à plat, deux colonnes : le bloc à gauche, ses mouvements à
          droite. En une seule, 367 px de contenu pour 284 px visibles — un
          écran de trois secondes qu'il aurait fallu faire défiler. */}
      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        justifyContent="safe center"
        gap={4}
        px={5}
        pt={4}
        pb={2}
        css={{
          [LANDSCAPE]: {
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            alignContent: 'safe center',
            alignItems: 'center',
            columnGap: '24px',
            paddingTop: '8px',
          },
        }}
      >
        <VStack align="stretch" gap={4} css={{ [LANDSCAPE]: { gap: '10px' } }}>
          <HStack gap={2.5} color="session.rest">
            <LuCheck size={22} aria-hidden />
            <Text fontWeight="bold" data-block-outcome>
              {outcome}
            </Text>
          </HStack>
          <VStack align="start" gap={2}>
            <Text
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="fg.muted"
            >
              {rank}
            </Text>
            <Text
              as="h1"
              fontSize="48px"
              fontWeight="800"
              lineHeight="1.05"
              letterSpacing="-0.01em"
              fontStretch="88%"
              css={{ [LANDSCAPE]: { fontSize: '32px' } }}
            >
              {blockTitle(block)}
            </Text>
          </VStack>
          <HStack gap={1.5} wrap="wrap">
            {chips.map((chip) => (
              <Chip key={chip} size="lg">
                {chip}
              </Chip>
            ))}
          </HStack>
          <BlockRhythm block={block} height={26} />
        </VStack>
        {block.exercises.length > 0 && (
          <ExerciseLines
            exercises={sortByOrder(block.exercises)}
            lastPerformance={lastPerformance}
            running={false}
            doseOf={(exercise) => exerciseDose(block, exercise)}
          />
        )}
      </Box>

      <HStack
        as="button"
        justify="center"
        gap={3}
        px={4}
        pt={3}
        pb="22px"
        minH="44px"
        textAlign="left"
        aria-label={`Partir tout de suite — le bloc démarre dans ${remaining} s`}
        css={{ [LANDSCAPE]: { padding: '6px 12px' } }}
      >
        <Ring
          part={remaining / SECONDS}
          size={44}
          stroke={14}
          color="var(--chakra-colors-app-primary)"
        >
          <Text fontWeight="bold" aria-hidden>
            {Math.max(1, remaining)}
          </Text>
        </Ring>
        <Text color="fg.muted" fontSize="sm" aria-hidden>
          Ça repart tout seul. Touche l'écran pour partir tout de suite.
        </Text>
      </HStack>
    </Box>
  );
};
