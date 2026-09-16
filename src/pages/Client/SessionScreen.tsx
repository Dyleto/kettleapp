import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Container,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import {
  CLIENT_CONTENT_MAX_W,
  CompleteSessionModal,
  GuidedSession,
  RecordPerformed,
  SessionDetail,
  SuggestedDays,
  getSessionSummary,
  useClientSessions,
} from '@/features/client';
import { PerformedEntry, PerformedValues } from '@/types';
import { truncateAtFirstEmpty } from '@/features/client/performedFormat';
import { CLIENT_ROUTES } from '@/config/routes';
import { EtatVide } from '@/components/EtatVide';
import { hitArea } from '@/components/hitArea';

// Le réalisé se saisit exercice par exercice pendant la séance, puis part en
// une fois avec le bilan. La clé est « ordre du bloc : ordre de l'exercice »,
// exactement l'adressage attendu par l'API. Un exercice sans une seule série
// renseignée n'est pas envoyé du tout : rien à dire n'est pas une valeur.
const toPerformedEntries = (
  performed: Record<string, PerformedValues>
): PerformedEntry[] =>
  Object.entries(performed)
    .map(([key, value]) => {
      const [blockOrder, exerciseOrder] = key.split(':').map(Number);
      return {
        blockOrder,
        exerciseOrder,
        sets: truncateAtFirstEmpty(value.sets ?? []),
      };
    })
    .filter((entry) => entry.sets.length > 0);

type ClientSessionsData = ReturnType<typeof useClientSessions>;

const SessionScreen = () => {
  const navigate = useNavigate();
  const {
    sessions,
    activeSession,
    handleSubmitLog,
    isLoading,
    isSubmitting,
    lastPerformance,
  } = useOutletContext<ClientSessionsData>();
  const [isGuidedOpen, setIsGuidedOpen] = useState(false);
  useDocumentTitle(
    activeSession ? `Séance ${activeSession.order}` : undefined
  );

  // Terminer une séance se déroule en deux temps : « tu veux noter tes
  // charges ? », puis le bilan. `idle` couvre la lecture, où l'écran ne
  // demande rien.
  const [flow, setFlow] = useState<'idle' | 'record' | 'review'>('idle');

  const [performed, setPerformed] = useState<Record<string, PerformedValues>>(
    {}
  );

  // La saisie appartient à une séance précise : passer à une autre depuis le
  // programme ne doit pas traîner les poids de la précédente dans le bilan.
  const [performedFor, setPerformedFor] = useState(activeSession?._id);
  if (activeSession?._id !== performedFor) {
    setPerformedFor(activeSession?._id);
    setPerformed({});
    setFlow('idle');
  }

  const handlePerformedChange = useCallback(
    (key: string, next: PerformedValues) =>
      setPerformed((prev) => ({ ...prev, [key]: next })),
    []
  );

  if (isLoading) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <VStack align="stretch" gap={4}>
          <Skeleton h="20px" w="120px" borderRadius="md" />
          <Skeleton h="80px" borderRadius="lg" />
          <Skeleton h="200px" borderRadius="lg" />
        </VStack>
      </Container>
    );
  }

  if (sessions.length === 0) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <EtatVide
          titre="Pas encore de programme"
          phrase="Ton coach n'a pas encore ajouté de séances. Reviens bientôt."
        />
      </Container>
    );
  }

  if (!activeSession) {
    return (
      <Container maxW={CLIENT_CONTENT_MAX_W} py={8} px={4}>
        <Box
          p={8}
          textAlign="center"
          bg="whiteAlpha.50"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="lg" fontWeight="bold" mb={1}>
            Séance introuvable
          </Text>
          <Text color="fg.muted" fontSize="sm" mb={4}>
            Cette séance n'existe plus dans ton programme.
          </Text>
          <Button
            variant="outline"
            borderColor="whiteAlpha.200"
            onClick={() => navigate(CLIENT_ROUTES.program)}
          >
            Voir le programme
          </Button>
        </Box>
      </Container>
    );
  }

  // « Séance choisie » disait « tu es arrivé ici en choisissant » — une
  // information qui n'intéresse personne, le client sachant qu'il a cliqué.
  // Elle occupait pourtant la place, la forme et la couleur d'un état de
  // séance, et empêchait donc d'y lire ce que la séance, elle, a à dire.
  //
  // « À faire » est un état, pas une alerte. Le rouge dit « problème » partout
  // ailleurs dans l'application — il reste à l'effort et à l'erreur.
  const pillLabel = 'À faire';
  const pillColor = 'app.primary';
  const pillTextColor = 'app.primary';
  const hasExercises = activeSession.blocks.some((b) => b.exercises.length > 0);
  const summary =
    activeSession.blocks.length === 0
      ? 'Aucun bloc'
      : getSessionSummary(activeSession);

  return (
    <Container
      maxW={CLIENT_CONTENT_MAX_W}
      py={8}
      px={4}
      pb={{ base: '220px', md: 8 }}
    >
      <VStack align="stretch" gap={1} mb={4}>
        {/* On revient d'où l'on vient neuf fois sur dix : l'accueil. Le
            programme reste à un onglet de distance. Un vrai bouton, pas un
            HStack cliquable : il faut pouvoir l'atteindre au clavier. */}
        <Box
          as="button"
          aria-label="Revenir à Aujourd'hui"
          w="fit-content"
          css={hitArea()}
          onClick={() => navigate(CLIENT_ROUTES.today)}
          color="fg.muted"
          _hover={{ color: 'app.primary' }}
          transition="color 0.15s"
        >
          <HStack gap={1.5}>
            <LuArrowLeft size={13} />
            <Text fontSize="xs" fontWeight="medium">
              Aujourd'hui
            </Text>
          </HStack>
        </Box>
        <HStack justify="space-between" align="center">
          <Text as="h1" fontSize="xl" fontWeight="bold">
            Séance {activeSession.order}
          </Text>
          <Box
            px={2}
            py={0.5}
            borderRadius="full"
            bg={`${pillColor}/16`}
            fontSize="xs"
            fontWeight="bold"
            color={pillTextColor}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {pillLabel}
          </Box>
        </HStack>
        {/* Le rappel du jour, là où l'on décide de commencer ou non : le
            programme le disait, la fiche le taisait. Avec son libellé — on
            arrive ici depuis l'accueil sans forcément être passé par le
            programme, et deux pastilles nues se liraient « tu l'as faite
            lundi et jeudi ». `wrap` parce qu'une séance peut en porter sept. */}
        <HStack justify="space-between" align="center" gap={3} wrap="wrap">
          <Text fontSize="xs" color="fg.muted">
            {summary}
          </Text>
          <SuggestedDays days={activeSession.suggestedDays} withLabel />
        </HStack>
      </VStack>

      {/* En lecture, une séance se lit : pas de champ vide sous chaque
          exercice avant même de l'avoir commencée. La saisie arrive à la
          fin, dans RecordPerformed — mais ce qu'on avait mis la dernière
          fois s'affiche dès maintenant, c'est là qu'on en a besoin. */}
      <SessionDetail
        session={activeSession}
        lastPerformance={lastPerformance}
      />

      <VStack
        align="stretch"
        gap={2}
        mt={5}
        position={{ base: 'fixed', md: 'static' }}
        // Ancré au bas de l'écran plutôt qu'à 70 px : la barre d'onglets ne
        // fait pas exactement 70 px — elle dépend de la zone sûre du
        // téléphone — et l'écart laissait passer un filet de page entre les
        // deux. Le fond descend maintenant derrière la barre.
        bottom={{ base: 0, md: 'auto' }}
        left={{ base: 0, md: 'auto' }}
        right={{ base: 0, md: 'auto' }}
        bg={{ base: 'bg.canvas', md: 'transparent' }}
        p={{ base: 4, md: 0 }}
        pb={{
          base: 'calc(env(safe-area-inset-bottom, 0px) + 78px)',
          md: 0,
        }}
        borderTop={{ base: '1px solid', md: 'none' }}
        borderColor="whiteAlpha.100"
        zIndex={20}
      >
        {hasExercises && (
          <Button
            w="full"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            size="lg"
            onClick={() => setIsGuidedOpen(true)}
            _hover={{ bg: 'app.primary.hover' }}
          >
            Démarrer la séance
          </Button>
        )}
        <Button
          w="full"
          variant="outline"
          borderColor="whiteAlpha.200"
          color="fg"
          size="lg"
          onClick={() => setFlow('record')}
          _hover={{ bg: 'whiteAlpha.50' }}
        >
          J'ai terminé cette séance
        </Button>
      </VStack>

      {isGuidedOpen && (
        <GuidedSession
          session={activeSession}
          onExit={() => setIsGuidedOpen(false)}
          onFinish={() => {
            setIsGuidedOpen(false);
            setFlow('record');
          }}
          lastPerformance={lastPerformance}
        />
      )}

      {/* Remonté à chaque ouverture : la question repart de zéro plutôt que
          de rouvrir sur la saisie déjà dépliée. */}
      <RecordPerformed
        key={flow === 'record' ? 'record-open' : 'record-closed'}
        session={activeSession}
        isOpen={flow === 'record'}
        performed={performed}
        onPerformedChange={handlePerformedChange}
        lastPerformance={lastPerformance}
        onCancel={() => setFlow('idle')}
        onContinue={() => setFlow('review')}
      />

      <CompleteSessionModal
        isOpen={flow === 'review'}
        onClose={() => setFlow('idle')}
        onSubmit={(feedback, notes, completedAt) => {
          handleSubmitLog(
            feedback,
            notes,
            completedAt,
            toPerformedEntries(performed)
          );
          setFlow('idle');
        }}
        isLoading={isSubmitting}
      />
    </Container>
  );
};
export default SessionScreen;
