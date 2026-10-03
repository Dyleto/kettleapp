import { useCountdown } from '../../useCountdown';
import { Box, HStack, Text } from '@chakra-ui/react';
import { formatCountdown } from '@/shared/utils/formatters';
import { useEffect, useState } from 'react';
import { LuTimer } from 'react-icons/lu';

interface TimerProps {
  duration: number;
  /**
   * Fourni quand l'horloge mène — un repos imposé, un tour chronométré : elle
   * enchaîne d'elle-même, c'est le format. Absent quand elle ne fait
   * qu'accompagner : une série chronométrée s'arrête et attend, parce que
   * personne ne veut voir la page changer sous lui pendant qu'il finit sa
   * dernière répétition.
   */
  onComplete?: () => void;
  couleur: string;
  /** La piste sous la jauge — plus sombre sur un fond clair. */
  track?: string;
  /** Ce qui se lit à gauche du temps : le bloc et le tour, « Repos »… */
  title?: React.ReactNode;
  holdLabel?: string;
  /**
   * Plus petite quand elle se pose au-dessus d'une liste : dans un AMRAP
   * l'horloge compte, mais c'est la liste des mouvements qu'on est venu lire.
   */
  compact?: boolean;
  /**
   * `false` fait attendre une touche à l'horloge.
   *
   * Un repos démarre seul — il a été déclenché par le geste qui a terminé la
   * série. Un tour non : le client doit d'abord reprendre sa kettlebell.
   */
  autoStart?: boolean;
  /** Appelé au tout premier départ, jamais à une reprise. */
  onStart?: () => void;
}

/**
 * Le décompte, dans les deux rôles qu'il peut tenir.
 *
 * Avec `onComplete`, l'horloge mène : elle passe la main d'elle-même, c'est
 * le format qui le veut. Sans, elle accompagne : elle s'arrête à zéro et
 * attend, parce que personne ne veut voir la page changer sous lui pendant
 * qu'il finit sa dernière répétition.
 */
export const Timer = ({
  duration,
  onComplete,
  couleur,
  track = 'whiteAlpha.200',
  title,
  holdLabel,
  compact = false,
  autoStart = true,
  onStart,
}: TimerProps) => {
  const { remaining, isRunning, pause, resume } = useCountdown(duration, {
    onComplete,
    autoStart,
  });
  const isDone = remaining === 0;
  // Jamais lancé, par opposition à lancé puis mis en pause : les deux se
  // ressemblent sur une horloge arrêtée mais ne disent pas la même chose, et
  // ce qu'il faut dire d'abord est « elle vous attend ».
  const [started, setStarted] = useState(autoStart);

  useEffect(() => {
    if (remaining > 0 && remaining <= 3) {
      navigator.vibrate?.(150);
    }
  }, [remaining]);

  // Un décompte qui ne passe pas la main de lui-même l'annonce une fois,
  // simplement : personne ne regarde l'écran à ce moment-là.
  useEffect(() => {
    if (isDone && !onComplete) {
      navigator.vibrate?.([120, 80, 120]);
    }
  }, [isDone, onComplete]);

  const lu = formatCountdown(remaining);
  const part =
    duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0;

  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      onClick={
        isDone
          ? undefined
          : () => {
              if (isRunning) return pause();
              if (!started) {
                setStarted(true);
                onStart?.();
              }
              resume();
            }
      }
      cursor={isDone ? 'default' : 'pointer'}
      // Le temps restant fait partie du nom : sans lui, quelqu'un qui ne
      // voit pas l'écran peut mettre en pause sans jamais savoir où il en
      // est.
      aria-label={
        isDone
          ? 'Temps écoulé'
          : !started
            ? `Lancer le décompte — ${lu}`
            : `${isRunning ? 'Mettre en pause' : 'Reprendre le décompte'} — ${lu} restant`
      }
    >
      <HStack justify="space-between" align="flex-end" gap={3}>
        {/* L'indication se place sous le titre plutôt que sous la jauge :
            la colonne de gauche est plus courte que le chiffre de droite,
            elle ne coûte donc aucune hauteur. Ajouter une ligne en dessous
            coûtait 20 px, ce qu'un téléphone posé à plat n'a pas. */}
        <Box minW={0}>
          {title}
          {!isDone && !isRunning && (
            <Text fontSize="2xs" color={couleur} opacity={0.75} mt={1}>
              {started ? 'Toucher pour reprendre' : 'Toucher pour lancer'}
            </Text>
          )}
        </Box>
        <Text
          fontSize={compact ? '40px' : '72px'}
          fontWeight="800"
          lineHeight="0.85"
          letterSpacing={compact ? '-1px' : '-3px'}
          fontVariantNumeric="tabular-nums"
          color={couleur}
          opacity={isRunning || isDone ? 1 : 0.5}
          flexShrink={0}
        >
          {lu}
        </Text>
      </HStack>

      <Box
        mt={compact ? 2 : 3}
        h={compact ? '6px' : '10px'}
        borderRadius="full"
        bg={track}
        overflow="hidden"
      >
        <Box
          h="100%"
          borderRadius="full"
          bg={couleur}
          style={{
            width: `${part * 100}%`,
            transition: isRunning ? 'width 1s linear' : 'none',
          }}
        />
      </Box>

      {isDone && holdLabel ? (
        <Text fontSize="sm" color={couleur} opacity={0.75} mt={2}>
          {holdLabel}
        </Text>
      ) : null}
    </Box>
  );
};

/**
 * Un décompte proposé plutôt qu'imposé.
 *
 * Le déroulé page à page donnait un chronomètre plein écran à chaque série
 * chronométrée et à chaque repos. C'est cette mise en scène que le retour du
 * terrain refusait — « pas 7 reps back squat, puis 120 s de repos, puis 6
 * reps » — pas le chronomètre lui-même, qui était utile. Le retirer avec
 * l'écran jetterait la chose utile avec sa mauvaise présentation.
 *
 * Il vit donc sous la ligne qui le prescrit : « 2 min » pour le travail,
 * « 45 s de repos » pour ce qui suit. On le lance en y arrivant, et il
 * redevient un bouton une fois fini — parce qu'il reste trois séries.
 */
export const OnDemandTimer = ({
  duration,
  label,
  couleur,
}: {
  duration: number;
  label: string;
  couleur: string;
}) => {
  const [isCurrent, setEnCours] = useState(false);

  if (isCurrent)
    return (
      <Box pl={4} py={1}>
        <Timer
          duration={duration}
          couleur={couleur}
          onComplete={() => {
            // Personne ne regarde l'écran à ce moment-là : on le dit au
            // poignet. `Timer` ne le fait lui-même que sans `onComplete`.
            navigator.vibrate?.([120, 80, 120]);
            setEnCours(false);
          }}
          compact
        />
      </Box>
    );

  return (
    <Box pl={4}>
      <Box
        as="button"
        onClick={() => setEnCours(true)}
        aria-label={`Lancer le décompte — ${label}`}
        minH="44px"
        display="flex"
        alignItems="center"
        fontSize="xs"
        color={couleur}
        fontWeight="bold"
        _hover={{ opacity: 0.8 }}
      >
        <HStack gap={1.5}>
          <LuTimer size={13} />
          <Text as="span">{label}</Text>
        </HStack>
      </Box>
    </Box>
  );
};
