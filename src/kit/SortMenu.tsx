import { Box, chakra, HStack, Menu, Portal, Text } from '@chakra-ui/react';
import { LuArrowUpDown, LuCheck } from 'react-icons/lu';

/**
 * Le tri d'une liste, dans un menu : l'ordre par défaut suffit presque
 * toujours, les autres se demandent.
 *
 * Né dans la liste des clients, où trois pastilles vivaient en permanence
 * sous la recherche (F4a) ; la bibliothèque d'exercices en a besoin aussi
 * — par nom, ou « Les plus utilisés ». Le bouton dit le tri en cours, et
 * son nom le dit aussi à un lecteur d'écran : « Trier : A → Z ».
 */
export const SortMenu = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) => {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Menu.Root
      onSelect={(details) => onChange(details.value as T)}
      positioning={{ placement: 'bottom-end' }}
    >
      <Menu.Trigger asChild>
        <chakra.button
          type="button"
          aria-label={`Trier : ${current.label}`}
          display="flex"
          alignItems="center"
          gap="8px"
          minH="50px"
          px="16px"
          borderRadius="17px"
          bg="surface.card"
          boxShadow="inset 0 0 0 1.5px {colors.line}"
          color="fg"
          fontWeight="600"
          flexShrink={0}
          _hover={{ bg: 'bg.raised' }}
        >
          <LuArrowUpDown size={17} aria-hidden />
          <Text as="span" display={{ base: 'none', sm: 'inline' }}>
            {current.label}
          </Text>
        </chakra.button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg="bg.surface"
            borderWidth="1px"
            borderRadius="xl"
            padding={1}
            minW="200px"
          >
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                value={option.value}
                cursor="pointer"
                borderRadius="md"
                _hover={{ bg: 'whiteAlpha.100' }}
                aria-current={option.value === value ? 'true' : undefined}
              >
                <HStack justify="space-between" w="full" gap={3}>
                  <Text>{option.label}</Text>
                  {option.value === value && (
                    <Box color="app.primary">
                      <LuCheck size={16} aria-hidden />
                    </Box>
                  )}
                </HStack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
