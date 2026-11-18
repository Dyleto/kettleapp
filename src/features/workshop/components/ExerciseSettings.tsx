import { useState } from 'react';
import { Box, Flex, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { LuInfo } from 'react-icons/lu';
import type { BlockExercise, SessionBlock } from '@/shared/types';
import {
  blockDefinesOwnMetrics,
  blockSupportsSets,
} from '@/domain/session/blocks';
import {
  doseFields,
  doseUnitOf,
  erasedDose,
  switchedDose,
  UNIT_PHRASE,
  type DoseUnit,
} from '@/domain/session/doseEdit';
import { formatDuration } from '@/shared/utils/formatters';
import { undoable } from '@/shared/components/undoable';
import { ActionButton, PillButton } from '@/kit';
import { InlineText } from './InlineValue';
import { Stepper } from './Stepper';

export type ExerciseUpdate = Partial<Omit<BlockExercise, 'exercise'>>;

const UNITS: { unit: DoseUnit; label: string }[] = [
  { unit: 'reps', label: 'Reps' },
  { unit: 'duration', label: 'Durée' },
  { unit: 'custom', label: 'Autre unité' },
];

interface ExerciseSettingsProps {
  exercise: BlockExercise;
  block: SessionBlock;
  onUpdate: (updates: ExerciseUpdate) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** Absent quand la fiche du mouvement ne peut pas s'ouvrir d'ici. */
  onOpenSheet?: () => void;
  /** `row` sous la ligne, à partir de 768 px ; `sheet` dans la feuille
   * basse du téléphone. */
  layout: 'row' | 'sheet';
  /** « C'est bon », dans la feuille. */
  onDone?: () => void;
}

/**
 * Les réglages d'un exercice, une fois sa ligne ouverte.
 *
 * Ils vivaient en permanence sur chaque ligne : la dose en champs, et une
 * gouttière de trois commandes — consigne, unité, retrait — soit six à sept
 * cibles grises par exercice, à lire avant de lire le programme. Une
 * séance de cinq exercices se lisait comme un formulaire. Ils n'apparaissent
 * plus que sous la ligne qu'on vient de toucher, et la ligne au repos ne
 * dit que ce que le client lira.
 *
 * La même liste dans les deux dispositions : la ligne ouverte la range en
 * une rangée, la feuille du téléphone l'empile en grand, sous le pouce.
 */
export const ExerciseSettings = ({
  exercise,
  block,
  onUpdate,
  onRemove,
  onDuplicate,
  onOpenSheet,
  layout,
  onDone,
}: ExerciseSettingsProps) => {
  const name = exercise.exercise.name;
  const unit = doseUnitOf(exercise);
  const supportsSets = blockSupportsSets(block.type);
  const ownMetrics = blockDefinesOwnMetrics(block.type);
  const sets = exercise.sets ?? 1;
  const hasNote = !!exercise.note?.trim();
  const [noteAsked, setNoteAsked] = useState(false);
  // « Autre unité » demande sa valeur : le champ s'ouvre à la frappe.
  const [customAsked, setCustomAsked] = useState(false);
  const inSheet = layout === 'sheet';
  const stepSize = inSheet ? 'sheet' : 'row';

  // Ce qui se lit sous le nombre, dans la feuille : la dose vaut pour un
  // tour ou pour une série, et le nombre seul ne le dit pas.
  const perWhat =
    block.type === 'emom' || block.type === 'every' || block.type === 'amrap'
      ? 'par tour'
      : supportsSets && sets > 1
        ? 'par série'
        : undefined;

  /**
   * Changer d'unité efface l'autre valeur — l'API n'en garde qu'une. La
   * bannière le dit, avec de quoi la remettre, quand il y avait quelque
   * chose à perdre.
   */
  const switchUnit = (next: DoseUnit) => {
    if (next === unit) return;
    const before = doseFields(exercise);
    const erased = erasedDose(exercise);
    onUpdate(switchedDose(next));
    setCustomAsked(next === 'custom');
    if (erased)
      undoable({
        title: `Dose ${UNIT_PHRASE[next]}`,
        description: `Elle était de ${erased}.`,
        undo: () => onUpdate(before),
      });
  };

  const setsStepper = supportsSets && (
    <Stepper
      kind="sets"
      value={exercise.sets}
      onChange={(v) => onUpdate({ sets: v })}
      ariaLabel={`Séries — ${name}`}
      label="Séries"
      unit={sets > 1 ? 'séries' : 'série'}
      // Sans nombre écrit, l'exercice se fait une fois : « 1 » est la
      // lecture juste.
      emptyLabel="1"
      clearable
      size={inSheet ? 'sheetSmall' : 'row'}
    />
  );

  // Une clé par unité : sans elle, React garderait le même pas d'une unité
  // à l'autre, et le champ de « Autre unité » ne s'ouvrirait pas — il ne
  // s'ouvre qu'en paraissant.
  const doseStepper = ownMetrics ? null : unit === 'reps' ? (
    <Stepper
      key="reps"
      kind="reps"
      value={exercise.reps}
      onChange={(v) => onUpdate({ reps: v })}
      ariaLabel={`Répétitions — ${name}`}
      label="Reps"
      unit="reps"
      note={perWhat}
      size={stepSize}
    />
  ) : unit === 'duration' ? (
    <Stepper
      key="duration"
      kind="duration"
      value={exercise.duration}
      onChange={(v) => onUpdate({ duration: v })}
      ariaLabel={`Durée — ${name}`}
      label="Durée"
      format={formatDuration}
      note={perWhat}
      size={stepSize}
    />
  ) : (
    <Stepper
      key="custom"
      kind="custom"
      value={exercise.customMetric?.value}
      onChange={(v) =>
        onUpdate({
          customMetric: {
            value: v ?? 0,
            unit: exercise.customMetric?.unit || 'm',
          },
        })
      }
      ariaLabel={`Mesure — ${name}`}
      label="Mesure"
      // La seule mesure du programme que l'API déclare en nombre et non en
      // entier : « 22,5 kg », « 1,5 km ».
      decimals
      startOpen={customAsked}
      note={perWhat}
      size={stepSize}
      trailing={
        <Input
          aria-label={`Unité — ${name}`}
          value={exercise.customMetric?.unit ?? ''}
          onChange={(e) =>
            onUpdate({
              customMetric: {
                value: exercise.customMetric?.value ?? 0,
                unit: e.target.value,
              },
            })
          }
          w={inSheet ? '72px' : '48px'}
          h={inSheet ? '40px' : '28px'}
          px={1}
          textAlign="center"
          fontWeight="bold"
          fontSize={inSheet ? '20px' : 'sm'}
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
          borderRadius="md"
        />
      }
    />
  );

  const restStepper = supportsSets && sets > 1 && (
    <Stepper
      kind="rest"
      value={exercise.restBetweenSets}
      onChange={(v) => onUpdate({ restBetweenSets: v })}
      ariaLabel={`Repos entre séries — ${name}`}
      label="Repos"
      format={formatDuration}
      emptyLabel="aucun"
      note={inSheet ? 'entre deux séries' : undefined}
      clearable
      size={inSheet ? 'sheetSmall' : 'row'}
    />
  );

  const unitChoice = !ownMetrics && (
    <HStack gap="6px" role="group" aria-label="Unité de la dose" wrap="wrap">
      {UNITS.map(({ unit: u, label }) => (
        <PillButton key={u} pressed={unit === u} onClick={() => switchUnit(u)}>
          {label}
        </PillButton>
      ))}
    </HStack>
  );

  const noteShown = hasNote || noteAsked;
  const noteChip = !noteShown && (
    <PillButton
      tone="outline"
      aria-label={`Ajouter une consigne — ${name}`}
      onClick={() => setNoteAsked(true)}
    >
      + consigne
    </PillButton>
  );
  // Le client la lit en bulle pendant la séance.
  const noteField = noteShown && (
    <Box w="full">
      <InlineText
        value={exercise.note}
        onChange={(note) => onUpdate({ note })}
        addLabel="+ consigne"
        ariaLabel={`Consigne — ${name}`}
        startOpen={noteAsked && !hasNote}
        width="100%"
        multiline
      />
    </Box>
  );

  const sheetChip = onOpenSheet && (
    <PillButton
      tone="outline"
      aria-label={`Ouvrir la fiche de ${name}`}
      onClick={onOpenSheet}
    >
      <LuInfo size={14} />
      Fiche
    </PillButton>
  );
  const duplicateChip = (
    <PillButton
      tone="outline"
      aria-label={`Dupliquer ${name}`}
      onClick={onDuplicate}
    >
      Dupliquer
    </PillButton>
  );

  if (!inSheet)
    return (
      <VStack align="stretch" gap="10px" mt="10px">
        <Flex wrap="wrap" gap="10px" align="center">
          {setsStepper}
          {doseStepper}
          {restStepper}
          {unitChoice}
          {noteChip}
          {sheetChip}
          <HStack gap="6px" ml="auto">
            {duplicateChip}
            <PillButton
              tone="danger"
              aria-label={`Retirer ${name}`}
              onClick={onRemove}
            >
              Retirer
            </PillButton>
          </HStack>
        </Flex>
        {noteField}
      </VStack>
    );

  return (
    <>
      <HStack gap="8px" align="center">
        <Text as="h2" fontWeight="800" fontSize="20px" lineClamp={2} minW={0}>
          {name}
        </Text>
        <HStack gap="6px" ml="auto" flexShrink={0}>
          {duplicateChip}
          {sheetChip}
        </HStack>
      </HStack>
      {ownMetrics && (
        <Text color="fg.muted" fontSize="sm">
          Les répétitions viennent des paliers du bloc.
        </Text>
      )}
      {setsStepper}
      {doseStepper}
      {restStepper}
      {unitChoice}
      {noteField || noteChip}
      <HStack gap="10px">
        <ActionButton
          tone="danger"
          size="md"
          aria-label={`Retirer ${name}`}
          onClick={onRemove}
        >
          Retirer
        </ActionButton>
        <ActionButton size="md" flex={1} onClick={onDone}>
          C’est bon
        </ActionButton>
      </HStack>
    </>
  );
};
