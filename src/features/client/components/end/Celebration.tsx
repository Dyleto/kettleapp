import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuTrophy } from 'react-icons/lu';
import { ActionButton, Mascot } from '@/kit';
import type { Recap } from '../../recap';
import type { Highlight } from '@/domain/history/records';
import { useCoachVoice } from '../../coach';

interface CelebrationProps {
  /** « Séance 2 · Haut du corps ». */
  title: string;
  recap: Recap;
  highlight: Highlight | null;
  onContinue: () => void;
  onCompleteLoads: () => void;
}

/** Les confettis : sept, posés à la main plutôt que tirés au hasard — un
 * écran qui change à chaque fois ne se vérifie pas. */
const CONFETTI: [number, number, string, number][] = [
  [10, 6, '#CF9F3F', 20],
  [84, 10, '#EC8079', -30],
  [76, 26, '#8FCFC8', 40],
  [14, 30, '#E9BE62', -15],
  [46, 2, '#ECE8DE', 60],
  [90, 18, '#CF9F3F', 10],
  [5, 44, '#8FCFC8', -40],
];

/**
 * Un nombre qui monte de zéro jusqu'à lui en une seconde.
 *
 * Rien de tout cela quand le téléphone demande moins d'animations : le
 * chiffre est là d'emblée. Il ne sert qu'à l'œil — les lecteurs d'écran
 * lisent la valeur finale, portée par l'étiquette de la tuile.
 */
const useCountUp = (target: number): number => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const still =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let frame = 0;
    let startedAt: number | null = null;
    const step = (now: number) => {
      startedAt ??= now;
      const t = still ? 1 : Math.min(1, (now - startedAt) / 1000);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
};

/** Une tuile de l'écran de fin : un chiffre, et ce qu'il compte. */
const Tile = ({
  value,
  of,
  label,
  format = (n) => String(n),
}: {
  value: number;
  /** Le total, quand la séance s'est arrêtée en route : « 9/15 ». */
  of?: number;
  label: string;
  format?: (n: number) => string;
}) => {
  const shown = useCountUp(value);
  return (
    <VStack
      role="group"
      aria-label={`${format(value)}${of ? ` sur ${of}` : ''} ${label}`}
      gap={1}
      bg="bg.surface"
      borderRadius="xl"
      py={3.5}
      px={2}
    >
      <Text
        aria-hidden
        fontFamily="heading"
        fontSize="38px"
        fontWeight="800"
        fontStretch="76%"
        lineHeight="0.9"
        fontVariantNumeric="tabular-nums"
      >
        {format(shown)}
        {of ? (
          <Text as="span" fontSize="18px" color="fg.muted">
            /{of}
          </Text>
        ) : null}
      </Text>
      <Text aria-hidden fontSize="xs" color="fg.muted" textAlign="center">
        {label}
      </Text>
    </VStack>
  );
};

const weightLabel = (n: number) => Math.round(n).toLocaleString('fr-FR');

/**
 * L'écran de fin : le moment qui fait revenir.
 *
 * Quarante minutes d'effort menaient à une question — « Tu veux noter tes
 * charges ? » — puis à un formulaire. Ici on fête d'abord : trois chiffres
 * qui montent, un vrai record s'il y en a un, des confettis quand la séance
 * est faite en entier. La question qui reste, le ressenti, vient après
 * « Continuer ».
 *
 * Arrêtée en route, la séance n'a ni confettis ni record : elle dit ce qui
 * est vrai — ce qui est fait est fait, et le coach le verra tel quel.
 */
export const Celebration = ({
  title,
  recap,
  highlight,
  onContinue,
  onCompleteLoads,
}: CelebrationProps) => {
  const coach = useCoachVoice();
  const partial = recap.setsTotal > 0 && recap.setsDone < recap.setsTotal;
  const heading = partial ? 'Séance arrêtée' : 'Séance terminée';

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      position="fixed"
      inset={0}
      zIndex={50}
      bg="bg.canvas"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {!partial && (
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          aria-hidden
          data-confetti=""
          _motionReduce={{ display: 'none' }}
        >
          {CONFETTI.map(([x, y, color, turn], i) => (
            <Box
              key={i}
              position="absolute"
              left={`${x}%`}
              top={`${y}%`}
              w="11px"
              h="7px"
              borderRadius="1px"
              style={{ background: color, rotate: `${turn}deg` }}
              opacity={0}
              animation={`confettiFall 2.5s ease-in ${i * 0.08}s forwards`}
            />
          ))}
        </Box>
      )}

      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        justify="center"
        gap={4}
        px={5}
        py={6}
        textAlign="center"
        position="relative"
      >
        <Mascot mood={partial ? 'hello' : 'bravo'} size={128} />
        <Text
          as="h1"
          fontFamily="heading"
          fontSize="42px"
          fontWeight="800"
          lineHeight="1.1"
        >
          {heading}
        </Text>
        <Text color="fg.muted">
          {title}
          {recap.durationMinutes ? ` · ${recap.durationMinutes} min` : ''}
        </Text>

        <Grid
          w="full"
          maxW="420px"
          templateColumns={`repeat(${
            [
              recap.durationMinutes,
              recap.setsTotal > 0,
              recap.tonnage > 0 || recap.rounds > 0,
            ].filter(Boolean).length
          }, minmax(0, 1fr))`}
          gap={2.5}
        >
          {recap.durationMinutes ? (
            <Tile
              value={recap.durationMinutes}
              label={recap.durationMinutes > 1 ? 'minutes' : 'minute'}
            />
          ) : null}
          {recap.setsTotal > 0 && (
            <Tile
              value={recap.setsDone}
              of={partial ? recap.setsTotal : undefined}
              label="séries et tours"
            />
          )}
          {recap.tonnage > 0 ? (
            <Tile
              value={recap.tonnage}
              label="kg soulevés"
              format={weightLabel}
            />
          ) : recap.rounds > 0 ? (
            <Tile value={recap.rounds} label="tours bouclés" />
          ) : null}
        </Grid>

        {partial ? (
          <Card title="Ce qui est fait est fait">
            {coach.opening} verra tes {recap.setsDone} séries et tours, tels
            quels. Tu pourras refaire la séance en entier une autre fois.
          </Card>
        ) : highlight?.kind === 'record' ? (
          <Card title="Nouveau record" icon={<LuTrophy size={30} />}>
            {highlight.name} · {weightLabel(highlight.load)}
            {'\u00A0'}kg, {weightLabel(highlight.gain)} de plus qu’avant
            {highlight.others > 0
              ? `, et ${highlight.others} autre${highlight.others > 1 ? 's' : ''}`
              : ''}
          </Card>
        ) : highlight?.kind === 'steady' ? (
          <Card title="Régularité tenue">
            Même charge que la dernière fois.
          </Card>
        ) : null}

        <Box
          as="button"
          minH="44px"
          fontSize="sm"
          fontWeight="bold"
          color="fg.muted"
          onClick={onCompleteLoads}
          _hover={{ color: 'fg' }}
        >
          Compléter mes charges
        </Box>
      </VStack>

      <Box
        px={4}
        pt={2}
        pb="calc(env(safe-area-inset-bottom, 0px) + 12px)"
        position="relative"
      >
        <ActionButton size="xl" w="full" onClick={onContinue}>
          Continuer
        </ActionButton>
      </Box>
    </Box>,
    document.body
  );
};

/** La carte sous les chiffres : un record, la régularité, ou l'arrêt. */
const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <HStack
    w="full"
    maxW="420px"
    align="center"
    gap={3.5}
    textAlign="left"
    bg={icon ? 'app.primary.bg' : 'bg.surface'}
    borderWidth={icon ? '1px' : 0}
    borderColor="app.primary.border"
    borderRadius="xl"
    px={4}
    py={3.5}
  >
    {icon && (
      <Box color="app.primary.fg" flexShrink={0}>
        {icon}
      </Box>
    )}
    <VStack align="start" gap={1}>
      <Text fontWeight="bold" fontSize="17px">
        {title}
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {children}
      </Text>
    </VStack>
  </HStack>
);
