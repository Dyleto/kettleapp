import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { useRef } from 'react';
import { EFFORT_SCALE, EFFORT_ZONE_COLOR, getEffortLevel } from '../constants';

interface EffortScaleProps {
  /** `undefined` = nothing chosen. Never preselected: a value nobody
   *  picked must not be recordable as an answer. */
  value?: number;
  onChange: (value: number) => void;
}

export const EffortScale = ({ value, onChange }: EffortScaleProps) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const selected = getEffortLevel(value);

  const move = (from: number, delta: number) => {
    const next = Math.min(EFFORT_SCALE.length - 1, Math.max(0, from + delta));
    onChange(EFFORT_SCALE[next].value);
    refs.current[next]?.focus();
  };

  return (
    <VStack align="stretch" gap={2}>
      <HStack
        gap={1}
        role="radiogroup"
        aria-label="Difficulté de la séance"
        align="stretch"
      >
        {EFFORT_SCALE.map((level, i) => {
          const isSelected = level.value === value;
          const color = EFFORT_ZONE_COLOR[level.zone];
          return (
            <Box
              key={level.value}
              ref={(el: HTMLDivElement | null) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${level.label} — ${level.description}`}
              // One keyboard entry point: you tab to the scale, then move
              // through it with the arrow keys.
              tabIndex={isSelected || (!value && i === 0) ? 0 : -1}
              flex={1}
              minH="56px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              py={2.5}
              px={1}
              borderRadius="md"
              borderWidth="1px"
              cursor="pointer"
              textAlign="center"
              bg={isSelected ? `${color}/16` : 'whiteAlpha.50'}
              borderColor={isSelected ? color : 'whiteAlpha.100'}
              color={isSelected ? color : 'fg.muted'}
              onClick={() => onChange(level.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  move(i, 1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  move(i, -1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(level.value);
                }
              }}
              _hover={{ borderColor: isSelected ? color : 'whiteAlpha.300' }}
              transition="background-color 0.15s, border-color 0.15s"
            >
              <VStack gap={0.5}>
                <Text fontSize="lg" fontWeight="800" fontFamily="mono">
                  {level.rank}
                </Text>
                {/* The name of every step, and not just the two ends: the
                    target is "Juste", in the middle, and nothing on screen
                    said where it was until you had tapped. */}
                <Text
                  fontSize="10px"
                  lineHeight="1.2"
                  textAlign="center"
                  color={isSelected ? color : 'fg.muted'}
                >
                  {level.label}
                </Text>
              </VStack>
            </Box>
          );
        })}
      </HStack>

      {/* Height reserved: choosing a level must not make the dialog jump at
          the moment of the tap. The step's name is now on the step itself —
          all that remains here is what it adds: the description. */}
      <Box minH="20px" textAlign="center">
        {selected && (
          <Text fontSize="xs" color={EFFORT_ZONE_COLOR[selected.zone]}>
            {selected.description}
          </Text>
        )}
      </Box>
    </VStack>
  );
};
