import { useState } from 'react';
import { BlockType } from '@/shared/types';
import {
  BLOCK_ACCENT_COLOR,
  BLOCK_FAMILIES,
  COMMON_BLOCK_TYPES,
  BLOCK_TYPE_CONFIG,
  getBlockAccent,
  getBlockDescription,
} from '@/features/program/constants';
import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
}

/** Une tuile de format : le nom, la couleur de sa famille, ce qu'il
 * fait. */
const TypeTile = ({
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

const TypeGrid = ({
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
      <TypeTile key={type} type={type} onSelect={onSelect} />
    ))}
  </Grid>
);

/**
 * Le choix d'un format : quatre tuiles, et le reste replié.
 *
 * Onze tuiles d'un coup, c'est un catalogue à lire là où il faut décider. Le
 * repli ne cache pas : il met les sept formats rares à un clic, et rend les
 * quatre courants lisibles d'un coup d'œil.
 */
export const BlockTypeSelector = ({ onSelect }: BlockTypeSelectorProps) => {
  const [toutVoir, setToutVoir] = useState(false);

  // Les familles, une fois retirés les formats déjà proposés au-dessus :
  // une famille entièrement courante disparaît du repli plutôt que d'y
  // figurer vide.
  const remainingFamilies = BLOCK_FAMILIES.map((f) => ({
    ...f,
    types: f.types.filter((t) => !COMMON_BLOCK_TYPES.includes(t)),
  })).filter((f) => f.types.length > 0);

  return (
    /* Un point d'ancrage stable pour les mesures, comme `data-block-type`
           sur un bloc : une sonde qui reconnaissait les tuiles à leur taille
           attrapait aussi les lignes du rail dès qu'elles grandissaient. */
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
        <TypeGrid types={COMMON_BLOCK_TYPES} onSelect={onSelect} />
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
              {remainingFamilies.reduce((n, f) => n + f.types.length, 0)})
            </Text>
          </HStack>
        </Box>
      ) : (
        remainingFamilies.map((family) => (
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
            <TypeGrid types={family.types} onSelect={onSelect} />
          </Box>
        ))
      )}
    </VStack>
  );
};
