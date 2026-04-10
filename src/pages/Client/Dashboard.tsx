import {
  CompleteSessionModal,
  NextSessionCard,
  SessionHistoryCard,
  mockProgram,
  mockCompleted,
} from "@/features/client";
import { useAuth } from "@/contexts/AuthContext";
import { CompletedSession, SessionMetrics } from "@/types";
import {
  Box,
  Container,
  Grid,
  Heading,
  HStack,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Header } from "@/components/Header";

const ClientDashboard = () => {
  const colors = useThemeColors();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completed, setCompleted] = useState<CompletedSession[]>(mockCompleted);

  const { sessions } = mockProgram;

  // Historique trié du plus récent au plus ancien
  const history = [...completed].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  // Dernière séance complétée
  const lastCompleted = history[0];

  // Prochaine séance (cyclique)
  const nextSession = lastCompleted
    ? sessions.find(
        (s) => s.order === (lastCompleted.sessionOrder % sessions.length) + 1,
      )
    : sessions[0];

  // Trouver l'index de la dernière complétion de la séance finale du cycle
  const lastCycleEndIndex = history.findIndex(
    (c) => c.sessionOrder === sessions.length,
  );

  // Cycle courant = tout ce qui précède cette complétion
  // Si le cycle n'a jamais été complété → tout l'historique
  // Si la séance finale vient d'être complétée (index 0) → on montre 4/4
  const currentCycleCompleted =
    lastCycleEndIndex === -1
      ? history
      : lastCycleEndIndex === 0
        ? []
        : history.slice(0, lastCycleEndIndex);

  const handleSubmitLog = (metrics: SessionMetrics, clientNotes: string) => {
    if (!nextSession) return;
    const newCompleted: CompletedSession = {
      _id: `log-${Date.now()}`,
      completedAt: new Date(),
      originalSessionId: nextSession._id,
      sessionOrder: nextSession.order,
      warmup: nextSession.warmup,
      workout: nextSession.workout,
      coachNotes: nextSession.notes,
      metrics,
      clientNotes,
    };
    setCompleted((prev) => [...prev, newCompleted]);
    setIsModalOpen(false);
  };

  return (
    <Container py={8} px={4}>
      <VStack gap={8} align="stretch">
        {/* Greeting */}
        <HStack justify="space-between" w="100%" px={2} align="start">
          <VStack gap={0}>
            <Text fontSize="xl" fontWeight="bold" ml={5}>
              Bonjour {user?.firstName},
            </Text>
          </VStack>

          <Header />
        </HStack>

        {/* Progression du cycle */}
        <Box
          p={4}
          bg="whiteAlpha.50"
          borderRadius="lg"
          borderWidth="1px"
          borderColor="whiteAlpha.100"
        >
          <HStack justify="space-between" mb={3}>
            <HStack gap={2}>
              <LuRefreshCw size={13} color={colors.primaryHex} />
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={colors.primary}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Cycle en cours
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.400">
              {currentCycleCompleted.length} / {sessions.length} séances
            </Text>
          </HStack>
          <HStack gap={2}>
            {sessions.map((s) => {
              const isDone = currentCycleCompleted.some(
                (c) => c.originalSessionId === s._id,
              );
              return (
                <Box
                  key={s._id}
                  flex={1}
                  h="6px"
                  borderRadius="full"
                  bg={isDone ? colors.primary : "whiteAlpha.200"}
                  transition="background 0.3s"
                />
              );
            })}
          </HStack>
        </Box>

        {/* Prochaine séance */}
        {nextSession ? (
          <Box maxW="2xl" mx="auto" w="full">
            <NextSessionCard
              session={nextSession}
              onComplete={() => setIsModalOpen(true)}
            />
          </Box>
        ) : (
          <Box
            p={8}
            textAlign="center"
            bg="whiteAlpha.50"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
          >
            <Text fontSize="lg" fontWeight="bold" mb={1}>
              Programme terminé 🎉
            </Text>
            <Text color="gray.400" fontSize="sm">
              Toutes les séances sont complétées. Ton coach prépare la suite.
            </Text>
          </Box>
        )}

        {/* Historique */}
        {history.length > 0 && (
          <VStack align="stretch" gap={4}>
            <Separator borderColor="whiteAlpha.100" />
            <Heading size="sm" color="gray.400">
              Séances complétées
            </Heading>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
              }}
              gap={4}
              alignItems="start"
            >
              {history.map((c) => (
                <SessionHistoryCard key={c._id} completed={c} />
              ))}
            </Grid>
          </VStack>
        )}
      </VStack>

      {/* Modal de complétion */}
      <CompleteSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitLog}
      />
    </Container>
  );
};

export default ClientDashboard;
