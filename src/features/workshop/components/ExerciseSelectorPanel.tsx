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
import {
  useCreateExercise,
  useExercises,
  ExerciseRow,
} from '@/features/exercise';
import { Exercise } from '@/shared/types';
import { exerciseChoices } from '@/domain/exercise/choices';

interface ExerciseSelectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  /** Les exercices déjà placés ailleurs dans ce programme. */
  inProgram?: Exercise[];
  /** Ouvre la fiche de l'exercice sans quitter l'éditeur. */
  onOpenSheet?: (exercise: Exercise) => void;
}

/**
 * Choisir un exercice en dessous de 768 px.
 *
 * C'est le même sélecteur que sur bureau, dans un tiroir : mêmes groupes, même
 * création depuis la recherche, mêmes lignes. Il proposait « Récemment
 * ajoutés » puis « Tous les exercices », si bien que les mêmes exercices
 * apparaissaient deux fois dans une seule liste de cartes.
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

  const choices = useMemo(
    () => exerciseChoices(query, exercises, inProgram),
    [exercises, inProgram, query]
  );
  const groups = choices.groups;
  const trimmed = choices.create ?? '';
  const canCreate = choices.create !== undefined;

  const create = () => {
    createMutation.mutate(
      { name: trimmed },
      {
        onSuccess: (created) => {
          setQuery('');
          onSelect(created);
          // Même raison que dans le sélecteur en ligne : créer n'envoie que
          // le nom, et la fiche du parent est le seul endroit où la vidéo et
          // la consigne se posent sans quitter la séance.
          onOpenSheet?.(created);
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
                      <Text as="span">
                        Créer «&nbsp;{trimmed}&nbsp;» et ouvrir sa fiche
                      </Text>
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
