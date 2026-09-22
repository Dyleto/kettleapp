import { Box, HStack, Input, Spinner, Text, VStack } from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import { LuArrowUpRight, LuPlus, LuSearch } from 'react-icons/lu';
import { Exercise } from '@/types';
import { useExercises } from '@/features/exercise/hooks/useExercises';
import { useCreateExercise } from '@/features/exercise/hooks/useExerciseMutations';
import { stripAccents } from '@/utils/formatters';
import { useOutsideDismiss } from '@/hooks/useOutsideDismiss';

const normalize = (s: string) => stripAccents(s).toLowerCase().trim();

interface Option {
  exercise: Exercise;
  group: string;
}

interface InlineExercisePickerProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
  /** Exercises already placed elsewhere in this program — free, it is in
   *  memory, and it is by far the most useful group. */
  inProgram: Exercise[];
  /** Opens the exercise sheet over the workshop. We do not navigate: leaving
   *  the page would lose the unsaved changes. */
  onOpenSheet?: (exercise: Exercise) => void;
}

const GROUP_IN_PROGRAM = 'Déjà dans ce programme';
const GROUP_MOST_USED = 'Vos plus utilisés';
const GROUP_ALL = 'Toute la bibliothèque';
const GROUP_RESULTS = 'Résultats';

export const InlineExercisePicker = ({
  onSelect,
  onClose,
  inProgram,
  onOpenSheet,
}: InlineExercisePickerProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const createMutation = useCreateExercise();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  useOutsideDismiss(rootRef, true, onClose);

  const options = useMemo<Option[]>(() => {
    const q = normalize(query);

    if (q.length > 0) {
      // Matches on the start of the name first, then the usage counter
      // breaks the tie. The counter orders, it is never displayed.
      const matches = exercises.filter((e) => normalize(e.name).includes(q));
      matches.sort((a, b) => {
        const aStarts = normalize(a.name).startsWith(q);
        const bStarts = normalize(b.name).startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        const byUsage = (b.usageCount ?? 0) - (a.usageCount ?? 0);
        if (byUsage !== 0) return byUsage;
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      });
      return matches.map((exercise) => ({ exercise, group: GROUP_RESULTS }));
    }

    const inProgramIds = new Set(inProgram.map((e) => e._id));
    const mostUsed = exercises
      .filter((e) => !inProgramIds.has(e._id) && (e.usageCount ?? 0) > 0)
      .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
      .slice(0, 5);
    const mostUsedIds = new Set(mostUsed.map((e) => e._id));
    const rest = exercises
      .filter((e) => !inProgramIds.has(e._id) && !mostUsedIds.has(e._id))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
      );

    return [
      ...inProgram.map((exercise) => ({
        exercise,
        group: GROUP_IN_PROGRAM,
      })),
      ...mostUsed.map((exercise) => ({ exercise, group: GROUP_MOST_USED })),
      ...rest.map((exercise) => ({ exercise, group: GROUP_ALL })),
    ];
  }, [exercises, inProgram, query]);

  // The list changes on every keystroke: the active index has to stay in
  // bounds without going through an effect.
  const [prevLength, setPrevLength] = useState(options.length);
  if (options.length !== prevLength) {
    setPrevLength(options.length);
    setActiveIndex(0);
  }

  const trimmed = query.trim();
  const hasExactMatch = exercises.some(
    (e) => normalize(e.name) === normalize(trimmed)
  );
  const canCreate = trimmed.length > 0 && !hasExactMatch;
  const createIndex = canCreate ? options.length : -1;

  const pick = (index: number) => {
    if (index === createIndex) {
      createMutation.mutate(
        { name: trimmed },
        {
          onSuccess: (response) => {
            onSelect(response.data);
            setQuery('');
            onClose();
          },
        }
      );
      return;
    }
    const option = options[index];
    if (!option) return;
    onSelect(option.exercise);
    setQuery('');
    onClose();
  };

  const total = options.length + (canCreate ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (total === 0 ? 0 : (i + 1) % total));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (total === 0 ? 0 : (i - 1 + total) % total));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <Box
      ref={rootRef}
      borderWidth="1px"
      borderColor="app.primary.border"
      borderRadius="md"
      bg="blackAlpha.300"
      overflow="hidden"
    >
      <HStack
        px={2}
        py={1}
        borderBottomWidth="1px"
        borderColor="whiteAlpha.100"
      >
        <LuSearch size={13} color="var(--chakra-colors-fg-muted)" />
        <Input
          autoFocus
          size="xs"
          variant="subtle"
          bg="transparent"
          border="none"
          outline="none"
          _focus={{ boxShadow: 'none', outline: 'none' }}
          _focusVisible={{ boxShadow: 'none', outline: 'none' }}
          placeholder="Chercher ou créer un exercice…"
          aria-label="Chercher un exercice"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Box
          as="button"
          aria-label="Fermer le sélecteur"
          fontSize="xs"
          color="fg.muted"
          px={1}
          onClick={onClose}
        >
          Échap
        </Box>
      </HStack>

      <VStack align="stretch" gap={0} maxH="260px" overflowY="auto">
        {isLoading && (
          <Box py={4} textAlign="center">
            <Spinner size="sm" />
          </Box>
        )}

        {!isLoading &&
          options.map((option, index) => {
            const showGroup = option.group !== lastGroup;
            lastGroup = option.group;
            const isActive = index === activeIndex;
            return (
              <Box key={`${option.group}-${option.exercise._id}`}>
                {showGroup && (
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    px={3}
                    pt={2}
                    pb={1}
                  >
                    {option.group}
                  </Text>
                )}
                <HStack
                  gap={0}
                  bg={isActive ? 'app.primary/12' : 'transparent'}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <Box
                    as="button"
                    flex={1}
                    minW={0}
                    textAlign="left"
                    px={3}
                    py={1.5}
                    fontSize="sm"
                    color={isActive ? 'fg' : 'fg.muted'}
                    onClick={() => pick(index)}
                  >
                    {option.exercise.name}
                  </Box>
                  {/* The sheet opens over the workshop: you can fix an
                      instruction or paste a video without losing the
                      program being edited. */}
                  {onOpenSheet && (
                    <Box
                      as="button"
                      aria-label={`Ouvrir la fiche de ${option.exercise.name}`}
                      display="flex"
                      flexShrink={0}
                      px={2.5}
                      py={1.5}
                      color="fg.muted"
                      opacity={isActive ? 1 : 0}
                      _hover={{ color: 'app.primary' }}
                      _focusVisible={{ opacity: 1 }}
                      transition="opacity 0.12s"
                      onClick={() => onOpenSheet(option.exercise)}
                    >
                      <LuArrowUpRight size={13} />
                    </Box>
                  )}
                </HStack>
              </Box>
            );
          })}

        {!isLoading && options.length === 0 && !canCreate && (
          <Box py={4} textAlign="center" fontSize="sm" color="fg.muted">
            Aucun exercice
          </Box>
        )}

        {canCreate && (
          <Box
            as="button"
            w="full"
            textAlign="left"
            px={3}
            py={2}
            fontSize="sm"
            color="app.primary"
            bg={activeIndex === createIndex ? 'app.primary/12' : 'transparent'}
            borderTopWidth="1px"
            borderColor="whiteAlpha.100"
            onMouseEnter={() => setActiveIndex(createIndex)}
            onClick={() => pick(createIndex)}
          >
            <HStack gap={1.5}>
              <LuPlus size={13} />
              <Text as="span">Créer «&nbsp;{trimmed}&nbsp;»</Text>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
