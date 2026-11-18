import { Box, HStack, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { LuEllipsis, LuGripVertical, LuPlus, LuTrash2 } from 'react-icons/lu';
import { Exercise, SessionBlock } from '@/shared/types';
import { getBlockLabel } from '@/domain/session/blocks';
import { BlockFrame } from './BlockFrame';
import { touchGap, touchHitArea } from '@/kit';
import { InlineText } from './InlineValue';
import { BlockConfigInline } from './BlockConfigInline';
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
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (index: number) => void;
  onUpdateExercise: (index: number, updates: ExerciseUpdate) => void;
  /** Place une copie juste sous l'exercice. */
  onDuplicateExercise: (index: number) => void;
  /** La ligne ouverte dans ce bloc, s'il y en a une. Tenue au-dessus des
   * blocs : une seule ligne est ouverte dans toute la séance. */
  openIndex: number | null;
  onOpenRow: (index: number | null) => void;
  /** En dessous de 768 px : les réglages d'une ligne passent par une
   * feuille basse. */
  rowsInSheet: boolean;
  /** Fourni en dessous de 768 px : choisir un exercice passe alors par le
   *  tiroir plein écran plutôt que par le menu déroulant, trop à l'étroit. */
  onRequestExercisePicker?: () => void;
  /** Ouvre la fiche d'un exercice par-dessus l'éditeur. */
  onOpenExerciseSheet?: (exercise: Exercise) => void;
}

/**
 * Un bloc dans l'éditeur du coach : le rendu même que voit le client, mais où
 * chaque valeur devient un champ au clic.
 *
 * Le principe dont tout découle : un programme se lit comme un programme, pas
 * comme un formulaire. Aucune boîte grise par valeur, aucune carte dans une
 * carte — de la typographie, un filet par bloc, et des commandes qui ne se
 * montrent qu'en s'approchant.
 */
export const WorkshopBlock = ({
  block,
  inProgram,
  dragHandleProps,
  onUpdate,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  openIndex,
  onOpenRow,
  rowsInSheet,
  onRequestExercisePicker,
  onOpenExerciseSheet,
}: WorkshopBlockProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * Le champ facultatif qu'on vient de demander.
   *
   * Le nom et la consigne d'un bloc s'annonçaient chacun par un « + quelque
   * chose » posé en permanence. À trois blocs, avec « + exercice » et « + note
   * de séance », cela faisait sept invitations simultanées sur un écran, toutes
   * du même gris et de la même taille : le programme se lisait comme un
   * formulaire à remplir plutôt que comme une séance à lire.
   *
   * Ils ne s'affichent plus que lorsqu'ils portent quelque chose — ou qu'on
   * vient de les demander par le « ⋯ » du bloc.
   */
  const [fieldAsked, setFieldAsked] = useState<'name' | 'instruction' | null>(
    null
  );
  /**
   * Ouvre un champ facultatif — une fois le menu réellement parti.
   *
   * Le menu rend le focus à son déclencheur en se fermant. Monter le champ
   * dans la foulée, c'est le voir se refermer aussitôt sur son propre blur :
   * mesuré, il apparaissait et disparaissait en moins de cent millisecondes,
   * et le coach retombait sur l'invitation qu'il venait de choisir. On attend
   * donc que la fermeture ait rendu le focus avant de monter le champ.
   */
  const openField = (field: 'name' | 'instruction') =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setFieldAsked(field))
    );

  const hasName = !!block.label?.trim();
  const hasInstruction = !!block.notes?.trim();
  const nameVisible = hasName || fieldAsked === 'name';
  const instructionVisible = hasInstruction || fieldAsked === 'instruction';

  return (
    <BlockFrame
      block={block}
      name={
        /* Ni une description du type — l'étiquette le dit déjà — ni un
                   texte d'invite permanent : un bloc sans nom libre ne laisse aucune
                   trace. */
        nameVisible ? (
          <InlineText
            value={block.label}
            onChange={(label) => onUpdate({ label })}
            addLabel="+ nom"
            ariaLabel={`Nom personnalisé du bloc ${getBlockLabel(block.type)}`}
            width="160px"
            startOpen={fieldAsked === 'name' && !hasName}
          />
        ) : undefined
      }
      config={<BlockConfigInline block={block} onUpdate={onUpdate} />}
      gutter={
        <HStack
          gap={2}
          css={touchGap}
          opacity={{ base: 1, md: 0.35 }}
          _groupHover={{ opacity: 1 }}
          _groupFocusWithin={{ opacity: 1 }}
          transition="opacity 0.15s"
        >
          {/* Une seule commande pour tout ce qui est facultatif. Un « ⋯ »
              ne promet rien et ne réclame rien : exactement ce qu'on veut
              pour un champ dont la plupart des blocs se passent. */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                aria-label={`Champs facultatifs du bloc ${getBlockLabel(block.type)}`}
                title="Nom et consigne du bloc"
                css={touchHitArea()}
                size="2xs"
                variant="ghost"
                color="fg.muted"
              >
                <LuEllipsis size={13} />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  bg="bg.surface"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  minW="200px"
                >
                  <Menu.Item
                    value="name"
                    onClick={() => openField('name')}
                    color="fg"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {hasName ? 'Renommer le bloc' : 'Nommer le bloc'}
                  </Menu.Item>
                  <Menu.Item
                    value="instruction"
                    onClick={() => openField('instruction')}
                    color="fg"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {hasInstruction
                      ? 'Modifier la consigne'
                      : 'Ajouter une consigne'}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <IconButton
            aria-label={`Réorganiser le bloc ${getBlockLabel(block.type)}`}
            title="Déplacer ce bloc"
            css={touchHitArea()}
            size="2xs"
            variant="ghost"
            color="fg.muted"
            cursor="grab"
            touchAction="none"
            {...dragHandleProps}
          >
            <LuGripVertical size={12} />
          </IconButton>
          <IconButton
            aria-label={`Supprimer le bloc ${getBlockLabel(block.type)}`}
            title="Supprimer ce bloc"
            css={touchHitArea()}
            size="2xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: 'app.error' }}
            onClick={onRemove}
          >
            <LuTrash2 size={12} />
          </IconButton>
        </HStack>
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
          <Box
            as="button"
            onClick={() =>
              onRequestExercisePicker
                ? onRequestExercisePicker()
                : setIsPickerOpen(true)
            }
            fontSize="xs"
            color="fg.muted"
            minH="44px"
            display="flex"
            alignItems="center"
            _hover={{ color: 'app.primary' }}
            transition="color 0.15s"
          >
            <HStack gap={1}>
              <LuPlus size={12} />
              <Text as="span">exercice</Text>
            </HStack>
          </Box>
        )
      }
      notes={
        instructionVisible ? (
          <InlineText
            value={block.notes}
            onChange={(notes) => onUpdate({ notes })}
            addLabel="+ consigne"
            ariaLabel={`Consigne du bloc ${getBlockLabel(block.type)}`}
            width="100%"
            startOpen={fieldAsked === 'instruction' && !hasInstruction}
            multiline
          />
        ) : undefined
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
          inSheet={rowsInSheet}
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
  );
};
