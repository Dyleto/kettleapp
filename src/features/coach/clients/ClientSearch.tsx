import { useRef } from 'react';
import { Box, chakra, HStack, Menu, Portal, Text } from '@chakra-ui/react';
import { LuArrowUpDown, LuCheck, LuSearch, LuX } from 'react-icons/lu';
import type { ClientSort } from '@/domain/clients/roster';
import { hitArea } from '@/kit';

/**
 * Le champ de recherche de la liste, à la forme des champs de la maquette :
 * un contour qui passe à l'ambre quand on y écrit, la croix pour vider.
 *
 * Il filtre à la frappe ; la règle — chaque mot, sans accent ni casse — est
 * celle du domaine (`matchesQuery`).
 */
export const ClientSearch = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <HStack
      flex={1}
      minW={0}
      gap="10px"
      minH="50px"
      px="16px"
      borderRadius="17px"
      bg="surface.card"
      boxShadow="inset 0 0 0 1.5px {colors.line}"
      _focusWithin={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
      color="fg.muted"
      onClick={() => input.current?.focus()}
    >
      <LuSearch size={18} aria-hidden />
      <chakra.input
        ref={input}
        type="search"
        aria-label="Chercher un client"
        placeholder="Chercher un client"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            onChange('');
          }
        }}
        flex={1}
        minW={0}
        bg="transparent"
        border="none"
        outline="none"
        color="fg"
        fontSize="15.5px"
        _placeholder={{ color: 'fg.muted' }}
        css={{ '&::-webkit-search-cancel-button': { display: 'none' } }}
      />
      {value && (
        <Box
          as="button"
          aria-label="Effacer la recherche"
          color="fg.muted"
          _hover={{ color: 'fg' }}
          onClick={() => onChange('')}
          css={hitArea(44)}
        >
          <LuX size={18} />
        </Box>
      )}
    </HStack>
  );
};

const SORTS: { value: ClientSort; label: string }[] = [
  { value: 'triage', label: 'À traiter' },
  { value: 'recent', label: 'Activité' },
  { value: 'alpha', label: 'A → Z' },
];

/**
 * Le tri, dans un menu : « À traiter » par défaut, « Activité » et
 * « A → Z » à la demande.
 *
 * Trois pastilles vivaient en permanence sous la recherche ; la maquette
 * les range dans un menu, parce que l'ordre par défaut suffit presque
 * toujours et que la ligne de tête porte déjà les tuiles.
 */
export const SortMenu = ({
  sort,
  onSort,
}: {
  sort: ClientSort;
  onSort: (sort: ClientSort) => void;
}) => {
  const current = SORTS.find((s) => s.value === sort) ?? SORTS[0];
  return (
    <Menu.Root
      onSelect={({ value }) => onSort(value as ClientSort)}
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
            {SORTS.map((option) => (
              <Menu.Item
                key={option.value}
                value={option.value}
                cursor="pointer"
                borderRadius="md"
                _hover={{ bg: 'whiteAlpha.100' }}
                aria-current={option.value === sort ? 'true' : undefined}
              >
                <HStack justify="space-between" w="full" gap={3}>
                  <Text>{option.label}</Text>
                  {option.value === sort && (
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
