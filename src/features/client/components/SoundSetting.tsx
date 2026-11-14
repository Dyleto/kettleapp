import { Box, Text } from '@chakra-ui/react';
import { useSoundSetting } from '../useSoundSetting';
import { unlockSound } from '../sound';

/**
 * Le réglage du son, dans « Mon compte ».
 *
 * Le même réglage que l'icône de la séance guidée, pour qui veut le poser
 * une fois pour toutes plutôt qu'au milieu d'un tour. Il dit ce qui sonne,
 * et qu'il vaut pour cet appareil seulement : il n'est pas rangé dans le
 * compte, parce qu'on veut des bips sur le téléphone posé au sol et pas
 * forcément sur l'ordinateur du bureau.
 *
 * Toute la ligne est l'interrupteur. Une cible de la taille du seul
 * curseur ferait 52 px de large au bout d'une ligne qui en fait trois cents.
 */
export const SoundSetting = () => {
  const [enabled, setEnabled] = useSoundSetting();

  return (
    <Box
      as="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Les bips de la séance guidée"
      onClick={() => {
        if (!enabled) unlockSound();
        setEnabled(!enabled);
      }}
      w="full"
      display="flex"
      alignItems="center"
      gap={4}
      textAlign="left"
      bg="surface.card"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      p={4}
    >
      <Box flex={1} minW={0}>
        <Text fontWeight="bold" fontSize="15px">
          Les bips de la séance guidée
        </Text>
        <Text fontSize="13px" color="fg.muted" lineHeight="1.5" mt={0.5}>
          Les trois dernières secondes d'un tour ou d'un repos, puis le départ.
          Le réglage vaut pour cet appareil.
        </Text>
      </Box>
      <Box
        aria-hidden
        flexShrink={0}
        position="relative"
        w="52px"
        h="32px"
        borderRadius="full"
        bg={enabled ? 'app.primary' : 'bg.raised'}
        transition="background-color 180ms"
      >
        <Box
          position="absolute"
          top="3px"
          left={enabled ? '23px' : '3px'}
          w="26px"
          h="26px"
          borderRadius="full"
          bg={enabled ? 'bg.canvas' : 'fg.muted'}
          transition="left 180ms"
          _motionReduce={{ transition: 'none' }}
        />
      </Box>
    </Box>
  );
};
