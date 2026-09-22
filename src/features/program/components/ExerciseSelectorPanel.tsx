import {
  Box,
  Drawer,
  HStack,
  Input,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { LuArrowUpRight, LuPlus, LuSearch, LuX } from 'react-icons/lu';
import { useCreateExercise } from '@/features/exercise/hooks/useExerciseMutations';
import { useExercises } from '@/features/exercise/hooks/useExercises';
import { ExerciseRow } from '@/features/exercise';
import { Exercise } from '@/types';
import { stripAccents } from '@/utils/formatters';

const normalize = (s: string) => stripAccents(s).toLowerCase().trim();

const GROUP_IN_PROGRAM = 'Déjà dans ce programme';
const GROUP_MOST_USED = 'Vos plus utilisés';
const GROUP_ALL = 'Toute la bibliothèque';
const GROUP_RESULTS = 'Résultats';

interface ExerciseSelectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  /** Exercises already placed elsewhere in this programme. */
  inProgram?: Exercise[];
  /** Opens the exercise's card without leaving the editor. */
  onOpenSheet?: (exercise: Exercise) => void;
}

/**
 * Choosing an exercise below 768 px.
 *
 * It is the same selector as on desktop, in a drawer: same groups, same
 * create-from-search, same rows. It used to offer "Récemment ajoutés" and
 * then "Tous les exercices", so the same exercises appeared twice in one list
 * of cards.
 */
export const ExerciseSelectorPanel = ({
  isOpen,
  onClose,
  onSelect,
  inProgram = [],
  onOpenSheet,
}: ExerciseSelectorPanelProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const createMutation = useCreateExercise();
  const [query, setQuery] = useState('');

  const groups = useMemo<{ label: string; exercises: Exercise[] }[]>(() => {
    const q = normalize(query);

    if (q.length > 0) {
      const matches = exercises.filter((e) => normalize(e.name).includes(q));
      matches.sort((a, b) => {
        const aStarts = normalize(a.name).startsWith(q);
        const bStarts = normalize(b.name).startsWith(q);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        const byUsage = (b.usageCount ?? 0) - (a.usageCount ?? 0);
        if (byUsage !== 0) return byUsage;
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      });
      return [{ label: GROUP_RESULTS, exercises: matches }];
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
      { label: GROUP_IN_PROGRAM, exercises: inProgram },
      { label: GROUP_MOST_USED, exercises: mostUsed },
      { label: GROUP_ALL, exercises: rest },
    ].filter((g) => g.exercises.length > 0);
  }, [exercises, inProgram, query]);

  const trimmed = query.trim();
  const canCreate =
    trimmed.length > 0 &&
    !exercises.some((e) => normalize(e.name) === normalize(trimmed));

  const create = () => {
    createMutation.mutate(
      { name: trimmed },
      {
        onSuccess: (response) => {
          setQuery('');
          onSelect(response.data);
        },
      }
    );
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="full"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg="bg.canvas">
            <Drawer.Body p={4}>
              <VStack align="stretch" gap={0}>
                <HStack
                  gap={2}
                  px={2}
                  py={1}
                  borderBottomWidth="1px"
                  borderColor="whiteAlpha.200"
                  _focusWithin={{ borderColor: 'app.primary' }}
                  transition="border-color 0.2s"
                >
                  <LuSearch size={14} color="var(--chakra-colors-fg-muted)" />
                  <Input
                    autoFocus
                    placeholder="Chercher ou créer un exercice…"
                    aria-label="Chercher un exercice"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    variant="subtle"
                    bg="transparent"
                    border="none"
                    outline="none"
                    size="sm"
                    _focus={{ boxShadow: 'none', outline: 'none' }}
                    _focusVisible={{ boxShadow: 'none', outline: 'none' }}
                  />
                  <Box
                    as="button"
                    aria-label="Fermer le sélecteur"
                    color="fg.muted"
                    _hover={{ color: 'fg' }}
                    flexShrink={0}
                    onClick={onClose}
                  >
                    <LuX size={14} />
                  </Box>
                </HStack>

                {isLoading && (
                  <Box py={8} textAlign="center">
                    <Spinner size="sm" />
                  </Box>
                )}

                {!isLoading &&
                  groups.map((group) => (
                    <Box key={group.label}>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="fg.muted"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        px={2}
                        pt={4}
                        pb={1}
                      >
                        {group.label}
                      </Text>
                      {group.exercises.map((exercise) => (
                        <ExerciseRow
                          key={`${group.label}-${exercise._id}`}
                          exercise={exercise}
                          onClick={() => onSelect(exercise)}
                          extra={
                            onOpenSheet && (
                              <Box
                                as="button"
                                aria-label={`Ouvrir la fiche de ${exercise.name}`}
                                display="flex"
                                color="fg.muted"
                                _hover={{ color: 'app.primary' }}
                                px={2}
                                py={1}
                                onClick={() => onOpenSheet(exercise)}
                              >
                                <LuArrowUpRight size={13} />
                              </Box>
                            )
                          }
                        />
                      ))}
                    </Box>
                  ))}

                {!isLoading && groups.length === 0 && !canCreate && (
                  <Box py={8} textAlign="center" fontSize="sm" color="fg.muted">
                    Aucun exercice
                  </Box>
                )}

                {canCreate && (
                  <Box
                    as="button"
                    w="full"
                    textAlign="left"
                    mt={2}
                    px={2}
                    py={2.5}
                    fontSize="sm"
                    color="app.primary"
                    borderTopWidth="1px"
                    borderColor="whiteAlpha.100"
                    _hover={{ bg: 'app.primary/12' }}
                    onClick={create}
                  >
                    <HStack gap={1.5}>
                      <LuPlus size={13} />
                      <Text as="span">Créer «&nbsp;{trimmed}&nbsp;»</Text>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};
