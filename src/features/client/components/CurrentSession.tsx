import { Session, SessionMetrics } from "@/types";
import { CompleteSessionModal } from "./CompleteSessionModal";
import { NextSessionCard } from "./NextSessionCard";
import { Box, Text } from "@chakra-ui/react";
import { useState } from "react";

interface CurrentSessionProps {
  nextSession: Session | undefined;
  onComplete: (metrics: SessionMetrics, notes: string) => void;
}

export const CurrentSession = ({
  nextSession,
  onComplete,
}: CurrentSessionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = (metrics: SessionMetrics, notes: string) => {
    onComplete(metrics, notes);
    setIsModalOpen(false);
  };

  if (!nextSession) {
    return (
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
    );
  }

  return (
    <>
      <Box maxW="2xl" mx="auto" w="full">
        <NextSessionCard
          session={nextSession}
          onComplete={() => setIsModalOpen(true)}
        />
      </Box>
      <CompleteSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
};
