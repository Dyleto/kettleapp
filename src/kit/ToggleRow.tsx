import { Box, chakra, Spinner, Text, VStack } from '@chakra-ui/react';

/**
 * Une ligne qui s'allume ou s'éteint, dans une carte de lignes.
 *
 * Toute la ligne est l'interrupteur : une cible de la taille du seul curseur
 * ferait 52 px de large au bout d'une ligne qui en fait trois cents. Elle
 * réunit deux interrupteurs qui s'étaient écrits chacun le sien — celui des
 * réglages de l'appareil et celui du partage des données de santé — avec
 * deux tailles et deux couleurs pour le même geste.
 *
 * `pending` garde la ligne fermée pendant un envoi : un second toucher
 * avant la réponse enverrait l'inverse du premier.
 */
export const ToggleRow = ({
  label,
  line,
  checked,
  onChange,
  pending = false,
}: {
  label: string;
  line?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  pending?: boolean;
}) => (
  <chakra.button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    aria-disabled={pending || undefined}
    onClick={() => !pending && onChange(!checked)}
    display="flex"
    alignItems="center"
    gap="14px"
    w="full"
    minH="56px"
    px="16px"
    py="12px"
    textAlign="left"
    borderTopWidth="1px"
    borderColor="line"
    _first={{ borderTopWidth: 0 }}
    _hover={{ bg: 'bg.raised' }}
    _focusVisible={{ outlineOffset: '-2px' }}
  >
    <VStack align="start" gap="2px" flex={1} minW={0}>
      <Text fontWeight="600">{label}</Text>
      {line && (
        <Text fontSize="sm" color="fg.muted">
          {line}
        </Text>
      )}
    </VStack>
    <Box
      aria-hidden
      flexShrink={0}
      position="relative"
      w="52px"
      h="32px"
      borderRadius="full"
      bg={checked ? 'app.primary' : 'bg.raised'}
      transition="background-color 180ms"
      data-on={checked}
    >
      {pending ? (
        <Spinner
          size="xs"
          position="absolute"
          top="9px"
          left="19px"
          color={checked ? 'bg.canvas' : 'fg.muted'}
        />
      ) : (
        <Box
          position="absolute"
          top="3px"
          left={checked ? '23px' : '3px'}
          w="26px"
          h="26px"
          borderRadius="full"
          bg={checked ? 'bg.canvas' : 'fg.muted'}
          transition="left 180ms"
          _motionReduce={{ transition: 'none' }}
        />
      )}
    </Box>
  </chakra.button>
);
