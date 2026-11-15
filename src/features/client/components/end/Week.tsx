import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck, LuFlame } from 'react-icons/lu';
import { ActionButton } from '@/shared/components/ActionButton';
import { WEEKDAY_LETTERS } from '../../sessionDates';
import { countWord } from '../../weekRing';
import { Ring } from '../scene/Ring';

interface WeekProps {
  /** Les séances que la semaine attend ; zéro quand rien n'est conseillé. */
  target: number;
  /** Faites cette semaine, avant celle qu'on vient d'envoyer. */
  before: number;
  /** Faites cette semaine, elle comprise. */
  after: number;
  /** Les semaines tenues à la suite, celle-ci comprise si elle l'est. */
  streak: number;
  /** Lundi = 0. */
  doneDays: Set<number>;
  plannedDays: Set<number>;
  onFinish: () => void;
}

const capitalized = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/**
 * La semaine qui avance : le dernier écran de la fin de séance.
 *
 * Après l'envoi, on revenait sur l'accueil avec un toast. Ici l'anneau part
 * de sa valeur d'avant et monte — c'est la séance qu'on vient de faire qui
 * le remplit, et il faut le voir se remplir. Les mots disent ce qu'il
 * reste : « Encore une et ta semaine est pleine. » Sans jour conseillé, pas
 * d'anneau : la semaine n'a pas d'objectif, on dit seulement le compte.
 */
export const Week = ({
  target,
  before,
  after,
  streak,
  doneDays,
  plannedDays,
  onFinish,
}: WeekProps) => {
  const [part, setPart] = useState(target > 0 ? before / target : 0);
  useEffect(() => {
    if (target === 0) return;
    // Un rendu à la valeur d'avant, puis la nouvelle : c'est la transition
    // de l'anneau qui fait le reste.
    const frame = requestAnimationFrame(() => setPart(after / target));
    return () => cancelAnimationFrame(frame);
  }, [after, target]);

  const full = target > 0 && after >= target;
  const title =
    target === 0 || after > target
      ? `${after} séance${after > 1 ? 's' : ''} cette semaine`
      : `${capitalized(countWord(after))} séance${after > 1 ? 's' : ''} sur ${countWord(target)}`;
  const line =
    target === 0
      ? null
      : full
        ? 'Semaine pleine.'
        : `Encore ${countWord(target - after)} et ta semaine est pleine.`;

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Ta semaine"
      position="fixed"
      inset={0}
      zIndex={50}
      bg="bg.canvas"
      display="flex"
      flexDirection="column"
    >
      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        align="stretch"
        justify="center"
        gap={5}
        px={5}
        py={6}
      >
        <HStack gap={4}>
          {target > 0 && (
            <Box
              role="img"
              aria-label={`${after} séance${after > 1 ? 's' : ''} sur ${target}`}
            >
              <Ring
                part={part}
                size={112}
                stroke={13}
                color="var(--chakra-colors-session-rest)"
              >
                <Text
                  fontFamily="heading"
                  fontSize="34px"
                  fontWeight="800"
                  fontVariantNumeric="tabular-nums"
                  aria-hidden
                >
                  {after}/{target}
                </Text>
              </Ring>
            </Box>
          )}
          <VStack align="start" gap={1.5}>
            <Text as="h1" fontSize="24px" fontWeight="800" lineHeight="1.15">
              {title}
            </Text>
            {line && <Text color="fg.muted">{line}</Text>}
          </VStack>
        </HStack>

        <HStack
          justify="space-between"
          bg="bg.surface"
          borderRadius="xl"
          px={4}
          py={3.5}
          aria-hidden
        >
          {WEEKDAY_LETTERS.map((letter, day) => {
            const done = doneDays.has(day);
            const planned = plannedDays.has(day);
            return (
              <VStack key={day} gap={2}>
                <Text fontSize="xs" color="fg.muted" fontWeight="bold">
                  {letter}
                </Text>
                <Box
                  w="28px"
                  h="28px"
                  borderRadius="full"
                  display="grid"
                  placeItems="center"
                  bg={done ? 'session.rest' : 'transparent'}
                  color="bg.canvas"
                  borderWidth={done ? 0 : '1.5px'}
                  borderStyle={planned ? 'solid' : 'dashed'}
                  borderColor={planned ? 'app.primary.border' : 'line'}
                  data-day={done ? 'done' : planned ? 'planned' : 'free'}
                >
                  {done && <LuCheck size={16} strokeWidth={3} />}
                </Box>
              </VStack>
            );
          })}
        </HStack>

        {streak >= 2 && (
          <HStack
            alignSelf="flex-start"
            gap={1.5}
            px={3.5}
            py={2}
            borderRadius="full"
            bg="app.primary.bg"
            color="app.primary.fg"
            fontWeight="bold"
          >
            <LuFlame size={16} />
            <Text>{streak} semaines d’affilée</Text>
          </HStack>
        )}

        <Box bg="bg.surface" borderRadius="20px 20px 20px 6px" px="14px" py={3}>
          <Text fontSize="15px">
            Ton coach verra ton ressenti, et pourra te répondre d’un mot.
          </Text>
        </Box>
      </VStack>

      <Box px={4} pt={2} pb="calc(env(safe-area-inset-bottom, 0px) + 12px)">
        <ActionButton size="xl" w="full" onClick={onFinish}>
          Terminer
        </ActionButton>
      </Box>
    </Box>,
    document.body
  );
};
