import { BlockExercise } from '@/shared/types';
import { roundDose, type GuidedStep } from '../../guidedSteps';
import { formatLastPerformance, LastPerformance } from '../../lastPerformance';
import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/shared/components/hitArea';
import { useState } from 'react';
import { LuInfo } from 'react-icons/lu';
import { PAYSAGE } from './media';
import { Timer } from './Timer';

/**
 * One round, with its clock.
 *
 * Three things the page-by-page flow could not say, and which are all you
 * need in the middle of an EMOM:
 *
 *   — which round you are in (ten identical screens did not say),
 *   — how much of the minute is left (the clock was missing from the one
 *     format defined by it),
 *   — what is left to do in this round (you only saw one movement).
 *
 * Tabata and On-Off additionally impose their rest: the clock then chains
 * work and rest by itself. On an EMOM the rest is whatever is left of the
 * interval — it has no page, because it has no duration of its own.
 */
export const Round = ({
  step,
  onDone,
  lastPerformance,
  onOuvrirDetail,
  armed,
  onArm,
}: {
  step: Extract<GuidedStep, { type: 'round' }>;
  /** The round is over: we move on. */
  onDone: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
  /**
   * Whether this block's clock has already been started.
   *
   * The first start is a decision, the chaining is the format. Asking for a
   * tap on every round would destroy an EMOM — "every minute on the minute"
   * means the minutes follow each other, not that you restart them. So the
   * tap is asked once per block, and the rounds then run as written.
   */
  armed: boolean;
  onArm: () => void;
}) => {
  const [phase, setPhase] = useState<'travail' | 'rest'>('travail');
  const resting = phase === 'rest';
  const duration = resting ? step.restSeconds : step.workSeconds;

  // Work done, we move to the rest if one is imposed — otherwise the round
  // is over and the next starts, which is the definition of the format.
  const finDePhase = () => {
    if (!resting && step.restSeconds) {
      setPhase('rest');
      return;
    }
    navigator.vibrate?.([120, 80, 120]);
    onDone();
  };

  return (
    <VStack
      flex={1}
      align="stretch"
      gap={4}
      px={5}
      py={2}
      overflowY="auto"
      // Lying flat, these gutters are worth 16 px each out of 360 px of
      // height. The targets keep their 44 px — we do not shrink what gets
      // touched with sweaty hands — it is the empty space that gives.
      css={{ [PAYSAGE]: { gap: '10px', paddingTop: 0, paddingBottom: 0 } }}
    >
      {duration ? (
        <Timer
          // The key carries the phase as well as the round: without it, the
          // rest countdown would resume where the work one stopped.
          key={`${step.round}-${phase}`}
          duration={duration}
          autoStart={armed}
          onStart={onArm}
          couleur={resting ? 'session.rest' : 'fg'}
          onComplete={finDePhase}
          title={
            <VStack align="start" gap={0.5}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color={resting ? 'session.rest' : 'session.work'}
              >
                {resting ? 'Repos' : step.blockLabel}
              </Text>
              {/* The landmark that was missing. Without it, an EMOM's ten rounds
              displayed identically and nothing said which one you were
              living. */}
              <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
                Tour {step.round}&nbsp;/&nbsp;{step.rounds}
              </Text>
            </VStack>
          }
        />
      ) : (
        <VStack align="start" gap={0.5}>
          <Text
            fontSize="xs"
            letterSpacing="2px"
            textTransform="uppercase"
            fontWeight="800"
            color={resting ? 'session.rest' : 'session.work'}
          >
            {resting ? 'Repos' : step.blockLabel}
          </Text>
          {/* The landmark that was missing. Without it, an EMOM's ten rounds
              displayed identically and nothing said which one you were
              living. */}
          <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
            Tour {step.round}&nbsp;/&nbsp;{step.rounds}
          </Text>
        </VStack>
      )}

      {/* What there is to do in this round — all of it, not one movement at
          a time. During an imposed rest the list stays: it is what you
          reread to get ready for the next round. */}
      <VStack align="stretch" gap={0} opacity={resting ? 0.6 : 1}>
        {step.exercises.map((ex, i) => {
          const aDuDetail =
            !!ex.note?.trim() ||
            !!ex.exercise.description?.trim() ||
            !!ex.exercise.videoUrl?.trim();
          const last = formatLastPerformance(
            lastPerformance?.get(ex.exercise._id)
          );
          return (
            <Box
              key={`${ex.order}-${ex.exercise._id}`}
              borderTopWidth={i === 0 ? 0 : '1px'}
              borderColor="whiteAlpha.100"
              py={3}
            >
              <HStack justify="space-between" align="baseline" gap={3}>
                {aDuDetail ? (
                  <Box
                    as="button"
                    textAlign="left"
                    minW={0}
                    aria-label={`Voir la consigne — ${ex.exercise.name}`}
                    onClick={() => onOuvrirDetail(ex)}
                    css={hitArea(44)}
                  >
                    <HStack gap={1.5} align="center">
                      <Text fontSize="lg" fontWeight="bold">
                        {ex.exercise.name}
                      </Text>
                      <Box color="app.primary" flexShrink={0}>
                        <LuInfo size={15} />
                      </Box>
                    </HStack>
                  </Box>
                ) : (
                  <Text fontSize="lg" fontWeight="bold" minW={0}>
                    {ex.exercise.name}
                  </Text>
                )}
                <Text
                  fontSize="xl"
                  fontWeight="800"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {roundDose(step.block, ex) || '—'}
                </Text>
              </HStack>
              {last && (
                <Text fontSize="xs" color="fg.muted">
                  la dernière fois&nbsp;: {last}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* On the last round only: elsewhere the counter already says rounds
          remain, and announcing "next: round 4" teaches nothing. */}
      {step.nextLabel && (
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          dernier tour — ensuite : {step.nextLabel}
        </Text>
      )}
    </VStack>
  );
};
