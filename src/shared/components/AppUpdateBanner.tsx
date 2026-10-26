import { Box, HStack, Text } from '@chakra-ui/react';
import { LuArrowDownToLine } from 'react-icons/lu';
import { useAppUpdate } from '@/shared/hooks/useAppUpdate';

/**
 * Le seul cas où une nouvelle version demande quelque chose à la personne.
 *
 * Le reste du temps elle se prend toute seule, sans un mot : c'est le travail
 * de `useAppUpdate`. Ce bandeau n'apparaît que lorsqu'il reste une frappe non
 * enregistrée, parce qu'alors recharger coûterait ce que la personne vient
 * d'écrire.
 *
 * En haut et non en bas : le bas de l'écran est déjà réclamé par la ligne
 * « Modifications non enregistrées » — et c'est précisément la situation dans
 * laquelle ce bandeau se montre. Les deux se seraient disputé la même place.
 */
export const AppUpdateBanner = () => {
  const { pending, reload } = useAppUpdate();

  if (!pending) return null;

  return (
    <Box
      // Fixe et non collant : le bandeau est monté à la racine, à côté de
      // l'application et non dedans, donc il n'a pas de conteneur défilant
      // auquel se coller.
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1500}
      bg="app.primary/12"
      borderBottom="1px solid"
      borderColor="app.primary.border"
      px={4}
      py={2}
      role="status"
    >
      <HStack gap={2} maxW="container.xl" mx="auto">
        <Box color="app.primary" display="flex">
          <LuArrowDownToLine size={14} />
        </Box>
        <Text fontSize="sm" mr="auto">
          Une nouvelle version est prête.
        </Text>
        <Box
          as="button"
          onClick={reload}
          fontSize="sm"
          fontWeight="medium"
          color="app.primary"
          px={2}
          py={1}
          borderRadius="md"
          _hover={{ bg: 'app.primary/12' }}
        >
          Recharger
        </Box>
      </HStack>
    </Box>
  );
};
