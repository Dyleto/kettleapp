import { Box, Text, VStack } from '@chakra-ui/react';
import { canVibrate } from '@/shared/feedback/haptics';
import {
  useSoundSetting,
  useVibrationSetting,
} from '@/shared/feedback/settings';
import { unlockSound } from '@/shared/feedback/sound';

/**
 * Les réglages de cet appareil, dans « Mon compte » : les bips et les
 * vibrations de la séance guidée.
 *
 * Ils ne sont pas rangés dans le compte, parce qu'on veut des bips sur le
 * téléphone posé au sol et pas forcément sur l'ordinateur du bureau. Les
 * bips se règlent aussi dans la séance, pour qui les coupe au milieu d'un
 * tour ; les vibrations, ici seulement.
 *
 * Les vibrations ne s'affichent que là où le téléphone sait vibrer : Safari
 * sur iPhone ne le sait pas, et un réglage qui ne règle rien n'a pas sa
 * place.
 */
export const DeviceSettings = () => {
  const [sound, setSound] = useSoundSetting();
  const [vibration, setVibration] = useVibrationSetting();
  return (
    <VStack align="stretch" gap={3}>
      <SettingSwitch
        label="Les bips de la séance guidée"
        line="Les trois dernières secondes d'un tour ou d'un repos, puis le départ. Le réglage vaut pour cet appareil."
        checked={sound}
        onChange={(next) => {
          // Remettre le son est un geste : c'est le moment d'ouvrir la
          // sortie audio, que le navigateur n'ouvre que sur une touche.
          if (next) unlockSound();
          setSound(next);
        }}
      />
      {canVibrate() && (
        <SettingSwitch
          label="Vibrations"
          line="Une série cochée, les trois dernières secondes, le départ. Le réglage vaut pour cet appareil."
          checked={vibration}
          onChange={setVibration}
        />
      )}
    </VStack>
  );
};

/**
 * Une ligne de réglage qui s'allume ou s'éteint.
 *
 * Toute la ligne est l'interrupteur. Une cible de la taille du seul curseur
 * ferait 52 px de large au bout d'une ligne qui en fait trois cents.
 */
const SettingSwitch = ({
  label,
  line,
  checked,
  onChange,
}: {
  label: string;
  line: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <Box
    as="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
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
        {label}
      </Text>
      <Text fontSize="13px" color="fg.muted" lineHeight="1.5" mt={0.5}>
        {line}
      </Text>
    </Box>
    <Box
      aria-hidden
      flexShrink={0}
      position="relative"
      w="52px"
      h="32px"
      borderRadius="full"
      bg={checked ? 'app.primary' : 'bg.raised'}
      transition="background-color 180ms"
    >
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
    </Box>
  </Box>
);
