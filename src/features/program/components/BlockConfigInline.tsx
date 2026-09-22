import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { SessionBlock } from '@/types';
import { InlineSequence, InlineValue } from './InlineValue';
import { formatDuration } from '@/utils/formatters';

interface BlockConfigInlineProps {
  block: SessionBlock;
  onUpdate: (updates: Partial<SessionBlock>) => void;
}

/**
 * Block settings are written like the card's durations.
 *
 * These fields carried their unit joined by an ordinary space — "5 s",
 * "12 min" — which is one more convention for the same quantity. The coach
 * still edits in the unit they think in, but reads back in the product's
 * spelling: "90 s" entered reads back as "1 min 30 s", as everywhere else.
 */
const enMinutes = (minutes: number) => formatDuration(minutes * 60);

const Sep = ({ children }: { children: string }) => (
  <Text as="span" fontSize="sm" color="fg.muted">
    {children}
  </Text>
);

/**
 * A block's settings, editable where they are read — in the header.
 *
 * Four shapes only: nothing · one value · composed values · a sequence. The
 * editing state uses exactly the words of the reading state; only the numbers
 * get a frame. Never a popover, never a modal.
 */
export const BlockConfigInline = ({
  block,
  onUpdate,
}: BlockConfigInlineProps) => {
  switch (block.type) {
    // ── Nothing to set ──
    case 'warmup':
    case 'classic':
      return null;

    // ── Une valeur ──
    /*
     * The EMOM carries its interval, and that is what makes it an E2MOM.
     *
     * From the field: "when I do EMOMs or E2MOMs, I cannot set a duration."
     * That was accurate — the interval only existed on the "Every" type,
     * folded behind the seven rare formats, while the EMOM was offered up
     * front. A coach looking for an E2MOM therefore lands on the EMOM and
     * gets stuck there.
     *
     * Guided mode already reads `intervalMinutes` for every round-based
     * block, EMOM included: only the setting had to be opened.
     */
    case 'every':
    case 'emom':
      return (
        <HStack gap={1}>
          <InlineValue
            value={block.rounds}
            onChange={(v) => onUpdate({ rounds: v })}
            suffix="tours"
            emptyLabel="sans limite"
            ariaLabel="Nombre de tours"
            min={1}
            clearable
          />
          <Sep>toutes les</Sep>
          <InlineValue
            value={block.intervalMinutes ?? 1}
            onChange={(v) => onUpdate({ intervalMinutes: v ?? 1 })}
            suffix="min"
            format={enMinutes}
            ariaLabel="Intervalle en minutes"
            min={1}
          />
        </HStack>
      );
    case 'amrap':
      return (
        <InlineValue
          value={block.durationMinutes}
          onChange={(v) => onUpdate({ durationMinutes: v })}
          suffix="min"
          format={enMinutes}
          emptyLabel="sans limite"
          ariaLabel="Durée en minutes"
          min={1}
          clearable
        />
      );
    case 'timecap':
    case 'chipper':
      return (
        <HStack gap={1}>
          <InlineValue
            value={block.durationMinutes}
            onChange={(v) => onUpdate({ durationMinutes: v })}
            suffix="min"
            format={enMinutes}
            emptyLabel="sans limite"
            ariaLabel="Limite de temps en minutes"
            min={1}
            clearable
          />
          {block.durationMinutes !== undefined && <Sep>max</Sep>}
        </HStack>
      );

    // ── Composed values ──
    case 'tabata':
    case 'onoff':
      return (
        <HStack gap={1}>
          <InlineValue
            value={block.rounds}
            onChange={(v) => onUpdate({ rounds: v })}
            emptyLabel="—"
            ariaLabel="Nombre de tours"
            min={1}
          />
          <Sep>×</Sep>
          {/* Seconds, not minutes: that is what guided mode's timer reads,
              and that is what p11-8 fixes. */}
          <InlineValue
            value={block.workDuration}
            onChange={(v) => onUpdate({ workDuration: v })}
            suffix="s"
            format={formatDuration}
            emptyLabel="—"
            ariaLabel="Durée de travail en secondes"
            min={1}
          />
          <Sep>/</Sep>
          <InlineValue
            value={block.restDuration}
            onChange={(v) => onUpdate({ restDuration: v })}
            suffix="s"
            format={formatDuration}
            emptyLabel="—"
            ariaLabel="Durée de repos en secondes"
          />
        </HStack>
      );

    // ── A sequence ──
    case 'pyramid':
    case 'ladder':
      return (
        // A pyramid can have thirteen rungs: the sequence has to be able to
        // wrap instead of widening the header.
        <Flex gap={2} align="baseline" wrap="wrap" rowGap={1} minW={0}>
          <Box minW={0}>
            <InlineSequence
              value={block.repsScheme}
              onChange={(v) => onUpdate({ repsScheme: v })}
              ariaLabel="Paliers de répétitions"
            />
          </Box>
          <HStack gap={1} flexShrink={0}>
            {/* "repos aucun" is not something you say: when the setting is
                empty, the value carries the whole phrase. */}
            {block.restBetweenRounds !== undefined && <Sep>repos</Sep>}
            <InlineValue
              value={block.restBetweenRounds}
              onChange={(v) => onUpdate({ restBetweenRounds: v })}
              suffix="s"
              format={formatDuration}
              emptyLabel="sans repos"
              ariaLabel="Repos entre paliers en secondes"
              width="72px"
              clearable
            />
          </HStack>
        </Flex>
      );
  }
};
