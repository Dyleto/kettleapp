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
 * Les colonnes de la bibliothèque, à une seule adresse.
 *
 * Le champ de recherche s'étendait sur toute la largeur — mesuré à 1 620 px —
 * pendant que les résultats qu'il filtre s'arrêtaient à 660. Un filtre plus
 * large que ce qu'il filtre donne l'impression qu'il cherche ailleurs.
 *
 * L'en-tête et la liste tirent donc leur gabarit du même endroit : ils ne
 * peuvent plus diverger.
 */
const COLONNES = { base: '1fr', lg: '1fr 380px', xl: '1fr 460px' };

/**
 * À partir de combien d'exercices un index alphabétique sert à quelque chose.
 *
 * Neuf en-têtes de lettre pour dix exercices : la structure coûtait plus de
 * hauteur qu'elle n'en faisait gagner, et un index de neuf lettres pour dix
 * lignes ne raccourcit aucun trajet. Elle doit apparaître quand elle sert, pas
 * par principe.
 */
const SEUIL_INDEX = 25;
const GOUTTIERE = { base: 0, lg: 8 };

const Exercises = () => {
  useDocumentTitle('Bibliothèque');
  // L'exercice ouvert est dans l'URL, pas dans un état : un lien vers une
  // fiche s'envoie, et le retour du navigateur referme la fiche.
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

  // On relit l'exercice dans la liste plutôt que de garder une copie : après
  // une modification, la fiche doit montrer la valeur enregistrée.
  const selected = exercises.find((e) => e._id === exerciseId) ?? null;

  const filtered = useMemo(() => {
    const q = normalize(query);
    return exercises.filter((e) => normalize(e.name).includes(q));
  }, [exercises, query]);

  const trimmed = query.trim();
  const canCreate =
    trimmed.length > 0 &&
    !exercises.some((e) => normalize(e.name) === normalize(trimmed));

  // Groupement alphabétique (les accents rejoignent leur lettre de base : É→E)
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
   * Ce que le volet droit montre quand aucune fiche n'est ouverte.
   *
   * Un exercice jamais posé dans un programme n'y figure pas : ce serait
   * remplir la place avec ce qui sert le moins.
   */
  const lesPlusUtilises = useMemo(
    () =>
      [...exercises]
        .filter((e) => (e.usageCount ?? 0) > 0)
        .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
        .slice(0, 5),
    [exercises]
  );

  // En dessous du seuil, une liste simple et dense : les groupes existent
  // toujours, mais ils ne portent ni titre ni index.
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
   * Créer depuis l'en-tête.
   *
   * Il fallait taper un nom qui n'existe pas pour découvrir qu'on peut créer :
   * la seule porte d'entrée était un accident de recherche. Le bouton la
   * nomme. Il ne fabrique pas d'exercice sans nom pour autant — un nom est
   * déjà là, il crée ; sinon il amène le curseur là où on l'écrit.
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
          {/* Le repère de lettre se lisait comme un exercice d'une lettre :
              même graphie, même colonne, même couleur. Il passe donc dans la
              marge, avec un filet qui court jusqu'au bord — c'est un
              séparateur, pas une entrée de la liste. */}
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
                {/* Une lettre d'index n'est ni une action ni un endroit où
                  l'on se trouve : elle n'a rien à faire en ambre. Neuf
                  en-têtes dorés pour dix exercices, c'était aussi neuf
                  fausses invitations à cliquer. */}
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

      {/* La recherche crée aussi : un exercice absent se tape et existe,
          exactement comme dans le sélecteur de l'atelier. */}
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
        {/* L'en-tête et la recherche vivent dans la même colonne que la liste :
            le filtre fait exactement la largeur de ce qu'il filtre. */}
        <Grid templateColumns={COLONNES} gap={GOUTTIERE} alignItems="start">
          <VStack gap={4} align="stretch" minW={0}>
            {/* `space-between` sur une rangée qui ne se replie pas poussait
                la page de 27 px à 360 : « Bibliothèque », le compte et
                « Nouvel exercice » n'y tiennent pas d'un trait. `ml="auto"`
                donne le même écart maximal quand ils tiennent, et laisse le
                compte passer à la ligne quand ils ne tiennent pas. */}
            <HStack
              justify="flex-start"
              align="baseline"
              gap={3}
              rowGap={1}
              wrap="wrap"
            >
              {/* Le même nom que dans la navigation et dans l'onglet. L'écran
              s'appelait « Mes exercices » pendant qu'on y arrivait par
              « Bibliothèque » : trois noms pour un endroit, dont deux à un
              clic d'intervalle. */}
              <Text as="h1" fontSize="lg" fontWeight="bold">
                Bibliothèque
              </Text>
              <HStack gap={3} flexShrink={0} ml="auto" align="center">
                <Text fontSize="xs" color="fg.muted">
                  {filtered.length} exercice{filtered.length !== 1 ? 's' : ''}
                  {query && ` · « ${query} »`}
                </Text>
                {/* La création avait pour seule porte d'entrée un accident de
                    recherche : taper un nom qui n'existe pas. Le bouton la
                    nomme. */}
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
                    /* La moitié d'un écran de bureau ne peut pas rester une
                       phrase d'attente. À défaut d'une fiche, le volet montre
                       ce qui sert le plus — c'est aussi ce qu'on vient
                       rouvrir le plus souvent. */
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

            {/* Index alphabétique mobile — portail fixe, toujours visible */}
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
                  {/* Un index A–Z ne peut pas offrir 44 px par lettre : vingt-six
                      lettres feraient 1144 px de haut. 28 px est le compromis —
                      au-dessus du plancher WCAG 2.5.8, et l'index reste un
                      raccourci qu'on parcourt au pouce. */}
                  <VStack gap={0}>
                    {letters.map((letter) => (
                      <Box
                        key={letter}
                        as="button"
                        aria-label={`Aller à la lettre ${letter}`}
                        onClick={() => scrollToLetter(letter)}
                        // 10 px pour une cible qu'on vise au pouce, c'était
                        // sous tout seuil de lisibilité. 12 px dans une case
                        // de 28, soit 24 px réellement atteignables une fois
                        // les voisines déduites.
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

      {/* Sous 1024 px la fiche s'ouvre en tiroir : la même fiche, pas un
          second écran avec ses propres règles. */}
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
