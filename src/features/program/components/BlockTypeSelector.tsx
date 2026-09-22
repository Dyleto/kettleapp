import { useState } from 'react';
import { BlockType } from '@/types';
import {
  BLOCK_ACCENT_COLOR,
  BLOCK_FAMILIES,
  BLOCK_TYPES_COURANTS,
  BLOCK_TYPE_CONFIG,
  getBlockAccent,
  getBlockDescription,
} from '@/features/program/constants';
import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
}

/** One format tile: the name, its family colour, what it does. */
const Tuile = ({
  type,
  onSelect,
}: {
  type: BlockType;
  onSelect: (type: BlockType) => void;
}) => {
  const { label } = BLOCK_TYPE_CONFIG[type];
  return (
    <Box
      as="button"
      p={3}
      borderRadius="lg"
      transition="all 0.15s"
      textAlign="left"
      minH="72px"
      bg="whiteAlpha.50"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      onClick={() => onSelect(type)}
      _hover={{ bg: 'app.primary/12', borderColor: 'app.primary/50' }}
    >
      <VStack align="start" gap={1}>
        <HStack gap={2}>
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={BLOCK_ACCENT_COLOR[getBlockAccent(type)]}
            flexShrink={0}
          />
          <Text fontSize="sm" fontWeight="bold" color="fg" lineHeight="shorter">
            {label}
          </Text>
        </HStack>
        <Text fontSize="xs" color="fg.muted" lineHeight="shorter">
          {getBlockDescription(type)}
        </Text>
      </VStack>
    </Box>
  );
};

const Grille = ({
  types,
  onSelect,
}: {
  types: BlockType[];
  onSelect: (type: BlockType) => void;
}) => (
  <Grid
    templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }}
    gap={2}
  >
    {types.map((type) => (
      <Tuile key={type} type={type} onSelect={onSelect} />
    ))}
  </Grid>
);

export const BlockTypeSelector = ({ onSelect }: BlockTypeSelectorProps) => {
  const [toutVoir, setToutVoir] = useState(false);

  // The families, once the formats already offered above are removed: a
  // family that is entirely common disappears from the fold rather than
  // sitting there empty.
  const restantes = BLOCK_FAMILIES.map((f) => ({
    ...f,
    types: f.types.filter((t) => !BLOCK_TYPES_COURANTS.includes(t)),
  })).filter((f) => f.types.length > 0);

  return (
    /* A stable anchor for measurements, like `data-block-type` on a block:
       a probe that recognised tiles by their size also caught the rail's rows
       as soon as they grew. */
    <VStack align="stretch" gap={4} data-block-picker>
      <Box>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wider"
          mb={2}
        >
          Formats courants
        </Text>
        <Grille types={BLOCK_TYPES_COURANTS} onSelect={onSelect} />
      </Box>

      {!toutVoir ? (
        <Box
          as="button"
          alignSelf="flex-start"
          minH="44px"
          display="flex"
          alignItems="center"
          fontSize="sm"
          color="fg.muted"
          _hover={{ color: 'app.primary' }}
          onClick={() => setToutVoir(true)}
        >
          <HStack gap={1.5}>
            <LuChevronDown size={14} />
            <Text as="span">
              Autres formats (
              {restantes.reduce((n, f) => n + f.types.length, 0)})
            </Text>
          </HStack>
        </Box>
      ) : (
        restantes.map((family) => (
          <Box key={family.key}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              {family.label}
            </Text>
            <Grille types={family.types} onSelect={onSelect} />
          </Box>
        ))
      )}
    </VStack>
  );
};
