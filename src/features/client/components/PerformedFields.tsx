import { Box, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { PerformedSet, PerformedValues } from '@/types';
import { hitArea } from '@/components/hitArea';
import {
  isEmptySet,
  truncateAtFirstEmpty,
  uniformSet,
} from '../performedFormat';

interface PerformedFieldsProps {
  value: PerformedValues;
  onChange: (next: PerformedValues) => void;
  /**
   * What each pass asks for, one entry per pass — "21 reps", "15 reps"… An
   * empty entry gets numbered. The length sets how many input rows there are.
   */
  setLabels?: string[];
  /** "la dernière fois : 3 × 12 reps · 26 kg", or `null`. */
  lastLabel?: string | null;
  /** The exercise is measured in time: asking for repetitions makes no
   *  sense, so we only show the load. */
  isTimed?: boolean;
}

// An empty string clears the key rather than writing 0: "not filled in" must
// never look like "zero", neither here nor in what we send to the API.
const parse = (raw: string): number | undefined => {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const Field = ({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value?: number;
  onChange: (v?: number) => void;
}) => (
  <HStack gap={1} align="center">
    <Input
      size="xs"
      w="52px"
      textAlign="center"
      inputMode="decimal"
      aria-label={label}
      placeholder="—"
      value={value === undefined ? '' : String(value)}
      onChange={(e) => onChange(parse(e.target.value))}
      bg="whiteAlpha.50"
      borderColor="whiteAlpha.100"
      _placeholder={{ color: 'fg.muted', opacity: 0.6 }}
      _focus={{ borderColor: 'app.primary.border', bg: 'whiteAlpha.100' }}
      borderRadius="md"
      fontFamily="mono"
    />
    <Text fontSize="xs" color="fg.muted">
      {suffix}
    </Text>
  </HStack>
);

const SetInputs = ({
  set,
  isTimed,
  onChange,
}: {
  set: PerformedSet;
  isTimed: boolean;
  onChange: (next: PerformedSet) => void;
}) => (
  // The work first, the load second — « 9 reps · 12 kg », the order it is
  // said in. A timed exercise has no repetitions to ask for, so the load
  // stands alone.
  <HStack gap={3} align="center" flexWrap="wrap">
    {!isTimed && (
      <Field
        label="Répétitions réellement faites"
        suffix="reps"
        value={set.reps}
        onChange={(v) => onChange({ ...set, reps: v })}
      />
    )}
    <Field
      label="Poids utilisé, en kilos"
      suffix="kg"
      value={set.weight}
      onChange={(v) => onChange({ ...set, weight: v })}
    />
  </HStack>
);

/**
 * Recording what you did — a weight/reps pair, or the detail set by set.
 *
 * The common case is a load held from start to finish: you enter it once. But
 * a failed set, a load dropped on the third pass, is precisely what a coach
 * needs to read, and a single pair could not say it. So the detail is there,
 * folded away, one gesture off.
 *
 * A set left empty means the exercise stopped there. The rows stay on screen
 * so they can be revisited; what goes to the API stops at the first empty
 * one.
 */
export const PerformedFields = ({
  value,
  onChange,
  setLabels = [''],
  lastLabel,
  isTimed = false,
}: PerformedFieldsProps) => {
  const rowCount = Math.max(1, setLabels.length);

  // The rows live here at their full length: otherwise a set cleared
  // mid-entry would make the following ones vanish under your fingers.
  // Truncation only happens on the way out.
  const [rows, setRows] = useState<PerformedSet[]>(() =>
    Array.from({ length: rowCount }, (_, i) => value.sets?.[i] ?? {})
  );
  // Open from the start only when sets already differ: that is a correction
  // being made, and folding it away would hide what is being corrected. A
  // fresh entry starts simple.
  const [isDetailed, setIsDetailed] = useState(() => {
    const kept = truncateAtFirstEmpty(value.sets ?? []);
    return rowCount > 1 && kept.length > 0 && uniformSet(kept) === null;
  });

  const emit = (next: PerformedSet[]) => {
    setRows(next);
    onChange({ sets: truncateAtFirstEmpty(next) });
  };

  // Folded, you describe every set at once: "I held 12 reps at 26 kg from
  // start to finish". Clearing the field erases the whole exercise, which is
  // indeed what clearing the only displayed value means.
  const collapsedSet = uniformSet(rows) ?? rows[0] ?? {};
  const setAll = (next: PerformedSet) =>
    emit(
      isEmptySet(next)
        ? Array.from({ length: rowCount }, () => ({}))
        : Array.from({ length: rowCount }, () => ({ ...next }))
    );

  const setRow = (index: number, next: PerformedSet) =>
    emit(rows.map((row, i) => (i === index ? next : row)));

  return (
    <Box pl={4}>
      <HStack gap={3} align="center" flexWrap="wrap">
        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
          Fait&nbsp;:
        </Text>
        {!isDetailed && (
          <SetInputs set={collapsedSet} isTimed={isTimed} onChange={setAll} />
        )}
        {rowCount > 1 && (
          <Box
            as="button"
            aria-expanded={isDetailed}
            onClick={() => setIsDetailed((open) => !open)}
            color="fg.muted"
            _hover={{ color: 'app.primary' }}
            css={hitArea(32)}
          >
            <HStack gap={1}>
              <Box
                display="flex"
                transform={isDetailed ? 'rotate(90deg)' : 'none'}
                transition="transform 0.15s"
              >
                <LuChevronRight size={12} />
              </Box>
              <Text fontSize="xs">
                {isDetailed ? 'saisie simple' : 'détailler par série'}
              </Text>
            </HStack>
          </Box>
        )}
      </HStack>

      {isDetailed && (
        <VStack align="stretch" gap={1.5} mt={2}>
          {rows.map((row, index) => (
            <HStack key={index} gap={2} align="center">
              {/* The rung rather than the rank when there is one: on a
                  pyramid, "1 2 3" does not say which of the three you are
                  filling in, "21 15 9" does. */}
              <Text
                fontSize="xs"
                fontFamily="mono"
                color="fg.muted"
                w={setLabels[index] ? '56px' : '16px'}
                textAlign={setLabels[index] ? 'right' : 'left'}
                flexShrink={0}
              >
                {setLabels[index] || index + 1}
              </Text>
              <SetInputs
                set={row}
                isTimed={isTimed}
                onChange={(next) => setRow(index, next)}
              />
            </HStack>
          ))}
          <Text fontSize="xs" color="fg.muted" opacity={0.8}>
            Une série laissée vide arrête l'exercice là.
          </Text>
        </VStack>
      )}

      {lastLabel && (
        <Text fontSize="xs" color="fg.muted" mt={1} opacity={0.8}>
          la dernière fois&nbsp;: {lastLabel}
        </Text>
      )}
    </Box>
  );
};
