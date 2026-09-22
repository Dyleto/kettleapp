import { ExerciseSectionSkeleton } from '@/components/skeletons';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useExercises } from '@/features/exercise/hooks/useExercises';
import {
  useCreateExercise,
  useDeleteExercise,
} from '@/features/exercise/hooks/useExerciseMutations';
import { useToastError } from '@/hooks/useToastError';
import { Exercise } from '@/types';
import {
  Box,
  Button,
  Container,
  Dialog,
  Drawer,
  Grid,
  HStack,
  Input,
  Portal,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LuPlus, LuSearch, LuX } from 'react-icons/lu';
import { createPortal } from 'react-dom';
import { COACH_ROUTES } from '@/config/routes';
import { ExerciseRow, ExerciseSheet } from '@/features/exercise';
import { stripAccents } from '@/utils/formatters';

const normalize = (s: string) => stripAccents(s).toLowerCase().trim();

/**
 * The library's columns, at a single address.
 *
 * The search field stretched the full width — measured at 1,620 px — while
 * the results it filters stopped at 660. A filter wider than what it filters
 * looks like it is searching somewhere else.
 *
 * The header and the list therefore take their template from the same place:
 * they can no longer drift apart.
 */
const COLONNES = { base: '1fr', lg: '1fr 380px', xl: '1fr 460px' };

/**
 * From how many exercises an alphabetical index starts being useful.
 *
 * Nine letter headers for ten exercises: the structure cost more height than
 * it saved, and a nine-letter index over ten rows shortens no journey. It
 * should appear when it serves, not on principle.
 */
const SEUIL_INDEX = 25;
const GOUTTIERE = { base: 0, lg: 8 };

const Exercises = () => {
  useDocumentTitle('Bibliothèque');
  // The open exercise lives in the URL, not in state: a link to a card can
  // be sent, and the browser's back button closes the card.
  const { exerciseId } = useParams();
  const navigate = useNavigate();

  const { data: exercises = [], isLoading, error } = useExercises();
  const createMutation = useCreateExercise();
  const deleteMutation = useDeleteExercise();

  const [query, setQuery] = useState('');
  const [pendingDeletion, setPendingDeletion] = useState<Exercise | null>(null);

  const openSheet = (id: string) => navigate(COACH_ROUTES.exerciseDetails(id));
  const closeSheet = () => navigate(COACH_ROUTES.exercises);

  useToastError(error, 'Impossible de charger vos exercices');

  const isDesktop = useBreakpointValue({ base: false, lg: true });

  // We read the exercise back from the list rather than keeping a copy:
  // after an edit, the card must show the saved value.
  const selected = exercises.find((e) => e._id === exerciseId) ?? null;

  const filtered = useMemo(() => {
    const q = normalize(query);
    return exercises.filter((e) => normalize(e.name).includes(q));
  }, [exercises, query]);

  const trimmed = query.trim();
  const canCreate =
    trimmed.length > 0 &&
    !exercises.some((e) => normalize(e.name) === normalize(trimmed));

  // Alphabetical grouping (accents join their base letter: É→E).
  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
    const groups: { letter: string; exercises: Exercise[] }[] = [];
    sorted.forEach((ex) => {
      const letter = stripAccents(ex.name[0] ?? '').toUpperCase() || '#';
      const last = groups[groups.length - 1];
      if (last?.letter === letter) last.exercises.push(ex);
      else groups.push({ letter, exercises: [ex] });
    });
    return groups;
  }, [filtered]);

  /**
   * What the right pane shows when no card is open.
   *
   * An exercise never placed in a programme does not appear there: that would
   * be filling the space with what serves least.
   */
  const lesPlusUtilises = useMemo(
    () =>
      [...exercises]
        .filter((e) => (e.usageCount ?? 0) > 0)
        .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
        .slice(0, 5),
    [exercises]
  );

  // Below the threshold, a plain dense list: the groups still exist, but
  // they carry neither heading nor index.
  const indexe = filtered.length >= SEUIL_INDEX;
  const letters = indexe ? grouped.map((g) => g.letter) : [];

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollToLetter = (letter: string) => {
    sectionRefs.current[letter]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const create = () => {
    createMutation.mutate(
      { name: trimmed },
      {
        onSuccess: (response) => {
          setQuery('');
          openSheet(response.data._id);
        },
      }
    );
  };

  /**
   * Creating from the header.
   *
   * You had to type a name that does not exist to discover you could create:
   * the only way in was an accident of search. The button names it. It does
   * not make a nameless exercise for all that — if a name is already there it
   * creates; otherwise it takes the cursor to where you write one.
   */
  const champRecherche = useRef<HTMLInputElement>(null);
  const nouveau = () => {
    if (canCreate) return create();
    champRecherche.current?.focus();
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

  const sheet = selected && (
    <ExerciseSheet
      exercise={selected}
      onClose={closeSheet}
      onDelete={() => setPendingDeletion(selected)}
    />
  );

  const list = (
    <VStack gap={0} align="stretch" pr={{ base: 9, lg: 0 }}>
      {grouped.map(({ letter, exercises: group }) => (
        <Box
          key={letter}
          ref={(el: HTMLDivElement | null) => {
            sectionRefs.current[letter] = el;
          }}
        >
          {/* The letter marker read as a one-letter exercise: same type,
              same column, same colour. So it moves into the margin, with a
              rule running to the edge — it is a separator, not a list
              entry. */}
          {indexe && (
            <Box
              position="sticky"
              top={0}
              zIndex={1}
              bg="bg.canvas"
              pt={5}
              pb={1}
            >
              <HStack gap={2} align="center">
                {/* An index letter is neither an action nor a place you are:
                  it has no business being amber. Nine gold headers for ten
                  exercises was also nine false invitations to click. */}
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="fg.muted"
                  letterSpacing="widest"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {letter}
                </Text>
                <Box flex={1} h="1px" bg="whiteAlpha.100" />
              </HStack>
            </Box>
          )}
          {group.map((exercise) => (
            <ExerciseRow
              key={exercise._id}
              exercise={exercise}
              selected={selected?._id === exercise._id}
              onClick={() => openSheet(exercise._id)}
            />
          ))}
        </Box>
      ))}

      {/* Search also creates: a missing exercise is typed and exists,
          exactly as in the editor's selector. */}
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
          _focusVisible={{
            outlineOffset: '-2px',
          }}
          onClick={create}
        >
          <HStack gap={1.5}>
            <LuPlus size={13} />
            <Text as="span">Créer «&nbsp;{trimmed}&nbsp;»</Text>
          </HStack>
        </Box>
      )}
    </VStack>
  );

  return (
    <Container maxW="container.xl" py={6}>
      <VStack gap={4} align="stretch">
        {/* The header and search live in the same column as the list: the
            filter is exactly as wide as what it filters. */}
        <Grid templateColumns={COLONNES} gap={GOUTTIERE} alignItems="start">
          <VStack gap={4} align="stretch" minW={0}>
            {/* `space-between` on a row that does not wrap pushed the page
                27 px wide at 360: "Bibliothèque", the count and "Nouvel
                exercice" do not fit in one line there. `ml="auto"` gives the
                same maximum gap when they do fit, and lets the count wrap
                when they do not. */}
            <HStack
              justify="flex-start"
              align="baseline"
              gap={3}
              rowGap={1}
              wrap="wrap"
            >
              {/* The same name as in the navigation and in the tab. The screen
              was called "Mes exercices" while you reached it through
              "Bibliothèque": three names for one place, two of them one
              click apart. */}
              <Text as="h1" fontSize="lg" fontWeight="bold">
                Bibliothèque
              </Text>
              <HStack gap={3} flexShrink={0} ml="auto" align="center">
                <Text fontSize="xs" color="fg.muted">
                  {filtered.length} exercice{filtered.length !== 1 ? 's' : ''}
                  {query && ` · « ${query} »`}
                </Text>
                {/* Creation's only way in was an accident of search: typing
                    a name that does not exist. The button names it. */}
                <Box
                  as="button"
                  onClick={nouveau}
                  fontSize="sm"
                  fontWeight="bold"
                  color="app.primary"
                  minH="44px"
                  display="flex"
                  alignItems="center"
                  _hover={{ color: 'app.primary.hover' }}
                >
                  <HStack gap={1}>
                    <LuPlus size={13} />
                    <Text as="span">Nouvel exercice</Text>
                  </HStack>
                </Box>
              </HStack>
            </HStack>

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
                ref={champRecherche}
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
              {query && (
                <Box
                  as="button"
                  aria-label="Effacer la recherche"
                  color="fg.muted"
                  _hover={{ color: 'fg' }}
                  flexShrink={0}
                  onClick={() => setQuery('')}
                >
                  <LuX size={13} />
                </Box>
              )}
            </HStack>
          </VStack>
        </Grid>

        {isLoading ? (
          <ExerciseSectionSkeleton titleWidth="250px" count={8} />
        ) : filtered.length === 0 && !canCreate ? (
          <Box py={16} textAlign="center" color="fg.muted" fontSize="sm">
            Aucun exercice — tapez un nom pour en créer un
          </Box>
        ) : (
          <>
            <Grid templateColumns={COLONNES} gap={GOUTTIERE} alignItems="start">
              <Box minW={0}>{list}</Box>

              {isDesktop && (
                <Box
                  position="sticky"
                  top="80px"
                  alignSelf="start"
                  minW={0}
                  pt={4}
                  borderLeftWidth="2px"
                  borderLeftColor={selected ? 'app.primary' : 'whiteAlpha.200'}
                  pl={5}
                >
                  {selected ? (
                    sheet
                  ) : (
                    /* Half a desktop screen cannot stay a waiting sentence. For
                       want of a card, the pane shows what serves most — which
                       is also what gets reopened most often. */
                    <VStack align="stretch" gap={3}>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        color="fg.muted"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Les plus utilisés
                      </Text>
                      {lesPlusUtilises.length === 0 ? (
                        <Text fontSize="sm" color="fg.muted">
                          Aucun exercice n'est encore posé dans un programme.
                        </Text>
                      ) : (
                        <VStack align="stretch" gap={0}>
                          {lesPlusUtilises.map((exercise) => (
                            <ExerciseRow
                              key={exercise._id}
                              exercise={exercise}
                              selected={false}
                              onClick={() => openSheet(exercise._id)}
                            />
                          ))}
                        </VStack>
                      )}
                      <Text fontSize="xs" color="fg.muted">
                        Choisissez un exercice pour voir et modifier sa fiche.
                      </Text>
                    </VStack>
                  )}
                </Box>
              )}
            </Grid>

            {/* Mobile alphabetical index — a fixed portal, always visible */}
            {!isDesktop &&
              letters.length > 1 &&
              createPortal(
                <Box
                  position="fixed"
                  right={3}
                  top="50%"
                  style={{ transform: 'translateY(-50%)' }}
                  zIndex={1000}
                  bg="blackAlpha.700"
                  backdropFilter="blur(6px)"
                  borderRadius="full"
                  py={2}
                  px={1}
                >
                  {/* An A–Z index cannot give 44 px per letter: twenty-six
                      letters would be 1,144 px tall. 28 px is the compromise
                      — above the WCAG 2.5.8 floor, and the index stays a
                      shortcut you run a thumb down. */}
                  <VStack gap={0}>
                    {letters.map((letter) => (
                      <Box
                        key={letter}
                        as="button"
                        aria-label={`Aller à la lettre ${letter}`}
                        onClick={() => scrollToLetter(letter)}
                        // 10 px for a target aimed at with a thumb was
                        // below any legibility threshold. 12 px in a 28 px
                        // cell, so 24 px genuinely reachable once the
                        // neighbours are deducted.
                        fontSize="xs"
                        fontWeight="bold"
                        color="whiteAlpha.800"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        minW="28px"
                        minH="28px"
                        _hover={{ color: 'app.primary' }}
                        _focusVisible={{
                          outlineOffset: '-2px',
                        }}
                        userSelect="none"
                      >
                        {letter}
                      </Box>
                    ))}
                  </VStack>
                </Box>,
                document.body
              )}
          </>
        )}
      </VStack>

      {/* Below 1024 px the card opens in a drawer: the same card, not a
          second screen with its own rules. */}
      <Drawer.Root
        open={!isDesktop && !!selected}
        onOpenChange={(e) => !e.open && closeSheet()}
        size="full"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="bg.canvas">
              <Drawer.Body p={5}>{sheet}</Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

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
                  «&nbsp;{pendingDeletion?.name}&nbsp;» sera retiré de votre
                  bibliothèque. Cette action est définitive.
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
