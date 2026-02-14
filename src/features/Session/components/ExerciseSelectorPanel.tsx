import {
  Drawer,
  Input,
  VStack,
  Box,
  Text,
  HStack,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { useExercises } from "@/hooks/queries/useExercises";
import { useState, useMemo } from "react";
import { LuSearch, LuPlus, LuX } from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Exercise } from "@/types";

interface ExerciseSelectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: "warmup" | "workout";
  onSelect: (exercise: Exercise) => void;
}

export const ExerciseSelectorPanel = ({
  isOpen,
  onClose,
  type,
  onSelect,
}: ExerciseSelectorPanelProps) => {
  const { data: exercises = [], isLoading } = useExercises();
  const [searchQuery, setSearchQuery] = useState("");
  const colors = useThemeColors();

  // Filtrage des exercices
  const filteredExercises = useMemo(() => {
    return exercises.filter(
      (ex) =>
        (type === "warmup" ? ex.type === "warmup" : ex.type === "exercise") &&
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [exercises, searchQuery, type]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content bg="gray.900">
          <Drawer.Header borderBottomWidth="1px" borderColor="whiteAlpha.100">
            <HStack justify="space-between">
              <Drawer.Title>
                Ajouter un {type === "warmup" ? "échauffement" : "exercice"}
              </Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button size="sm" variant="ghost" onClick={onClose}>
                  <LuX />
                </Button>
              </Drawer.CloseTrigger>
            </HStack>
          </Drawer.Header>
          <Drawer.Body p={4}>
            <VStack gap={4} align="stretch" h="full">
              {/* Barre de Recherche */}
              <Box position="relative">
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl={10}
                  bg="whiteAlpha.50"
                  border="none"
                />
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                >
                  <LuSearch />
                </Box>
              </Box>

              {/* Liste des résultats */}
              {isLoading ? (
                <Box textAlign="center" py={10}>
                  <Spinner />
                </Box>
              ) : (
                <VStack gap={2} align="stretch" overflowY="auto" flex={1}>
                  {filteredExercises.map((ex) => (
                    <Box
                      key={ex._id}
                      p={3}
                      borderRadius="md"
                      cursor="pointer"
                      bg="whiteAlpha.50"
                      _hover={{ bg: "whiteAlpha.100" }}
                      onClick={() => {
                        onSelect(ex);
                        // TODO: Demander reps/sets avant de fermer
                        onClose();
                      }}
                    >
                      <HStack justify="space-between">
                        <Text fontWeight="medium">{ex.name}</Text>
                      </HStack>
                    </Box>
                  ))}

                  {/* Bouton création rapide */}
                  {filteredExercises.length === 0 && searchQuery && (
                    <Button
                      variant="outline"
                      h="60px"
                      borderStyle="dashed"
                      borderColor="whiteAlpha.300"
                      color="gray.400"
                      _hover={{
                        bg: "whiteAlpha.50",
                        borderColor: colors.primary,
                      }}
                      onClick={() => {
                        console.log("Créer nouveau", searchQuery);
                      }}
                    >
                      <VStack gap={0}>
                        <LuPlus size={20} />
                        <Text fontSize="sm">Créer "{searchQuery}"</Text>
                      </VStack>
                    </Button>
                  )}
                </VStack>
              )}
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};
