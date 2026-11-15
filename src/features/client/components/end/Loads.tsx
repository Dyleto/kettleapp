import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuArrowLeft, LuPlus } from 'react-icons/lu';
import type { PerformedValues, Session } from '@/shared/types';
import { ActionButton } from '@/shared/components/ActionButton';
import type { LastPerformance } from '../../lastPerformance';
import {
  firstOpen,
  loadRows,
  sameWeightForAll,
  withWeight,
  type LoadRow,
} from '../../loadEntry';
import { formatWeight, heaviest, proposedLoad } from '../../guided/load';
import { LoadStepper } from '../scene/LoadStepper';

interface LoadsProps {
  session: Session;
  performed: Record<string, PerformedValues>;
  onPerformedChange: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
  /**
   * D'où l'on vient. Depuis l'écran de fin, « OK » en haut y ramène. Pour
   * une séance déclarée faite sans le mode guidé, c'est la première étape :
   * la flèche revient à la séance, « Continuer » mène au ressenti.
   */
  from: 'end' | 'declared';
  onDone: () => void;
  onBack: () => void;
}

const COUNT_WORDS = ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six'];

/** « série 2 », ou le palier quand il y en a un : « 6 reps ». */
const setName = (row: LoadRow, index: number) =>
  row.labels[index] || `série ${index + 1}`;

/**
 * « Compléter mes charges » : la séance, mouvement par mouvement, et ses
 * séries en pastilles.
 *
 * Il remplace une question — « Tu veux noter tes charges ? » — et un
 * formulaire de champs vides sous chaque exercice. Ce qui a été noté en
 * route est déjà là, en pastilles pleines ; une série vide se note d'un
 * toucher, à la charge proposée, et le sélecteur s'ouvre pour corriger.
 * Tout est facultatif.
 */
export const Loads = ({
  session,
  performed,
  onPerformedChange,
  lastPerformance,
  from,
  onDone,
  onBack,
}: LoadsProps) => {
  // Un exercice à durée sans charge passée ni notée n'a rien à faire ici :
  // la corde à sauter ne se pèse pas. C'est la règle de la séance guidée,
  // qui ne propose pas de charge sous un tel exercice.
  const rows = loadRows(session).filter(
    (row) =>
      !row.exercise.duration ||
      heaviest(lastPerformance?.get(row.exercise.exercise._id)?.sets) !==
        undefined ||
      heaviest(performed[row.key]?.sets) !== undefined
  );
  /** La série ouverte au sélecteur, par mouvement. */
  const [open, setOpen] = useState<Record<string, number | undefined>>({});

  return createPortal(
    <Box
      role="dialog"
      aria-modal="true"
      aria-label="Mes charges"
      position="fixed"
      inset={0}
      zIndex={50}
      bg="bg.canvas"
      display="flex"
      flexDirection="column"
    >
      <HStack px={3} pt={3} pb={2} gap={2}>
        <Box
          as="button"
          aria-label={
            from === 'end' ? 'Revenir à la fin' : 'Revenir à la séance'
          }
          w="44px"
          h="44px"
          display="grid"
          placeItems="center"
          borderRadius="full"
          onClick={onBack}
        >
          <LuArrowLeft size={22} />
        </Box>
        <Text as="h1" flex={1} fontSize="20px" fontWeight="800">
          Mes charges
        </Text>
        {from === 'end' && (
          <Box
            as="button"
            minW="44px"
            minH="44px"
            px={2}
            fontWeight="800"
            color="app.primary.fg"
            onClick={onDone}
          >
            OK
          </Box>
        )}
      </HStack>

      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        align="stretch"
        gap={3}
        px={4}
        pb={4}
      >
        <Text color="fg.muted">
          Tout est facultatif. Ce que tu as noté pendant la séance est déjà là.
        </Text>
        {rows.map((row) => (
          <LoadCard
            key={row.key}
            row={row}
            sets={performed[row.key]?.sets ?? []}
            selected={open[row.key]}
            onSelect={(index) => setOpen({ ...open, [row.key]: index })}
            onSets={(sets) => onPerformedChange(row.key, { sets })}
            lastTime={lastPerformance?.get(row.exercise.exercise._id)?.sets}
          />
        ))}
      </VStack>

      {from === 'declared' && (
        <Box px={4} pt={2} pb="calc(env(safe-area-inset-bottom, 0px) + 12px)">
          <ActionButton size="xl" w="full" onClick={onDone}>
            Continuer
          </ActionButton>
        </Box>
      )}
    </Box>,
    document.body
  );
};

/** Un mouvement : son nom, sa prescription, ses séries. */
const LoadCard = ({
  row,
  sets,
  selected,
  onSelect,
  onSets,
  lastTime,
}: {
  row: LoadRow;
  sets: PerformedValues['sets'];
  selected?: number;
  onSelect: (index: number) => void;
  onSets: (sets: NonNullable<PerformedValues['sets']>) => void;
  lastTime?: PerformedValues['sets'];
}) => {
  const noted = sets ?? [];
  const count = row.labels.length;
  const openIndex = firstOpen(noted, count);
  const first = noted[0]?.weight;
  const allSame =
    first !== undefined &&
    noted.length >= count &&
    noted.slice(0, count).every((set) => set.weight === first);
  const legendOf = (index: number) => {
    const before = lastTime?.[index]?.weight ?? heaviest(lastTime);
    return before !== undefined
      ? `${setName(row, index)} · la dernière fois ${formatWeight(before)}\u00A0kg`
      : setName(row, index);
  };

  // Une série vide se note d'un toucher : à la charge proposée — la série
  // d'avant, sinon la dernière fois — et le sélecteur s'ouvre pour corriger.
  const take = (index: number) => {
    const proposed = proposedLoad(noted, index + 1, lastTime);
    if (proposed !== undefined) onSets(withWeight(noted, index, proposed));
    onSelect(index);
  };

  return (
    <VStack
      align="stretch"
      gap={3}
      bg="bg.surface"
      borderRadius="xl"
      px={4}
      py={3.5}
      data-load-row={row.key}
    >
      <HStack justify="space-between" gap={3}>
        <Text fontSize="17px" fontWeight="bold">
          {row.name}
        </Text>
        {row.summary && (
          <Text fontSize="sm" color="fg.muted" flexShrink={0}>
            {row.summary}
          </Text>
        )}
      </HStack>

      {selected !== undefined && selected <= openIndex && (
        <LoadStepper
          key={selected}
          value={noted[selected]?.weight}
          onChange={(weight) => onSets(withWeight(noted, selected, weight))}
          legend={legendOf(selected)}
          label={`Poids utilisé, en kilos — ${row.name} ${setName(row, selected)}`}
        />
      )}

      <HStack gap={2} wrap="wrap">
        {row.labels.map((_, index) => {
          if (index === selected) return null;
          const weight = noted[index]?.weight;
          if (index < openIndex && weight !== undefined)
            return (
              <Chip
                key={index}
                filled
                label={`${setName(row, index)} — ${formatWeight(weight)} kg, à corriger`}
                onClick={() => onSelect(index)}
              >
                {formatWeight(weight)}
                {'\u00A0'}kg
              </Chip>
            );
          if (index === openIndex)
            return (
              <Chip
                key={index}
                label={
                  count === 1
                    ? `Noter une charge — ${row.name}`
                    : `Noter la charge — ${row.name}, ${setName(row, index)}`
                }
                onClick={() => take(index)}
              >
                {count === 1 ? (
                  <>
                    <LuPlus size={16} />
                    Noter une charge
                  </>
                ) : (
                  setName(row, index)
                )}
              </Chip>
            );
          // Après une série vide : rien à noter tant qu'elle l'est.
          return (
            <Chip key={index} disabled label={setName(row, index)}>
              {setName(row, index)}
            </Chip>
          );
        })}
      </HStack>

      {count > 1 && first !== undefined && !allSame && (
        <Box
          as="button"
          alignSelf="flex-start"
          minH="44px"
          fontSize="sm"
          fontWeight="bold"
          color="app.primary.fg"
          onClick={() => onSets(sameWeightForAll(noted, count))}
        >
          Même charge pour les{' '}
          {count < COUNT_WORDS.length ? COUNT_WORDS[count] : count} séries
        </Box>
      )}
    </VStack>
  );
};

/** Une pastille de série : pleine quand une charge y est notée. */
const Chip = ({
  label,
  filled = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  filled?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <Box
    as="button"
    aria-label={label}
    aria-disabled={disabled || undefined}
    onClick={disabled ? undefined : onClick}
    display="inline-flex"
    alignItems="center"
    gap={1.5}
    minH="44px"
    px={4}
    borderRadius="full"
    fontWeight="bold"
    fontVariantNumeric="tabular-nums"
    bg={filled ? 'app.primary.bg' : 'transparent'}
    color={filled ? 'app.primary.fg' : disabled ? 'fg.subtle' : 'fg.muted'}
    borderWidth="1.5px"
    borderStyle={filled ? 'solid' : 'dashed'}
    borderColor={filled ? 'app.primary.border' : 'line'}
    opacity={disabled ? 0.5 : 1}
    cursor={disabled ? 'default' : 'pointer'}
  >
    {children}
  </Box>
);
