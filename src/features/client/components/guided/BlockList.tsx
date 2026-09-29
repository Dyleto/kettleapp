import { BlockExercise, PerformedValues, SessionBlock } from '@/shared/types';
import { type GuidedSet } from '../../guidedSteps';
import { blockDefinesOwnMetrics } from '@/features/program/constants';
import {
  formatLastPerformance,
  LastPerformance,
  performedKey,
} from '../../lastPerformance';
import { Box, HStack, Input, VStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/shared/components/hitArea';
import { formatDuration } from '@/shared/utils/duration';
import { Fragment, useState } from 'react';
import { LuCheck, LuInfo, LuTimer } from 'react-icons/lu';
import { OnDemandTimer } from './Timer';
import { RestStrip } from './RestStrip';

/**
 * A block you tick off, set by set.
 *
 * This was guided mode's broken half: the prescription card, with input
 * fields stuck onto it. Nothing could be ticked, nothing advanced. Measured
 * on a seven-rung pyramid: one 14 px line and 511 px of black. A sheet of
 * paper did better — you could cross things out on it.
 *
 * Exactly one set is "current". It is the only one written large, and the
 * only one carrying a field: hierarchy comes from state, not from an
 * arbitrary typographic choice, and the list becomes readable again because
 * a form no longer cuts it at every line.
 */
export const BlockList = ({
  block,
  sets,
  done,
  current,
  performed,
  onPerformedChange,
  lastPerformance,
  onOuvrirDetail,
  rest,
  onRestDone,
  onUndo,
}: {
  block: SessionBlock;
  sets: GuidedSet[];
  done: Set<string>;
  current: GuidedSet | undefined;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
  /** The rest under way, and the set it follows. */
  rest: { afterKey: string; duration: number; nextUp: string } | null;
  onRestDone: () => void;
  /** Untick a set: it goes back to being something to do. */
  onUndo: (key: string) => void;
}) => {
  /**
   * The ticked set currently reopened, if any.
   *
   * One at a time: reopening two would put two editable loads on screen and
   * bring back the very thing the list was rewritten to remove — a form at
   * every line.
   */
  const [opened, setOpened] = useState<string | null>(null);

  /** Whether this movement has anything to show beyond its dose. */
  const aDuDetailDe = (e: GuidedSet) =>
    !!e.exercise.note?.trim() ||
    !!e.exercise.exercise.description?.trim() ||
    !!e.exercise.exercise.videoUrl?.trim();
  /**
   * The set's rank within its exercise, when there is more than one.
   *
   * A pyramid does not do series: it climbs and comes back down rungs, and
   * that is the word the coach uses in the editor.
   */
  const rankOf = (e: GuidedSet) =>
    e.total > 1
      ? `${blockDefinesOwnMetrics(block.type) ? 'palier' : 'série'} ${e.rank} / ${e.total}`
      : '';

  /** What was recorded on this precise set. */
  const valueOfSet = (e: GuidedSet) =>
    performed?.[performedKey(e.blockOrder, e.exerciseOrder)]?.sets?.[
      e.rank - 1
    ];

  const write = (e: GuidedSet, champ: 'weight' | 'reps', brut: string) => {
    if (!onPerformedChange) return;
    const key = performedKey(e.blockOrder, e.exerciseOrder);
    const sets = [...(performed?.[key]?.sets ?? [])];
    while (sets.length < e.rank) sets.push({});
    const count =
      brut.trim() === '' ? undefined : Number(brut.replace(',', '.'));
    sets[e.rank - 1] = {
      ...sets[e.rank - 1],
      [champ]: Number.isFinite(count) ? count : undefined,
    };
    onPerformedChange(key, { sets });
  };

  return (
    <VStack align="stretch" gap={1} flex={1} px={5} py={2} overflowY="auto">
      {sets.map((e) => {
        const fait = done.has(e.key);
        const isCurrent = current?.key === e.key;
        const value = valueOfSet(e);
        const rank = rankOf(e);
        // The rest belongs to the set it follows, so it is drawn right after
        // it — the gap is where the gap is.
        const restHere =
          rest && rest.afterKey === e.key ? (
            <RestStrip
              key={`rest-${e.key}`}
              duration={rest.duration}
              nextUp={rest.nextUp}
              onDone={onRestDone}
            />
          ) : null;

        if (isCurrent) {
          const last = formatLastPerformance(
            lastPerformance?.get(e.exercise.exercise._id)
          );
          const aDuDetail =
            !!e.exercise.note?.trim() ||
            !!e.exercise.exercise.description?.trim() ||
            !!e.exercise.exercise.videoUrl?.trim();
          return (
            <Fragment key={e.key}>
              <Box
                bg="surface.card"
                borderWidth="1px"
                borderColor="app.primary"
                borderRadius="xl"
                p={4}
                my={1}
              >
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between" align="baseline" gap={3}>
                    {aDuDetail ? (
                      <Box
                        as="button"
                        textAlign="left"
                        minW={0}
                        aria-label={`Voir la consigne — ${e.name}`}
                        onClick={() => onOuvrirDetail(e.exercise)}
                        css={hitArea(44)}
                      >
                        <HStack gap={1.5} align="center">
                          <Text fontSize="xl" fontWeight="800">
                            {e.name}
                          </Text>
                          <Box color="app.primary" flexShrink={0}>
                            <LuInfo size={15} />
                          </Box>
                        </HStack>
                      </Box>
                    ) : (
                      <Text fontSize="xl" fontWeight="800" minW={0}>
                        {e.name}
                      </Text>
                    )}
                    <Text
                      fontSize="2xl"
                      fontWeight="800"
                      fontFamily="mono"
                      flexShrink={0}
                    >
                      {e.dose || '\u2014'}
                    </Text>
                  </HStack>

                  {(rank || onPerformedChange) && (
                    <HStack justify="space-between" align="center" gap={3}>
                      <Text fontSize="sm" color="fg.muted">
                        {rank}
                      </Text>
                      {onPerformedChange && (
                        <HStack gap={2}>
                          <Text fontSize="sm" color="fg.muted">
                            Fait à
                          </Text>
                          <Input
                            aria-label={`Poids utilisé, en kilos — ${e.name} ${rank}`}
                            inputMode="decimal"
                            value={value?.weight ?? ''}
                            onChange={(ev) =>
                              write(e, 'weight', ev.target.value)
                            }
                            w="76px"
                            minH="44px"
                            textAlign="center"
                            fontFamily="mono"
                            fontWeight="bold"
                            placeholder="—"
                          />
                          <Text fontSize="sm" color="fg.muted">
                            kg
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  )}

                  {/* A set whose dose is a duration needs timing. The automatic
                    rest covers the rest, not the work: replacing the
                    prescription card with the sets quietly removed the timer
                    from "2 min of skipping rope". Offered, never imposed —
                    you start it when you get there. */}
                  {e.exercise.duration ? (
                    <Box ml={-4}>
                      <OnDemandTimer
                        duration={e.exercise.duration}
                        label={formatDuration(e.exercise.duration)}
                        couleur="app.primary"
                      />
                    </Box>
                  ) : null}

                  <HStack justify="space-between" align="center" gap={3}>
                    {last ? (
                      <Text fontSize="xs" color="fg.muted">
                        la dernière fois&nbsp;: {last}
                      </Text>
                    ) : (
                      <Box />
                    )}
                    {/* What "Fait" triggers: without this line, the full-screen
                      rest arrives as a surprise. */}
                    {e.restAfter && (
                      <HStack gap={1.5} color="session.rest" flexShrink={0}>
                        <LuTimer size={13} />
                        <Text fontSize="xs" fontWeight="bold">
                          puis {formatDuration(e.restAfter)} de repos
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
              {restHere}
            </Fragment>
          );
        }

        // A ticked set reopens: you reread it, you fix its load, you do it
        // again. It used to be a dead line — and the three things people
        // actually want from it have nothing to do with the cursor, so they
        // happen in place rather than by moving it.
        if (fait && opened === e.key) {
          return (
            <Fragment key={e.key}>
              <VStack
                align="stretch"
                gap={2.5}
                bg="surface.card"
                borderWidth="1px"
                borderColor="session.rest"
                borderRadius="xl"
                px={4}
                py={3}
                my={1}
              >
                <HStack gap={3}>
                  <Box color="session.rest" flexShrink={0}>
                    <LuCheck size={16} strokeWidth={3} />
                  </Box>
                  <Text fontSize="md" fontWeight="bold" minW={0} lineClamp={1}>
                    {e.name}
                  </Text>
                  {rank && (
                    <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                      · {rank}
                    </Text>
                  )}
                  <Box flex={1} />
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    fontFamily="mono"
                    flexShrink={0}
                  >
                    {e.dose}
                  </Text>
                </HStack>

                <HStack justify="space-between" align="center" gap={3}>
                  {onPerformedChange ? (
                    <HStack gap={2}>
                      <Text fontSize="sm" color="fg.muted">
                        Fait à
                      </Text>
                      <Input
                        aria-label={`Corriger le poids, en kilos — ${e.name} ${rank}`}
                        inputMode="decimal"
                        value={value?.weight ?? ''}
                        onChange={(ev) => write(e, 'weight', ev.target.value)}
                        w="76px"
                        minH="44px"
                        textAlign="center"
                        fontFamily="mono"
                        fontWeight="bold"
                        placeholder="—"
                      />
                      <Text fontSize="sm" color="fg.muted">
                        kg
                      </Text>
                    </HStack>
                  ) : (
                    <Box />
                  )}
                  {/* Undoing is not correcting: someone who fixes a typo does
                      not want the set back in front of them, and someone who
                      redoes it does. Two gestures, two buttons. */}
                  <Box
                    as="button"
                    onClick={() => onUndo(e.key)}
                    color="app.primary"
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                    css={hitArea(44)}
                  >
                    Refaire
                  </Box>
                </HStack>

                <HStack justify="space-between" align="center" gap={3}>
                  {aDuDetailDe(e) ? (
                    <Box
                      as="button"
                      onClick={() => onOuvrirDetail(e.exercise)}
                      color="app.primary"
                      fontSize="sm"
                      css={hitArea(32)}
                    >
                      Revoir le mouvement
                    </Box>
                  ) : (
                    <Box />
                  )}
                  <Box
                    as="button"
                    onClick={() => setOpened(null)}
                    color="fg.muted"
                    fontSize="sm"
                    css={hitArea(32)}
                  >
                    Fermer
                  </Box>
                </HStack>
              </VStack>
              {restHere}
            </Fragment>
          );
        }

        return (
          <Fragment key={e.key}>
            <HStack
              gap={3}
              minH="44px"
              px={4}
              py={2}
              opacity={fait ? 1 : 0.75}
              {...(fait
                ? {
                    as: 'button' as const,
                    w: 'full',
                    textAlign: 'left' as const,
                    'aria-expanded': false,
                    'aria-label': `Rouvrir ${e.name} ${rank}`,
                    onClick: () => setOpened(e.key),
                    _hover: { bg: 'whiteAlpha.50' },
                    borderRadius: 'lg',
                  }
                : {})}
            >
              <Box
                color={fait ? 'session.rest' : 'whiteAlpha.400'}
                flexShrink={0}
              >
                {fait ? (
                  <LuCheck size={16} strokeWidth={3} />
                ) : (
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor="whiteAlpha.400"
                  />
                )}
              </Box>
              {/* The name may be truncated, the rank may not: the rank is what
                says where you are, and "Fentes marchées · série…" teaches nothing. */}
              <Text fontSize="sm" color="fg.muted" minW={0} lineClamp={1}>
                {e.name}
              </Text>
              {rank && (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  opacity={0.7}
                  flexShrink={0}
                >
                  · {rank}
                </Text>
              )}
              <Box flex={1} />
              {/* On what remains, the rest gives the block's rhythm: you can see
                the squats are on 1 min and the lunges on 45 s without having
                to get there. On what is done it teaches nothing any more —
                the load takes its place. */}
              {fait ? (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {value?.weight != null ? `${value.weight} kg` : e.dose}
                </Text>
              ) : (
                <>
                  {e.restAfter && (
                    <Text
                      fontSize="2xs"
                      color="fg.muted"
                      opacity={0.7}
                      flexShrink={0}
                    >
                      {formatDuration(e.restAfter)}
                    </Text>
                  )}
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    fontFamily="mono"
                    flexShrink={0}
                    minW="62px"
                    textAlign="right"
                  >
                    {e.dose}
                  </Text>
                </>
              )}
            </HStack>
            {restHere}
          </Fragment>
        );
      })}
    </VStack>
  );
};
