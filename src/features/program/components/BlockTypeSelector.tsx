import { BlockType } from "@/types";
import {
  BLOCK_TYPE_CONFIG,
  BLOCK_TYPES_ORDERED,
} from "@/constants/blockTypes";
import { Box, Grid, Text, VStack } from "@chakra-ui/react";

const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  warmup:  "Échauffement libre",
  classic: "Séries & reps classiques",
  emom:    "1 exo par minute",
  every:   "Circuit toutes les X min",
  amrap:   "Max de tours en temps limité",
  timecap: "Terminer avant la limite",
  chipper: "Liste à faire en 1 passe",
  tabata:  "20s / 10s × N tours",
  onoff:   "Xon / Xoff × N tours",
  pyramid: "Reps qui montent et descendent",
  ladder:  "Reps qui augmentent ou diminuent",
};

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
}

export const BlockTypeSelector = ({ onSelect }: BlockTypeSelectorProps) => (
  <Grid
    templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }}
    gap={2}
  >
    {BLOCK_TYPES_ORDERED.map((type) => {
      const { label, color } = BLOCK_TYPE_CONFIG[type];
      return (
        <Box
          key={type}
          as="button"
          p={3}
          borderRadius="lg"
          bg={`${color}12`}
          borderWidth="1px"
          borderColor={`${color}30`}
          onClick={() => onSelect(type)}
          _hover={{ bg: `${color}25`, borderColor: `${color}60` }}
          transition="all 0.15s"
          textAlign="left"
          minH="72px"
        >
          <VStack align="start" gap={1}>
            <Box w="8px" h="8px" borderRadius="full" bg={color} />
            <Text fontSize="sm" fontWeight="bold" color={color} lineHeight="shorter">
              {label}
            </Text>
            <Text fontSize="2xs" color="gray.500" lineHeight="shorter">
              {BLOCK_DESCRIPTIONS[type]}
            </Text>
          </VStack>
        </Box>
      );
    })}
  </Grid>
);
