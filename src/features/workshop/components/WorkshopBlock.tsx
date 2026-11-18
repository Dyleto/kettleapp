import {
  Box,
  chakra,
  HStack,
  IconButton,
  Menu,
  Portal,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { LuEllipsis, LuGripVertical, LuPlus } from 'react-icons/lu';
import { BlockType, Exercise, SessionBlock } from '@/shared/types';
import { formatName } from '@/domain/session/dose';
import { Bubble, touchHitArea } from '@/kit';
import { BlockFrame } from './BlockFrame';
import { BlockPill, StaticPill } from './BlockPill';
import { BlockSettings } from './BlockSettings';
import { BlockSheet } from './BlockSheet';
import { BlockTypeSelector } from './BlockTypeSelector';
import { InlineText } from './InlineValue';
import { InlineExercisePicker } from './InlineExercisePicker';
import { ExerciseRow } from './ExerciseRow';
import type { ExerciseUpdate } from './ExerciseSettings';

interface WorkshopBlockProps {
  block: SessionBlock;
  /** Les exercices déjà placés ailleurs dans le programme. */
  inProgram: Exercise[];
  dragHandleProps?: Record<string, unknown>;
  onUpdate: (updates: Partial<SessionBlock>) => void;
  onRemove: () => void;
  /** Place une copie du bloc juste sous lui. */
  onDuplicate: () => void;
  onChangeFormat: (type: BlockType) => void;
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (index: number) => void;
  onUpdateExercise: (index: number, updates: ExerciseUpdate) => void;
  /** Place une copie juste sous l'exercice. */
  onDuplicateExercise: (index: number) => void;
  /** La ligne ouverte dans ce bloc, s'il y en a une. Tenue au-dessus des
   * blocs : une seule ligne est ouverte dans toute la séance. */
  openIndex: number | null;
  onOpenRow: (index: number | null) => void;
  /** En dessous de 768 px : les réglages d'une ligne et ceux du bloc
   * passent par une feuille basse. */
  settingsInSheet: boolean;
  /** La ligne à faire défiler jusqu'à l'écran en arrivant, s'il y en a
   * une dans ce bloc. */
  revealIndex?: number | null;
  /** Fourni en dessous de 768 px : choisir un exercice passe alors par le
   *  tiroir plein écran plutôt que par le menu déroulant, trop à l'étroit. */
  onRequestExercisePicker?: () => void;
  /** Ouvre la fiche d'un exercice par-dessus l'éditeur. */
  onOpenExerciseSheet?: (exercise: Exercise) => void;
}

/**
 * Un bloc dans l'éditeur du coach : une carte qui se lit comme le client la
 * lira, et dont chaque réglage s'ouvre là où il se lit.
 *
 * Le principe dont tout découle : un programme se lit comme un programme, pas
 * comme un formulaire. L'en-tête dit le format et ses réglages en pastilles ;
 * le nom et la consigne n'existent que s'ils portent quelque chose ; tout le
 * reste — nommer, changer de format, dupliquer, supprimer — attend derrière
 * un « ⋯ », ou derrière l'en-tête entier sur téléphone.
 */
export const WorkshopBlock = ({
  block,
  inProgram,
  dragHandleProps,
  onUpdate,
  onRemove,
  onDuplicate,
  onChangeFormat,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  openIndex,
  onOpenRow,
  settingsInSheet,
  revealIndex = null,
  onRequestExercisePicker,
  onOpenExerciseSheet,
}: WorkshopBlockProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickingFormat, setPickingFormat] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const label = formatName(block.type);

  /**
   * Le champ facultatif qu'on vient de demander par le « ⋯ ».
   *
   * Le nom et la consigne d'un bloc s'annonçaient chacun par un « + quelque
   * chose » posé en permanence. À trois blocs, cela faisait sept invitations
   * simultanées sur un écran, toutes du même gris : le programme se lisait
   * comme un formulaire à remplir. Ils ne s'affichent plus que lorsqu'ils
   * portent quelque chose — ou qu'on vient de les demander.
   */
  const [fieldAsked, setFieldAsked] = useState<'name' | 'instruction' | null>(
    null
  );
  /**
   * Ouvre un champ facultatif — une fois le menu réellement parti.
   *
   * Le menu rend le focus à son déclencheur en se fermant. Monter le champ
   * dans la foulée, c'est le voir se refermer aussitôt sur son propre blur :
   * mesuré, il apparaissait et disparaissait en moins de cent millisecondes.
   * On attend donc que la fermeture ait rendu le focus.
   */
  const afterMenu = (then: () => void) =>
    requestAnimationFrame(() => requestAnimationFrame(then));

  const hasName = !!block.label?.trim();
  const hasInstruction = !!block.notes?.trim();
  const instructionEditing = fieldAsked === 'instruction';

  const name = settingsInSheet
    ? hasName && <StaticPill tone="outline">{block.label}</StaticPill>
    : (hasName || fieldAsked === 'name') && (
        <BlockPill
          // Remontée quand le menu la demande : elle s'ouvre alors d'emblée.
          key={fieldAsked === 'name' ? 'asked' : 'shown'}
          tone="outline"
          label={`Nom personnalisé du bloc ${label}`}
          display={block.label ?? ''}
          initiallyOpen={fieldAsked === 'name'}
          onClose={() => setFieldAsked(null)}
        >
          {(close) => (
            <InlineText
              value={block.label}
              onChange={(value) => onUpdate({ label: value })}
              addLabel="+ nom"
              ariaLabel={`Nom personnalisé du bloc ${label}`}
              fontSize="sm"
              width="160px"
              startOpen
              onDone={close}
            />
          )}
        </BlockPill>
      );

  // La consigne se lit en bulle, chez le coach comme chez le client : c'est
  // ce que le client lira avant de commencer le bloc.
  const instruction =
    !settingsInSheet && instructionEditing ? (
      <InlineText
        value={block.notes}
        onChange={(notes) => onUpdate({ notes })}
        addLabel="+ consigne"
        ariaLabel={`Consigne du bloc ${label}`}
        fontSize="sm"
        startOpen
        multiline
        onDone={() => setFieldAsked(null)}
      />
    ) : hasInstruction ? (
      settingsInSheet ? (
        <Bubble tone="raised" size="sm">
          {block.notes}
        </Bubble>
      ) : (
        <chakra.button
          type="button"
          aria-label={`Consigne du bloc ${label} : ${block.notes}`}
          onClick={() => setFieldAsked('instruction')}
          display="block"
          textAlign="left"
          w="full"
        >
          <Bubble tone="raised" size="sm">
            {block.notes}
          </Bubble>
        </chakra.button>
      )
    ) : null;

  const formatPicker = pickingFormat && (
    <Box pb={2}>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="bold" color="fg.muted">
          Changer de format
        </Text>
        <chakra.button
          type="button"
          fontSize="sm"
          color="fg.muted"
          minH="32px"
          onClick={() => setPickingFormat(false)}
        >
          Annuler
        </chakra.button>
      </HStack>
      <BlockTypeSelector
        onSelect={(type) => {
          setPickingFormat(false);
          if (type !== block.type) onChangeFormat(type);
        }}
      />
    </Box>
  );

  const handle = (
    <IconButton
      aria-label={`Réorganiser le bloc ${label}`}
      title="Déplacer ce bloc"
      css={touchHitArea()}
      size="2xs"
      variant="ghost"
      color="fg.muted"
      cursor="grab"
      touchAction="none"
      ml="-6px"
      {...dragHandleProps}
    >
      <LuGripVertical size={14} />
    </IconButton>
  );

  // Une seule commande pour tout ce qui n'est pas un réglage : un « ⋯ » ne
  // promet rien et ne réclame rien, exactement ce qu'on veut pour des
  // gestes dont la plupart des blocs se passent.
  const menu = (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          aria-label={`Menu du bloc ${label}`}
          title="Nom, consigne, format, copie"
          css={touchHitArea()}
          size="xs"
          variant="ghost"
          color="fg.muted"
        >
          <LuEllipsis size={18} />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            bg="bg.surface"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            minW="220px"
          >
            <Menu.Item
              value="name"
              onClick={() => afterMenu(() => setFieldAsked('name'))}
            >
              {hasName ? 'Renommer le bloc' : 'Nommer le bloc'}
            </Menu.Item>
            <Menu.Item
              value="instruction"
              onClick={() => afterMenu(() => setFieldAsked('instruction'))}
            >
              {hasInstruction ? 'Modifier la consigne' : 'Ajouter une consigne'}
            </Menu.Item>
            <Menu.Item value="format" onClick={() => setPickingFormat(true)}>
              Changer de format
            </Menu.Item>
            <Menu.Item value="duplicate" onClick={onDuplicate}>
              Dupliquer le bloc
            </Menu.Item>
            <Menu.Item value="remove" color="app.error" onClick={onRemove}>
              Supprimer le bloc
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );

  return (
    <>
      <BlockFrame
        block={block}
        handle={handle}
        name={name || undefined}
        config={
          <BlockSettings
            block={block}
            onUpdate={onUpdate}
            layout={settingsInSheet ? 'static' : 'pills'}
          />
        }
        gutter={settingsInSheet ? undefined : menu}
        headerAction={
          settingsInSheet
            ? {
                label: `Régler le bloc ${label}`,
                onPress: () => setSheetOpen(true),
              }
            : undefined
        }
        notes={
          formatPicker || instruction ? (
            <>
              {formatPicker}
              {instruction}
            </>
          ) : undefined
        }
        footer={
          isPickerOpen && !onRequestExercisePicker ? (
            <InlineExercisePicker
              inProgram={inProgram}
              onSelect={onAddExercise}
              onClose={() => setIsPickerOpen(false)}
              onOpenSheet={onOpenExerciseSheet}
            />
          ) : (
            <chakra.button
              type="button"
              onClick={() =>
                onRequestExercisePicker
                  ? onRequestExercisePicker()
                  : setIsPickerOpen(true)
              }
              fontSize="15px"
              fontWeight="700"
              color="app.primary.fg"
              minH="44px"
              display="flex"
              alignItems="center"
              _hover={{ color: 'app.primary' }}
              transition="color 0.15s"
            >
              <HStack gap="6px">
                <LuPlus size={16} />
                <Text as="span">exercice</Text>
              </HStack>
            </chakra.button>
          )
        }
      >
        {block.exercises.map((exercise, index) => (
          <ExerciseRow
            key={index}
            exercise={exercise}
            block={block}
            index={index}
            open={openIndex === index}
            onOpenChange={(open) => onOpenRow(open ? index : null)}
            inSheet={settingsInSheet}
            reveal={revealIndex === index}
            onUpdate={(updates) => onUpdateExercise(index, updates)}
            // Ce qui est retiré ne reste pas ouvert : la ligne suivante
            // prendrait sa place sous les réglages sans qu'on l'ait touchée.
            onRemove={() => {
              onOpenRow(null);
              onRemoveExercise(index);
            }}
            // La copie s'ouvre : c'est elle qu'on vient de créer pour la
            // régler autrement.
            onDuplicate={() => {
              onDuplicateExercise(index);
              onOpenRow(index + 1);
            }}
            onOpenSheet={
              onOpenExerciseSheet
                ? () => onOpenExerciseSheet(exercise.exercise)
                : undefined
            }
          />
        ))}
      </BlockFrame>

      {sheetOpen && settingsInSheet && (
        <BlockSheet
          block={block}
          onUpdate={onUpdate}
          onChangeFormat={onChangeFormat}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
};
