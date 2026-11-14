import { Box, HStack, Text } from '@chakra-ui/react';
import { LuPlay, LuVolume2 } from 'react-icons/lu';
import { ActionButton } from '@/shared/components/ActionButton';
import { Sheet } from '@/shared/components/Sheet';
import { useSoundSetting } from '../../useSoundSetting';
import { unlockSound } from '../../sound';

interface PauseSheetProps {
  /** Où l'on en est : « Bloc 2 sur 3 · série 3 sur 4 ». */
  position: string;
  onResume: () => void;
  /** Fermer la séance en la gardant sur l'appareil. */
  onLeave: () => void;
  /** Absent au dernier bloc : il n'y a rien après à quoi passer. */
  onSkipBlock?: () => void;
  onFinish: () => void;
}

/** Un lien discret du bas de la feuille. */
const Link = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Box
    as="button"
    // Une vraie hauteur de 44 px plutôt qu'une zone tactile en
    // débordement : téléphone couché, la feuille défile, et un débordement
    // invisible s'y confond avec une ligne rognée.
    minH="44px"
    display="inline-flex"
    alignItems="center"
    fontSize="13px"
    fontWeight="bold"
    color="fg.muted"
    onClick={onClick}
    _hover={{ color: 'fg' }}
  >
    {children}
  </Box>
);

/**
 * La pause : tout ce qu'on peut faire d'une séance sans la continuer.
 *
 * Elle remplace « Quitter ». L'ancien bouton ouvrait une question dont la
 * réponse ambre était « Quitter » et dont « Continuer la séance » était un
 * lien gris : l'emphase poussait vers la sortie quelqu'un qui avait le plus
 * souvent touché le bouton par mégarde, en plein effort. Ici le bouton
 * principal est « Reprendre », et partir demande de le vouloir.
 *
 * Elle dit aussi où l'on en est, en blocs et en séries — et non en étapes —
 * parce que c'est la première chose qu'on veut savoir en posant sa
 * kettlebell.
 *
 * « Passer ce bloc » et « Terminer la séance maintenant » sont deux gestes
 * distincts, côte à côte : ils partageaient un seul lien, au même endroit,
 * dont le libellé changeait selon le bloc.
 */
export const PauseSheet = ({
  position,
  onResume,
  onLeave,
  onSkipBlock,
  onFinish,
}: PauseSheetProps) => {
  const [soundEnabled, setSoundEnabled] = useSoundSetting();

  return (
    <Sheet label="Pause" onDismiss={onResume}>
      <HStack gap={3}>
        <Text
          as="h2"
          fontSize="24px"
          fontWeight="750"
          lineHeight="1.08"
          fontStretch="90%"
        >
          Pause
        </Text>
        <Box
          ml="auto"
          px="11px"
          py="5px"
          borderRadius="full"
          bg="bg.raised"
          fontSize="13px"
          fontWeight="600"
        >
          {position}
        </Box>
      </HStack>

      <ActionButton w="full" onClick={onResume}>
        <LuPlay size={18} fill="currentColor" />
        Reprendre
      </ActionButton>
      <ActionButton tone="ghost" size="md" w="full" onClick={onLeave}>
        Arrêter et reprendre plus tard
      </ActionButton>

      <Box h="1px" bg="line" />

      <Box
        as="button"
        role="switch"
        aria-checked={soundEnabled}
        aria-label="Sons du chronomètre"
        display="flex"
        alignItems="center"
        gap="10px"
        minH="44px"
        textAlign="left"
        onClick={() => {
          if (!soundEnabled) unlockSound();
          setSoundEnabled(!soundEnabled);
        }}
      >
        <LuVolume2 size={20} />
        <Text fontWeight="bold" flex={1}>
          Sons du chronomètre
        </Text>
        <Box
          aria-hidden
          position="relative"
          w="52px"
          h="30px"
          borderRadius="full"
          bg={soundEnabled ? 'app.primary' : 'bg.raised'}
          transition="background-color 180ms"
        >
          <Box
            position="absolute"
            top="3px"
            left={soundEnabled ? '25px' : '3px'}
            w="24px"
            h="24px"
            borderRadius="full"
            bg={soundEnabled ? 'bg.canvas' : 'fg.muted'}
            transition="left 180ms"
            _motionReduce={{ transition: 'none' }}
          />
        </Box>
      </Box>

      <Box h="1px" bg="line" />

      <HStack justify="space-between" gap={4}>
        {onSkipBlock ? (
          <Link onClick={onSkipBlock}>Passer ce bloc</Link>
        ) : (
          <Box />
        )}
        <Link onClick={onFinish}>Terminer la séance maintenant</Link>
      </HStack>
    </Sheet>
  );
};
