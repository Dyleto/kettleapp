import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuMinus, LuPlay, LuPlus } from 'react-icons/lu';
import type { BlockExercise } from '@/shared/types';
import { ActionButton } from '@/shared/components/ActionButton';
import { Sheet } from '@/shared/components/Sheet';
import type { GuidedStep } from '../../guidedSteps';
import type { LastPerformance } from '../../lastPerformance';
import { playCue } from '../../sound';
import { useBlockClock } from '../../guided/useBlockClock';
import {
  chipTime,
  markCount,
  readAmrap,
  roundTarget,
  type AmrapReading,
  type RoundTarget,
} from '../../guided/amrap';
import { blockTitle } from '../../guided/outline';
import { LANDSCAPE } from '../guided/media';
import { Countdown } from './Countdown';
import { ExerciseLines } from './ExerciseLines';

type LoopStep = Extract<GuidedStep, { type: 'block' }>;

interface AmrapBlockProps {
  step: LoopStep;
  /** L'horloge part au montage : le décompte de l'ouverture vient de
   * tomber, ou ce bloc a déjà été lancé. */
  armed: boolean;
  /** Le premier départ : la reprise après une pause passera par un
   * décompte. */
  onArm: () => void;
  /** Les tours bouclés jusqu'ici. */
  rounds: number;
  onRoundsChange: (rounds: number) => void;
  /** Le score est validé : le bloc suivant, ou la fin de la séance. */
  onDone: () => void;
  /** Revenir au bloc d'avant, tant que l'horloge attend. */
  onPrevious?: () => void;
  /** Où poser la puce du temps : la ligne du haut de la scène. */
  headerSlot: HTMLElement | null;
  lastPerformance?: Map<string, LastPerformance>;
  onOpenDetail: (exercise: BlockExercise) => void;
}

/** Un appui long retire un tour ; plus court, c'est un tour de plus. */
const HOLD = 600;
const CORAL = 'session.work.fg';

const roundsLabel = (n: number) =>
  `${n}\u00A0tour${n > 1 ? 's' : ''} bouclé${n > 1 ? 's' : ''}`;

const targetText = (target: RoundTarget) =>
  target.low === target.high
    ? `${target.low}`
    : `${target.low} à ${target.high}`;

/**
 * L'AMRAP : autant de tours que possible dans le temps donné.
 *
 * Un seul geste pendant l'effort — taper le rond à chaque tour bouclé — et
 * rien d'autre à l'écran que ce qu'il faut relire : les mouvements, et
 * l'objectif du coach. Les champs « reps / kg » de chaque mouvement y
 * vivaient, avec un minuteur par ligne : personne ne saisit une charge
 * entre deux burpees, et la ligne du rameur affichait « rest 45 s », un
 * libellé que le renommage des identifiants avait réécrit en anglais. Les
 * charges se complètent à la fin.
 *
 * Le temps passe dans une puce, en haut : c'est le compteur de tours qu'on
 * regarde, pas l'horloge. À zéro, une feuille demande le score, prérempli
 * de ce qui a été tapé — on corrige un oubli plutôt que de recompter.
 */
export const AmrapBlock = ({
  step,
  armed,
  onArm,
  rounds,
  onRoundsChange,
  onDone,
  onPrevious,
  headerSlot,
  lastPerformance,
  onOpenDetail,
}: AmrapBlockProps) => {
  const duration = step.block.durationMinutes
    ? step.block.durationMinutes * 60
    : undefined;
  const target = roundTarget(step.block.notes);
  const [launching, setLaunching] = useState(false);
  const [ending, setEnding] = useState(false);
  const [reading, setReading] = useState<AmrapReading>(() =>
    readAmrap(duration, 0)
  );
  const previousRef = useRef(reading);

  const clock = useBlockClock({
    initialOffset: 0,
    armed,
    onBeat: (elapsed) => {
      const next = readAmrap(duration, elapsed);
      const previous = previousRef.current;
      previousRef.current = next;
      setReading(next);
      if (next.finished) {
        playCue('go');
        navigator.vibrate?.([120, 80, 120]);
        clock.stop();
        setEnding(true);
        return;
      }
      if (duration && next.seconds !== previous.seconds && next.seconds <= 3) {
        playCue('tick');
        navigator.vibrate?.(150);
      }
    },
  });
  const running = clock.running;

  const start = () => {
    const first = readAmrap(duration, 0);
    previousRef.current = first;
    setReading(first);
    setLaunching(false);
    clock.start(0);
    onArm();
  };

  const hot = running && !!duration && reading.seconds <= 3;
  const chip = (
    <Box
      role="timer"
      aria-label={`${duration ? 'Temps restant' : 'Temps passé'} — ${chipTime(
        reading.seconds
      )}`}
      px="15px"
      py="9px"
      borderRadius="full"
      bg={hot ? 'session.work/20' : 'app.primary.bg'}
      color={hot ? CORAL : 'app.primary.fg'}
      fontFamily="heading"
      fontSize="20px"
      fontWeight="800"
      lineHeight="1"
      fontVariantNumeric="tabular-nums"
      opacity={running || ending ? 1 : 0.6}
      flexShrink={0}
    >
      {chipTime(reading.seconds)}
    </Box>
  );

  // L'appui long : un tour en moins, pour un doigt qui a glissé. Le clic
  // qui suit le relâchement ne doit pas le rajouter aussitôt.
  const holdRef = useRef<number | null>(null);
  const heldRef = useRef(false);
  const press = () => {
    heldRef.current = false;
    holdRef.current = window.setTimeout(() => {
      heldRef.current = true;
      if (rounds > 0) {
        onRoundsChange(rounds - 1);
        navigator.vibrate?.([30, 40, 30]);
      }
    }, HOLD);
  };
  const release = () => {
    if (holdRef.current !== null) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  };

  const marks = markCount(target, rounds);

  return (
    <VStack flex={1} minH={0} align="stretch" gap={0}>
      {headerSlot && createPortal(chip, headerSlot)}

      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        px={5}
        pt={3}
        pb={2}
        display="flex"
        flexDirection="column"
        gap="14px"
        // Couché, deux colonnes : ce qu'il faut relire à gauche, qui défile
        // seul, et le rond à droite, toujours entier. Centrer verticalement
        // un contenu plus haut que sa boîte le rognait par le haut.
        css={{
          [LANDSCAPE]: {
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: '20px',
            paddingTop: '4px',
            overflowY: 'hidden',
          },
        }}
      >
        <VStack
          align="stretch"
          gap="14px"
          minW={0}
          css={{
            [LANDSCAPE]: {
              flex: '1 1 0',
              overflowY: 'auto',
              maxHeight: '100%',
              gap: '10px',
            },
          }}
        >
          {/* Téléphone couché, le haut de la scène disparaît : la puce
              passe ici. Un seul exemplaire est visible à la fois. */}
          <HStack
            display="none"
            justify="space-between"
            css={{ [LANDSCAPE]: { display: 'flex' } }}
          >
            <Text
              fontSize="xs"
              letterSpacing="2px"
              textTransform="uppercase"
              fontWeight="800"
              color="session.work"
            >
              {blockTitle(step.block)}
            </Text>
            {chip}
          </HStack>
          {step.block.notes?.trim() && (
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
                {step.block.notes.trim()}
              </Text>
            </Box>
          )}
          <ExerciseLines
            exercises={[...step.block.exercises].sort(
              (a, b) => a.order - b.order
            )}
            lastPerformance={lastPerformance}
            running={running}
            onOpenDetail={onOpenDetail}
          />
        </VStack>

        <Box flex={1} minH={2} css={{ [LANDSCAPE]: { display: 'none' } }} />

        <VStack
          gap={4}
          flexShrink={0}
          css={{
            [LANDSCAPE]: {
              flex: '1 1 0',
              justifyContent: 'center',
              gap: '6px',
            },
          }}
        >
          <VStack gap={2}>
            <HStack gap={2}>
              <Text fontSize="sm" color="fg.muted">
                {target
                  ? 'Tours bouclés · l’objectif du coach est encadré'
                  : 'Tours bouclés'}
              </Text>
            </HStack>
            <HStack gap="6px" aria-hidden>
              {Array.from({ length: marks }, (_, i) => {
                const inTarget =
                  !!target && i + 1 >= target.low && i + 1 <= target.high;
                return (
                  <Box
                    key={i}
                    w={marks > 8 ? '24px' : '36px'}
                    h="9px"
                    borderRadius="5px"
                    bg={i < rounds ? 'app.primary' : 'bg.surface'}
                    boxShadow={
                      inTarget ? '0 0 0 2px rgba(207, 159, 63, 0.55)' : 'none'
                    }
                    data-target={inTarget ? '' : undefined}
                  />
                );
              })}
            </HStack>
          </VStack>

          <Box
            as="button"
            aria-label={`Ajouter un tour — ${roundsLabel(rounds)}`}
            aria-disabled={!running || undefined}
            w="206px"
            h="206px"
            // Le halo déborde de 28 px : la marge le garde loin des repères.
            my="12px"
            borderRadius="full"
            bg="radial-gradient(circle at 35% 30%, {colors.app.primary.fg}, {colors.app.primary} 62%)"
            color="bg.canvas"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 0 0 13px rgba(207, 159, 63, 0.14), 0 0 0 28px rgba(207, 159, 63, 0.07)"
            opacity={running ? 1 : 0.4}
            transition="transform 0.1s"
            _active={{ transform: running ? 'scale(0.97)' : 'none' }}
            _motionReduce={{ transition: 'none' }}
            css={{
              touchAction: 'manipulation',
              userSelect: 'none',
              [LANDSCAPE]: { width: '150px', height: '150px' },
            }}
            onPointerDown={running ? press : undefined}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            onContextMenu={(event: React.MouseEvent) => event.preventDefault()}
            onClick={() => {
              if (!running) return;
              if (heldRef.current) {
                heldRef.current = false;
                return;
              }
              onRoundsChange(rounds + 1);
              navigator.vibrate?.(40);
            }}
          >
            <Text
              fontFamily="heading"
              fontSize="88px"
              fontWeight="800"
              fontStretch="76%"
              lineHeight="0.9"
              fontVariantNumeric="tabular-nums"
              css={{ [LANDSCAPE]: { fontSize: '64px' } }}
            >
              {rounds}
            </Text>
            <Text fontSize="16px" fontWeight="800">
              + 1 tour
            </Text>
          </Box>

          {/* L'appui long n'est pas à la portée de tout le monde : un
              lecteur d'écran ne le fait pas. Le même geste, en clair. */}
          <HStack gap={6} minH="44px">
            {rounds > 0 && (
              <Box
                as="button"
                minH="44px"
                fontSize="13px"
                fontWeight="bold"
                color="fg.muted"
                onClick={() => onRoundsChange(rounds - 1)}
                _hover={{ color: 'fg' }}
              >
                Retirer un tour
              </Box>
            )}
            {!duration && running && (
              <Box
                as="button"
                minH="44px"
                fontSize="13px"
                fontWeight="bold"
                color="app.primary.fg"
                onClick={() => {
                  clock.stop();
                  setEnding(true);
                }}
              >
                Terminer le bloc
              </Box>
            )}
          </HStack>
        </VStack>
      </Box>

      {!running && !ending && (
        <Box
          px={4}
          pt={2}
          pb={3}
          css={{ [LANDSCAPE]: { padding: '6px 12px' } }}
        >
          <VStack
            align="stretch"
            gap={0}
            css={{
              [LANDSCAPE]: {
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: '16px',
              },
            }}
          >
            <ActionButton
              size="xl"
              w="full"
              onClick={() => setLaunching(true)}
              css={{ [LANDSCAPE]: { minHeight: '52px', flex: 1 } }}
            >
              <LuPlay size={20} />
              Lancer
            </ActionButton>
            {onPrevious && (
              <Box
                as="button"
                alignSelf="flex-start"
                minH="44px"
                display="inline-flex"
                alignItems="center"
                fontSize="13px"
                fontWeight="bold"
                color="fg.muted"
                flexShrink={0}
                onClick={onPrevious}
                _hover={{ color: 'fg' }}
              >
                Bloc précédent
              </Box>
            )}
          </VStack>
        </Box>
      )}

      {launching && (
        <Countdown
          title={blockTitle(step.block)}
          detail={
            duration ? chipTime(duration).replace(/^0/, '') : 'sans limite'
          }
          onDone={start}
        />
      )}

      {ending && (
        <Sheet label={duration ? 'Temps écoulé' : 'Fin du bloc'}>
          <Text as="h2" fontSize="24px" fontWeight="750" lineHeight="1.08">
            {duration ? 'Temps écoulé' : 'Fin du bloc'}
          </Text>
          <Text color="fg.muted">
            Combien de tours as-tu bouclés&nbsp;? Le compteur a retenu ce que tu
            as tapé.
          </Text>
          <HStack justify="center" gap={5} py={2}>
            <StepButton
              label="Un tour de moins"
              disabled={rounds === 0}
              onClick={() => onRoundsChange(Math.max(0, rounds - 1))}
            >
              <LuMinus size={22} />
            </StepButton>
            <VStack gap={1} minW="110px">
              <Text
                fontFamily="heading"
                fontSize="56px"
                fontWeight="800"
                lineHeight="0.9"
                fontVariantNumeric="tabular-nums"
                aria-live="polite"
                aria-label={roundsLabel(rounds)}
              >
                {rounds}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                tour{rounds > 1 ? 's' : ''}
              </Text>
            </VStack>
            <StepButton
              label="Un tour de plus"
              onClick={() => onRoundsChange(rounds + 1)}
            >
              <LuPlus size={22} />
            </StepButton>
          </HStack>
          {target && (
            <Text textAlign="center" fontSize="sm" color="fg.muted">
              l’objectif était {targetText(target)}
            </Text>
          )}
          <ActionButton size="xl" w="full" onClick={onDone}>
            Valider
          </ActionButton>
        </Sheet>
      )}
    </VStack>
  );
};

/** Un bouton rond du réglage du score : 60 px, pour un pouce essoufflé. */
const StepButton = ({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Box
    as="button"
    aria-label={label}
    aria-disabled={disabled || undefined}
    w="60px"
    h="60px"
    borderRadius="full"
    display="grid"
    placeItems="center"
    bg="bg.canvas"
    color="fg"
    opacity={disabled ? 0.4 : 1}
    onClick={disabled ? undefined : onClick}
  >
    {children}
  </Box>
);
