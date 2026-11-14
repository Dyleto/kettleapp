import { useEffect } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { useCountdown } from '../../useCountdown';
import { playCue } from '../../sound';

interface CountdownProps {
  /** Le premier geste à venir : le mouvement, ou le format du bloc. */
  title: string;
  /** Son rang et sa dose : « Série 1 sur 4 · 10 reps ». */
  detail?: string;
  onDone: () => void;
}

/** Trois secondes : le temps de poser le téléphone et de se placer. */
const SECONDS = 3;

/**
 * Le décompte avant l'effort : 3, 2, 1.
 *
 * L'horloge partait au doigt, téléphone encore en main : le temps de le
 * poser et de saisir la kettlebell, le premier tour avait perdu cinq
 * secondes. Trois secondes entre le geste et le départ, c'est ce qu'il faut
 * pour se placer — et elles s'entendent, un bip par chiffre puis un bip
 * long.
 *
 * Toucher l'écran passe tout de suite à la suite : qui est déjà en place
 * n'a pas à attendre qu'on le lui permette.
 */
export const Countdown = ({ title, detail, onDone }: CountdownProps) => {
  const { remaining } = useCountdown(SECONDS, {
    // Le bip long part ici et non dans un effet : arriver à zéro démonte ce
    // composant dans le même rendu, et l'effet n'aurait jamais tourné.
    onComplete: () => {
      playCue('go');
      onDone();
    },
  });

  // Un bip par chiffre affiché.
  useEffect(() => {
    if (remaining > 0) playCue('tick');
  }, [remaining]);

  return (
    <Box
      as="button"
      aria-label={`Départ dans ${remaining} — toucher pour commencer tout de suite`}
      position="fixed"
      inset={0}
      zIndex={60}
      bg="bg.canvas"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={5}
      px={5}
      onClick={onDone}
    >
      <Text
        fontSize="11px"
        fontWeight="800"
        letterSpacing="0.14em"
        textTransform="uppercase"
        color="fg.muted"
      >
        Prépare-toi
      </Text>
      <Text
        fontFamily="heading"
        fontSize="300px"
        fontWeight="800"
        fontStretch="76%"
        lineHeight="0.9"
        letterSpacing="-0.02em"
        fontVariantNumeric="tabular-nums"
        color="app.primary"
        aria-hidden
      >
        {Math.max(1, remaining)}
      </Text>
      <VStack gap={1.5}>
        <Text
          fontFamily="heading"
          fontSize="24px"
          fontWeight="750"
          lineHeight="1.08"
          fontStretch="90%"
          textAlign="center"
        >
          {title}
        </Text>
        {detail && (
          <Text color="fg.muted" textAlign="center">
            {detail}
          </Text>
        )}
      </VStack>
    </Box>
  );
};
