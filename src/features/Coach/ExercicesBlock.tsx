import ClickableCard from "@/components/clickableCard";
import { Box, HStack, VStack } from "@chakra-ui/react";
import { LuDumbbell, LuFlame, LuArrowRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

const ExercicesBlock = () => {
  const navigate = useNavigate();

  return (
    <ClickableCard onClick={() => navigate("/coach/exercises")} color="yellow.400" minW="50%">
      <VStack gap={4} align="stretch">
        {/* En-tête */}
        <HStack justify="space-between" align="start" gap={8}>
          <VStack align="start" gap={2}>
            <Box fontSize="2xl" fontWeight="bold" color="fg">
              📚 Mes exercices
            </Box>
            <Box fontSize="md" color="gray.400">
              Gérez mes échauffements et exercices
            </Box>
          </VStack>

          {/* Icône flèche visible à droite */}
          <Box color="yellow.400" fontSize="2xl" flexShrink={0}>
            <LuArrowRight />
          </Box>
        </HStack>

        {/* Statistiques */}
        <HStack gap={6} mt={2}>
          <HStack gap={2}>
            <Box p={2} bg="orange.400/10" borderRadius="md" borderWidth="1px" borderColor="orange.400/30">
              <LuFlame size={20} color="#fb923c" />
            </Box>
            <VStack gap={0} align="start">
              <Box fontSize="xl" fontWeight="bold" color="white">
                12
              </Box>
              <Box fontSize="xs" color="gray.400">
                échauffements
              </Box>
            </VStack>
          </HStack>

          <HStack gap={2}>
            <Box p={2} bg="yellow.400/10" borderRadius="md" borderWidth="1px" borderColor="yellow.400/30">
              <LuDumbbell size={20} color="#fbbf24" />
            </Box>
            <VStack gap={0} align="start">
              <Box fontSize="xl" fontWeight="bold" color="white">
                24
              </Box>
              <Box fontSize="xs" color="gray.400">
                exercices
              </Box>
            </VStack>
          </HStack>
        </HStack>
      </VStack>
    </ClickableCard>
  );
};

export default ExercicesBlock;
