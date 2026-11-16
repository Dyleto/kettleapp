import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuInfo, LuMinus, LuPlay, LuPlus } from 'react-icons/lu';
import type { BlockExercise } from '@/shared/types';
import { ActionButton } from '@/shared/components/ActionButton';
import { Sheet } from '@/shared/components/Sheet';
import { formatDuration } from '@/shared/utils/duration';
import type { GuidedStep } from '../../guidedSteps';
import type { LastPerformance } from '../../lastPerformance';
import { playCue } from '../../sound';
import { useBlockClock } from '../../guided/useBlockClock';
import { chipTime, readAmrap, type AmrapReading } from '../../guided/amrap';
import {
  doneUpTo,
  ladderState,
  minutesSeconds,
  rungSets,
  stepHeight,
} from '../../guided/ladder';
import { formatWeight, heaviest } from '../../guided/load';
import { blockTitle } from '../../guided/outline';
import { LANDSCAPE } from '../guided/media';
import { Countdown } from './Countdown';
import { RestHero } from './RestHero';
import { Ring } from './Ring';
import { useCoachVoice } from '../../coach';

type ListStep = Extract<GuidedStep, { type: 'block' }>;

/** Ce qu'une échelle bornée a donné : paliers faits, temps au chrono. */
export interface LadderResult {
  rungs: number;
  seconds: number;
}

interface LadderBlockProps {
  step: ListStep;
  /** Les séries faites de toute la séance. */
  done: readonly string[];
  /** Remplace les séries faites : « Palier fait », une marche touchée. */
  onDoneChange: (next: string[]) => void;
  /** Le résultat d'une échelle bornée, posé par sa feuille de fin. */
  onResult: (result: LadderResult) => void;
  /** Le bloc est fini : le suivant, ou la fin de la séance. */
  onFinish: () => void;
  /** Le dernier bloc : finir y reste un geste délibéré. */
  isLastBlock: boolean;
  /** L'horloge part au montage : le décompte de l'ouverture vient de
   * tomber, ou ce bloc a déjà été lancé. */
  armed: boolean;
  onArm: () => void;
  /** Revenir au bloc d'avant, tant que rien n'est fait ici. */
  onPrevious?: () => void;
  /** Où poser la puce du temps : la ligne du haut de la scène. */
  headerSlot: HTMLElement | null;
  lastPerformance?: Map<string, LastPerformance>;
  onOpenDetail: (exercise: BlockExercise) => void;
}

/** Corriger le temps au chrono se fait par quinze secondes. */
const TIME_STEP = 15;
const CORAL = 'session.work.fg';

type Ending = { kind: 'timeUp' | 'stopped' | 'complete'; seconds: number };

/**
 * L'échelle : les paliers en haut, la dose du palier en grand, les
 * mouvements dessous, et un chrono quand le coach a fixé une limite.
 *
 * C'était une liste de paliers à cocher, mouvement par mouvement : deux
 * gestes pour un palier à deux mouvements, chacun nommé « Fait », et aucun
 * chrono. Ici « Palier fait » coche le palier entier — c'est ce qu'il est,
 * une dose pour tous les mouvements — et la marche suivante s'allume.
 *
 * Avec une limite, le chrono descend depuis elle ; à la fin, une feuille
 * demande le palier atteint et le temps, que le coach lira « palier 5 sur 7
 * en 12:00 ». Sans limite, ni chrono ni feuille : l'échelle se coche.
 */
export const LadderBlock = ({
  step,
  done,
  onDoneChange,
  onResult,
  onFinish,
  isLastBlock,
  armed,
  onArm,
  onPrevious,
  headerSlot,
  lastPerformance,
  onOpenDetail,
}: LadderBlockProps) => {
  const sets = step.sets;
  const reps = step.block.repsScheme ?? [];
  const limit = step.block.durationMinutes
    ? step.block.durationMinutes * 60
    : undefined;
  const doneKeys = new Set(done);
  const state = ladderState(sets, doneKeys);
  const allDone = state.count > 0 && state.done === state.count;
  const exercises = [...step.block.exercises].sort((a, b) => a.order - b.order);

  const [launching, setLaunching] = useState(false);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [rest, setRest] = useState<{ rung: number; bonus: number } | null>(
    null
  );
  const [reading, setReading] = useState<AmrapReading>(() =>
    readAmrap(limit, 0)
  );
  const previousRef = useRef(reading);
  /** Le temps écoulé au dernier battement, en millisecondes. */
  const elapsedRef = useRef(0);

  const clock = useBlockClock({
    initialOffset: 0,
    armed: armed && !!limit,
    onBeat: (elapsed) => {
      elapsedRef.current = elapsed;
      const next = readAmrap(limit, elapsed);
      const previous = previousRef.current;
      previousRef.current = next;
      setReading(next);
      if (next.finished) {
        playCue('go');
        navigator.vibrate?.([120, 80, 120]);
        clock.stop();
        setRest(null);
        setEnding({ kind: 'timeUp', seconds: limit ?? 0 });
        return;
      }
      if (next.seconds !== previous.seconds && next.seconds <= 3) {
        playCue('tick');
        navigator.vibrate?.(150);
      }
    },
  });
  const running = clock.running;
  const waiting = !!limit && !running && !ending;

  const start = () => {
    const first = readAmrap(limit, 0);
    previousRef.current = first;
    elapsedRef.current = 0;
    setReading(first);
    setLaunching(false);
    clock.start(0);
    onArm();
  };

  const elapsedSeconds = () => Math.floor(elapsedRef.current / 1000);

  // « Palier fait » : le palier entier, tous ses mouvements. Le dernier
  // arrête le chrono — l'échelle est bouclée, et c'est son temps.
  const markRung = () => {
    const rung = state.current;
    if (rung > state.count) return;
    const keys = rungSets(sets, rung).map((set) => set.key);
    onDoneChange([...done.filter((key) => !keys.includes(key)), ...keys]);
    navigator.vibrate?.(40);
    const nowDone = state.done + 1;
    if (nowDone >= state.count) {
      if (limit) {
        clock.stop();
        setEnding({ kind: 'complete', seconds: elapsedSeconds() });
      } else if (!isLastBlock) {
        onFinish();
      }
      return;
    }
    if (step.block.restBetweenRounds) setRest({ rung: rung + 1, bonus: 0 });
  };

  // Se recaler : tout ce qui est sous la marche touchée est fait, rien
  // au-dessus.
  const goToRung = (rung: number) => {
    setRest(null);
    onDoneChange(doneUpTo(sets, done, rung));
  };

  const stop = () => {
    clock.stop();
    setRest(null);
    setEnding({ kind: 'stopped', seconds: elapsedSeconds() });
  };

  const hot = running && reading.seconds <= 3;
  const chip = limit ? (
    <Box
      role="timer"
      aria-label={`Temps restant — ${chipTime(reading.seconds)}`}
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
  ) : null;

  const shownRung = Math.min(state.current, state.count);
  const dose = reps[shownRung - 1];

  return (
    <VStack flex={1} minH={0} align="stretch" gap={0}>
      {headerSlot && chip && createPortal(chip, headerSlot)}

      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        align="stretch"
        gap={4}
        px={5}
        pt={3}
        pb={2}
      >
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

        <HStack justify="space-between" gap={3}>
          <Text
            fontSize="11px"
            fontWeight="800"
            letterSpacing="0.14em"
            textTransform="uppercase"
            lineHeight="1"
            color="app.primary.fg"
          >
            {allDone
              ? `${state.count} paliers sur ${state.count}`
              : `Palier ${shownRung} sur ${state.count}`}
          </Text>
          {limit && (
            <Text fontSize="sm" color="fg.muted">
              limite {formatDuration(limit)}
            </Text>
          )}
        </HStack>

        <Rungs
          reps={reps}
          markOf={(rung) =>
            rungSets(sets, rung).every((set) => doneKeys.has(set.key))
              ? 'done'
              : rung === state.current
                ? 'now'
                : 'todo'
          }
          onPick={waiting ? undefined : goToRung}
        />

        {rest ? (
          <RestHero
            key={rest.rung}
            duration={step.block.restBetweenRounds ?? 0}
            bonus={rest.bonus}
            nextTitle={`Palier ${rest.rung} sur ${state.count}`}
            nextDetail={
              reps[rest.rung - 1] !== undefined
                ? `${reps[rest.rung - 1]} reps`
                : ''
            }
            onDone={() => setRest(null)}
          />
        ) : (
          dose !== undefined &&
          !allDone && (
            <HStack align="baseline" gap={3} justify="center">
              <Text
                fontFamily="heading"
                fontSize="130px"
                fontWeight="800"
                fontStretch="76%"
                lineHeight="0.9"
                fontVariantNumeric="tabular-nums"
                css={{ [LANDSCAPE]: { fontSize: '84px' } }}
              >
                {dose}
              </Text>
              <Text
                fontFamily="heading"
                fontSize="28px"
                fontWeight="700"
                color="fg.muted"
              >
                reps
              </Text>
            </HStack>
          )
        )}

        <VStack
          align="stretch"
          gap={3}
          bg="bg.surface"
          borderRadius="xl"
          px={4}
          py={3.5}
        >
          {exercises.map((exercise, i) => {
            const load = heaviest(
              lastPerformance?.get(exercise.exercise._id)?.sets
            );
            const hasDetail =
              !!exercise.note?.trim() ||
              !!exercise.exercise.description?.trim() ||
              !!exercise.exercise.videoUrl?.trim();
            // Un mouvement à durée garde la sienne à chaque palier : c'est
            // elle qu'on lit à droite, plutôt qu'une charge.
            const aside = exercise.duration
              ? formatDuration(exercise.duration)
              : load !== undefined
                ? `${formatWeight(load)}\u00A0kg`
                : '';
            return (
              <HStack
                key={`${exercise.order}-${exercise.exercise._id}`}
                gap={3}
                borderTopWidth={i === 0 ? 0 : '1px'}
                borderColor="line"
                pt={i === 0 ? 0 : 3}
              >
                {hasDetail ? (
                  <Box
                    as="button"
                    textAlign="left"
                    minH="44px"
                    my="-10px"
                    flex={1}
                    minW={0}
                    aria-label={`Voir la consigne — ${exercise.exercise.name}`}
                    onClick={() => onOpenDetail(exercise)}
                  >
                    <HStack gap={1.5}>
                      <Text fontSize="19px" fontWeight="bold">
                        {exercise.exercise.name}
                      </Text>
                      <Box color="app.primary" flexShrink={0}>
                        <LuInfo size={15} />
                      </Box>
                    </HStack>
                  </Box>
                ) : (
                  <Text fontSize="19px" fontWeight="bold" flex={1} minW={0}>
                    {exercise.exercise.name}
                  </Text>
                )}
                {aside && (
                  <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                    {aside}
                  </Text>
                )}
              </HStack>
            );
          })}
        </VStack>
      </VStack>

      {/* Le pied : « Lancer » tant qu'une limite attend, le repos pendant
          qu'on souffle, sinon « Palier fait ». */}
      {!ending && (
        <VStack
          align="stretch"
          gap={0}
          px={4}
          pt={2}
          pb={3}
          css={{ [LANDSCAPE]: { padding: '6px 12px' } }}
        >
          {waiting ? (
            <>
              <ActionButton
                size="xl"
                w="full"
                onClick={() => setLaunching(true)}
              >
                <LuPlay size={20} />
                Lancer
              </ActionButton>
              {onPrevious && (
                <FooterLink onClick={onPrevious}>Bloc précédent</FooterLink>
              )}
            </>
          ) : rest ? (
            <HStack gap={2.5}>
              <ActionButton
                tone="ghost"
                size="xl"
                aria-label="Quinze secondes de repos de plus"
                onClick={() => setRest({ ...rest, bonus: rest.bonus + 15 })}
              >
                + 15 s
              </ActionButton>
              <ActionButton
                tone="soft"
                size="xl"
                flex={1}
                onClick={() => setRest(null)}
              >
                Passer
              </ActionButton>
            </HStack>
          ) : allDone ? (
            // Sans limite, au dernier bloc : finir la séance reste un geste.
            <ActionButton size="xl" w="full" onClick={onFinish}>
              Terminer
            </ActionButton>
          ) : (
            <>
              <ActionButton size="xl" w="full" onClick={markRung}>
                <LuCheck size={22} />
                Palier fait
              </ActionButton>
              <HStack justify="space-between" gap={4}>
                {state.done > 0 ? (
                  <FooterLink onClick={() => goToRung(state.current - 1)}>
                    Palier précédent
                  </FooterLink>
                ) : onPrevious ? (
                  <FooterLink onClick={onPrevious}>Bloc précédent</FooterLink>
                ) : (
                  <Box />
                )}
                {limit && running && (
                  <FooterLink onClick={stop}>J’arrête là</FooterLink>
                )}
              </HStack>
            </>
          )}
        </VStack>
      )}

      {launching && (
        <Countdown
          title={blockTitle(step.block)}
          detail={`Palier 1 sur ${state.count} · ${reps[0] ?? ''} reps`}
          onDone={start}
        />
      )}

      {ending && limit && (
        <LadderEnd
          ending={ending}
          limit={limit}
          reps={reps}
          initialRung={Math.min(state.current, state.count)}
          count={state.count}
          onConfirm={(result) => {
            onDoneChange(doneUpTo(sets, done, result.rungs + 1));
            onResult(result);
            onFinish();
          }}
        />
      )}
    </VStack>
  );
};

/** Un lien du pied : 44 px réels, un geste secondaire. */
const FooterLink = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Box
    as="button"
    minH="44px"
    display="inline-flex"
    alignItems="center"
    fontSize="13px"
    fontWeight="bold"
    color="fg.muted"
    onClick={onClick}
    _hover={{ color: 'fg' }}
  >
    {children}
  </Box>
);

/**
 * Les marches : une par palier, haute comme ses répétitions.
 *
 * Toucher une marche y va — c'est le moyen de se recaler après une
 * interruption ; dans la feuille de fin, c'est choisir le palier atteint.
 * Au-delà de neuf paliers les marches rétrécissent, et au-delà de treize la
 * rangée défile plutôt que d'écrire des nombres illisibles.
 */
const Rungs = ({
  reps,
  markOf,
  onPick,
  height = 104,
  todoBg = 'bg.surface',
}: {
  reps: number[];
  markOf: (rung: number) => 'done' | 'now' | 'todo';
  onPick?: (rung: number) => void;
  height?: number;
  /** Le fond d'une marche à faire : celui de la feuille la ferait
   * disparaître, posée sur la même teinte. */
  todoBg?: string;
}) => {
  const highest = Math.max(0, ...reps);
  const narrow = reps.length > 9;
  return (
    <Box overflowX={reps.length > 13 ? 'auto' : 'visible'}>
      <HStack
        role="group"
        aria-label="Les paliers"
        align="flex-end"
        gap={narrow ? '4px' : '6px'}
        h={`${height}px`}
        minW={reps.length > 13 ? `${reps.length * 30}px` : undefined}
      >
        {reps.map((count, i) => {
          const rung = i + 1;
          const mark = markOf(rung);
          return (
            <Box
              key={rung}
              as={onPick ? 'button' : 'div'}
              aria-label={`Palier ${rung} — ${count} reps, ${
                mark === 'done'
                  ? 'fait'
                  : mark === 'now'
                    ? 'en cours'
                    : 'à faire'
              }`}
              aria-current={mark === 'now' ? 'step' : undefined}
              onClick={onPick ? () => onPick(rung) : undefined}
              flex={1}
              minW={narrow ? '22px' : '28px'}
              h={`${stepHeight(count, highest)}%`}
              borderRadius="6px 6px 3px 3px"
              bg={
                mark === 'done'
                  ? 'session.rest'
                  : mark === 'now'
                    ? 'app.primary'
                    : todoBg
              }
              color={mark === 'todo' ? 'fg.muted' : 'bg.canvas'}
              display="flex"
              alignItems="flex-start"
              justifyContent="center"
              pt="6px"
              fontWeight="800"
              fontSize={narrow ? '12px' : '14px'}
              fontVariantNumeric="tabular-nums"
            >
              {count}
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
};

/**
 * La feuille de fin d'une échelle bornée.
 *
 * Trois façons d'y arriver, deux feuilles. La limite tombe, ou l'on dit
 * « J'arrête là » : on choisit le palier atteint — celui en cours est
 * présélectionné — et le temps se corrige. Le dernier palier fait avant la
 * limite : l'échelle est bouclée, son temps et l'avance sur la limite
 * s'affichent, et le temps se corrige aussi, mais sur demande.
 */
const LadderEnd = ({
  ending,
  limit,
  reps,
  initialRung,
  count,
  onConfirm,
}: {
  ending: Ending;
  limit: number;
  reps: number[];
  initialRung: number;
  count: number;
  onConfirm: (result: LadderResult) => void;
}) => {
  const coach = useCoachVoice();
  const [rung, setRung] = useState(initialRung);
  const [seconds, setSeconds] = useState(ending.seconds);
  const [correcting, setCorrecting] = useState(false);
  const shift = (delta: number) =>
    setSeconds((s) => Math.min(limit, Math.max(0, s + delta)));

  const timeStepper = (
    <HStack justify="center" gap={5} py={1}>
      <StepButton
        label="Quinze secondes de moins"
        disabled={seconds === 0}
        onClick={() => shift(-TIME_STEP)}
      >
        <LuMinus size={22} />
      </StepButton>
      <VStack gap={1} minW="120px">
        <Text
          fontFamily="heading"
          fontSize="44px"
          fontWeight="800"
          lineHeight="0.9"
          fontVariantNumeric="tabular-nums"
          aria-live="polite"
        >
          {chipTime(seconds)}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          au chrono
        </Text>
      </VStack>
      <StepButton
        label="Quinze secondes de plus"
        disabled={seconds >= limit}
        onClick={() => shift(TIME_STEP)}
      >
        <LuPlus size={22} />
      </StepButton>
    </HStack>
  );

  if (ending.kind === 'complete') {
    return (
      <Sheet label="Échelle bouclée">
        <HStack gap={3}>
          <Ring
            part={1}
            size={54}
            stroke={16}
            color="var(--chakra-colors-session-rest)"
          >
            <LuCheck size={22} />
          </Ring>
          <VStack align="start" gap={1}>
            <Text as="h2" fontSize="24px" fontWeight="750" lineHeight="1.08">
              Échelle bouclée
            </Text>
            <Text color="fg.muted">
              {count} paliers sur {count}.
            </Text>
          </VStack>
        </HStack>
        {correcting ? (
          timeStepper
        ) : (
          <Grid templateColumns="1fr 1fr" gap={3}>
            <Stat value={chipTime(seconds)} label="au chrono" />
            <Stat
              value={minutesSeconds(Math.max(0, limit - seconds))}
              label="d’avance sur la limite"
              tone="session.rest.fg"
            />
          </Grid>
        )}
        <ActionButton
          size="xl"
          w="full"
          onClick={() => onConfirm({ rungs: count, seconds })}
        >
          Continuer
        </ActionButton>
        {!correcting && (
          <Box
            as="button"
            alignSelf="center"
            minH="44px"
            fontSize="13px"
            fontWeight="bold"
            color="fg.muted"
            onClick={() => setCorrecting(true)}
          >
            Corriger le temps
          </Box>
        )}
      </Sheet>
    );
  }

  const title = ending.kind === 'timeUp' ? 'Temps écoulé' : 'Fin de l’échelle';
  return (
    <Sheet label={title}>
      <Text as="h2" fontSize="24px" fontWeight="750" lineHeight="1.08">
        {title}
      </Text>
      <Text color="fg.muted">
        Où t’es-tu arrêté&nbsp;? {coach.opening} verra le palier atteint et le
        temps.
      </Text>
      <Rungs
        reps={reps}
        height={84}
        todoBg="bg.canvas"
        markOf={(r) => (r < rung ? 'done' : r === rung ? 'now' : 'todo')}
        onPick={setRung}
      />
      <Text textAlign="center" fontWeight="bold">
        Palier {rung} sur {count} · en cours
      </Text>
      {timeStepper}
      <ActionButton
        size="xl"
        w="full"
        onClick={() => onConfirm({ rungs: rung - 1, seconds })}
      >
        Valider
      </ActionButton>
    </Sheet>
  );
};

const Stat = ({
  value,
  label,
  tone = 'fg',
}: {
  value: string;
  label: string;
  tone?: string;
}) => (
  <VStack bg="bg.canvas" borderRadius="lg" py={3} gap={1}>
    <Text
      fontFamily="heading"
      fontSize="34px"
      fontWeight="800"
      lineHeight="0.9"
      fontVariantNumeric="tabular-nums"
      color={tone}
    >
      {value}
    </Text>
    <Text fontSize="sm" color="fg.muted">
      {label}
    </Text>
  </VStack>
);

/** Un bouton rond du réglage du temps : 60 px, pour un pouce essoufflé. */
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
