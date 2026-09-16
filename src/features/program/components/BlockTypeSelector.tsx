import { BlockType } from '@/types';
import {
  BLOCK_ACCENT_COLOR,
  BLOCK_FAMILIES,
  BLOCK_TYPE_CONFIG,
  getBlockAccent,
  getBlockDescription,
} from '@/features/program/constants';
import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';

interface BlockTypeSelectorProps {
  onSelect: (type: BlockType) => void;
}

export const BlockTypeSelector = ({ onSelect }: BlockTypeSelectorProps) => (
  <VStack align="stretch" gap={4}>
    {BLOCK_FAMILIES.map((family) => (
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
        <Grid
          templateColumns={{ base: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }}
          gap={2}
        >
          {family.types.map((type) => {
            const { label } = BLOCK_TYPE_CONFIG[type];
            return (
              <Box
                key={type}
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
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'app.primary',
                  outlineOffset: '2px',
                }}
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
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="fg"
                      lineHeight="shorter"
                    >
                      {label}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted" lineHeight="shorter">
                    {getBlockDescription(type)}
                  </Text>
                </VStack>
              </Box>
            );
          })}
        </Grid>
      </Box>
    ))}
  </VStack>
);
