import { useState } from 'react';
import {
  Box,
  Button,
  chakra,
  Container,
  Dialog,
  Grid,
  HStack,
  Portal,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';
import { ExerciseSectionSkeleton } from '@/shared/components/skeletons';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useExercises } from '@/features/exercise/hooks/useExercises';
import {
  useCreateExercise,
  useDeleteExercise,
} from '@/features/exercise/hooks/useExerciseMutations';
import { EmptyState, LoadFailure, SearchField, Sheet, SortMenu } from '@/kit';
import { isUnavailable } from '@/shared/utils/queryState';
import type { Exercise } from '@/shared/types';
import { COACH_ROUTES } from '@/shared/config/routes';
import { COACH_CONTENT_MAX_W } from '@/features/coach';
import { ExerciseSheet } from '@/features/exercise/components/ExerciseSheet';
import { LibraryRow } from '@/features/exercise/components/LibraryRow';
import {
  creatableName,
  libraryCount,
  matchesName,
  sortExercises,
  type LibrarySort,
} from '@/domain/exercise/library';

const NBSP = ' ';

const SORTS: { value: LibrarySort; label: string }[] = [
  { value: 'name', label: 'Par nom' },
  { value: 'usage', label: 'Les plus utilisés' },
];

/**
 * La bibliothèque de mouvements du coach : un nom, une consigne, une vidéo.
 *
 * On y crée en tapant un nom ; on y revient surtout pour compléter une
 * fiche, puisque les exercices se créent aussi depuis un programme. D'où un
 * seul champ en tête, qui cherche et propose de créer ce qu'il ne trouve
 * pas — Entrée crée et ouvre la fiche.
 *
 * La fiche s'ouvre dans un panneau à droite à partir de 1 024 px, dans une
 * feuille basse en dessous. Sans choix, le panneau montre le premier de la
 * liste, comme celui des clients : une moitié d'écran qui attend un clic ne
 * sert à rien.
 *
 * L'index alphabétique est parti. Il n'apparaissait qu'à vingt-cinq
 * exercices, ne suivait pas le tri « Les plus utilisés », et le champ du
 * haut fait mieux dès la première lettre tapée. « Les plus utilisés »,
 * qui occupait le panneau vide, est devenu un tri.
 */
const Exercises = () => {
  useDocumentTitle('Exercices');
  // L'exercice ouvert vit dans l'adresse et non dans un état : un lien vers
  // une fiche s'envoie, et le bouton retour la referme.
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const withPanel = useBreakpointValue({ base: false, lg: true }) ?? false;

  const exercisesQuery = useExercises();
  const { data: exercises = [], isLoading } = exercisesQuery;
  const isDown = isUnavailable(exercisesQuery);
  const createMutation = useCreateExercise();
  const deleteMutation = useDeleteExercise();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<LibrarySort>('name');
  const [pendingDeletion, setPendingDeletion] = useState<Exercise | null>(null);

  const openSheet = (id: string) => navigate(COACH_ROUTES.exerciseDetails(id));
  const closeSheet = () => navigate(COACH_ROUTES.exercises);

  const shown = sortExercises(exercises, sort).filter((exercise) =>
    matchesName(exercise, query)
  );
  const creatable = creatableName(exercises, query);
  // Relu dans la liste plutôt que gardé en copie : après une modification,
  // la fiche montre la valeur enregistrée.
  const chosen = exercises.find((e) => e._id === exerciseId) ?? null;
  const inPanel = withPanel ? (chosen ?? shown[0] ?? null) : null;
  const selectedId = withPanel ? inPanel?._id : chosen?._id;

  const create = () => {
    if (!creatable || createMutation.isPending) return;
    createMutation.mutate(
      { name: creatable },
      {
        onSuccess: (created) => {
          setQuery('');
          openSheet(created._id);
        },
      }
    );
  };

  const confirmDeletion = () => {
    if (!pendingDeletion) return;
    deleteMutation.mutate(pendingDeletion._id, {
      onSuccess: () => {
        if (exerciseId === pendingDeletion._id) closeSheet();
        setPendingDeletion(null);
      },
    });
  };

  const sheetFor = (exercise: Exercise, onClose?: () => void) => (
    <ExerciseSheet
      key={exercise._id}
      exercise={exercise}
      onClose={onClose}
      onDelete={() => setPendingDeletion(exercise)}
    />
  );

  const empty = !isLoading && !isDown && exercises.length === 0;

  return (
    <Container
      maxW={withPanel ? '1280px' : COACH_CONTENT_MAX_W}
      py={{ base: 6, md: 8 }}
      px={4}
    >
      <Grid
        templateColumns={
          withPanel
            ? { lg: 'minmax(0, 1fr) 380px', xl: 'minmax(0, 1fr) 420px' }
            : '1fr'
        }
        gap="24px"
        alignItems="start"
      >
        <VStack align="stretch" gap="14px" minW={0}>
          <HStack gap="12px" align="baseline">
            {/* Le nom de l'onglet : l'écran s'est appelé « Mes exercices »
                sous une entrée « Bibliothèque ». */}
            <Text
              as="h1"
              fontWeight="800"
              fontSize={{ base: '26px', md: '32px' }}
              lineHeight="1.05"
            >
              Exercices
            </Text>
            {exercises.length > 0 && (
              <Text color="fg.muted" data-exercise-count>
                {libraryCount(exercises.length)}
              </Text>
            )}
          </HStack>

          <HStack gap="10px">
            <SearchField
              value={query}
              onChange={setQuery}
              label="Chercher ou créer un exercice"
              onEnter={create}
            />
            {exercises.length > 1 && (
              <SortMenu value={sort} options={SORTS} onChange={setSort} />
            )}
          </HStack>

          {isLoading && (
            <ExerciseSectionSkeleton titleWidth="250px" count={8} />
          )}

          {/* Une panne affichait la bibliothèque vide, avec l'invitation à
              créer un premier exercice : de quoi faire croire au coach que
              tout ce qu'il avait saisi avait disparu. */}
          {isDown && (
            <LoadFailure
              query={exercisesQuery}
              line="Tes exercices n'ont pas bougé. Vérifie ta connexion, puis réessaie."
            />
          )}

          {empty && !creatable && (
            <EmptyState
              mood="hello"
              title="Ta bibliothèque est vide"
              line="Tape le nom d'un mouvement pour le créer. Tu peux aussi les créer en écrivant un programme : ils arrivent ici tout seuls."
            />
          )}

          {shown.length > 0 && (
            <Box
              bg="surface.card"
              borderRadius="card"
              overflow="hidden"
              data-exercise-list
            >
              {shown.map((exercise) => (
                <LibraryRow
                  key={exercise._id}
                  exercise={exercise}
                  selected={exercise._id === selectedId}
                  onOpen={() => openSheet(exercise._id)}
                />
              ))}
            </Box>
          )}

          {/* Le champ crée aussi : un mouvement absent se tape, et existe. */}
          {creatable && (
            <>
              <chakra.button
                type="button"
                onClick={create}
                display="flex"
                alignItems="center"
                gap="10px"
                px="16px"
                minH="54px"
                borderRadius="card"
                boxShadow="inset 0 0 0 1.5px {colors.app.primary}"
                color="app.primary"
                fontWeight="700"
                textAlign="left"
                _hover={{ bg: 'app.primary/12' }}
                data-create-exercise
              >
                <LuPlus size={18} aria-hidden />
                <span>
                  Créer «{NBSP}
                  {creatable}
                  {NBSP}»
                </span>
              </chakra.button>
              {shown.length === 0 && (
                <Text fontSize="sm" color="fg.muted" textAlign="center">
                  Aucun exercice ne porte ce nom.
                </Text>
              )}
            </>
          )}
        </VStack>

        {withPanel && inPanel && (
          <Box
            position="sticky"
            top="24px"
            bg="surface.card"
            borderRadius="card"
            p="20px"
            data-exercise-panel={inPanel._id}
          >
            {sheetFor(inPanel)}
          </Box>
        )}
      </Grid>

      {/* Sous 1 024 px, la même fiche dans une feuille basse : le retour du
          téléphone la referme, puisqu'elle vit dans l'adresse. */}
      {!withPanel && chosen && (
        <Portal>
          <Sheet label={chosen.name} onDismiss={closeSheet}>
            {sheetFor(chosen, closeSheet)}
          </Sheet>
        </Portal>
      )}

      <Dialog.Root
        role="alertdialog"
        open={!!pendingDeletion}
        onOpenChange={(e) => !e.open && setPendingDeletion(null)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              bg="bg.canvas"
              borderColor="whiteAlpha.100"
              borderWidth="1px"
              maxW="sm"
            >
              <Dialog.Header>
                <Dialog.Title>Supprimer cet exercice ?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text color="fg.muted" fontSize="sm">
                  «&nbsp;{pendingDeletion?.name}&nbsp;» sera retiré de tes
                  exercices. Cette action est définitive.
                </Text>
              </Dialog.Body>
              <Dialog.Footer gap={2} flexWrap="wrap">
                <Button
                  variant="ghost"
                  color="fg.muted"
                  onClick={() => setPendingDeletion(null)}
                >
                  Conserver
                </Button>
                <Button
                  bg="app.error"
                  color="bg.canvas"
                  fontWeight="bold"
                  onClick={confirmDeletion}
                  loading={deleteMutation.isPending}
                >
                  Supprimer
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Container>
  );
};

export default Exercises;
