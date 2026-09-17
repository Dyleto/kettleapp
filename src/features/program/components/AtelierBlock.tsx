import {
  Box,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import {
  LuEllipsis,
  LuGripVertical,
  LuMessageSquare,
  LuPlus,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import { BlockExercise, Exercise, SessionBlock } from '@/types';
import {
  blockDefinesOwnMetrics,
  blockIndexPrefix,
  blockSupportsSets,
  getBlockLabel,
} from '@/features/program/constants';
import { BlockFrame } from './BlockFrame';
import { gouttiereTactile } from '@/components/hitArea';
import { formatDuration } from '@/utils/formatters';
import { InlineText, InlineValue } from './InlineValue';
import { BlockConfigInline } from './BlockConfigInline';
import { InlineExercisePicker } from './InlineExercisePicker';

type MetricKind = 'reps' | 'duration' | 'custom';

const kindOf = (ex: BlockExercise): MetricKind =>
  ex.duration !== undefined
    ? 'duration'
    : ex.customMetric !== undefined
      ? 'custom'
      : 'reps';

const NEXT_KIND: Record<MetricKind, MetricKind> = {
  reps: 'duration',
  duration: 'custom',
  custom: 'reps',
};

const KIND_LABEL: Record<MetricKind, string> = {
  reps: 'répétitions',
  duration: 'durée',
  custom: 'mesure libre',
};

/** Le même, en assez court pour tenir dans la gouttière d'une ligne. */
const KIND_SHORT: Record<MetricKind, string> = {
  reps: 'reps',
  duration: 'durée',
  custom: 'libre',
};

type ExerciseUpdate = Partial<Omit<BlockExercise, 'exercise'>>;

interface ExerciseRowProps {
  exercise: BlockExercise;
  block: SessionBlock;
  index: number;
  onUpdate: (updates: ExerciseUpdate) => void;
  onRemove: () => void;
}

const ExerciseRow = ({
  exercise,
  block,
  index,
  onUpdate,
  onRemove,
}: ExerciseRowProps) => {
  // La consigne d'un exercice n'a pas d'invitation permanente sous chaque
  // ligne : cinq exercices, ce serait cinq « + consigne » à lire avant de
  // lire le programme. Elle s'ouvre par la gouttière, là où vivent déjà les
  // commandes de la ligne, et ne s'affiche ensuite que si elle existe.
  const [noteOuverte, setNoteOuverte] = useState(false);
  const aUneNote = !!exercise.note?.trim();

  const kind = kindOf(exercise);
  const supportsSets = blockSupportsSets(block.type);
  const ownMetrics = blockDefinesOwnMetrics(block.type);
  const showPrefix = blockIndexPrefix(block.type);

  const switchKind = () => {
    const next = NEXT_KIND[kind];
    if (next === 'reps')
      onUpdate({ reps: 10, duration: undefined, customMetric: undefined });
    if (next === 'duration')
      onUpdate({ duration: 30, reps: undefined, customMetric: undefined });
    if (next === 'custom')
      onUpdate({
        customMetric: { value: 100, unit: 'm' },
        reps: undefined,
        duration: undefined,
      });
  };

  const ligne = (
    // La ligne passe sur deux niveaux d'elle-même quand le nom n'a plus la
    // place. Pas de point de rupture deviné : c'est la largeur réellement
    // disponible qui décide, et elle ne dépend pas que de l'écran — à 768 px
    // le rail des séances apparaît et ne laisse que 116 px au nom, moins qu'à
    // 390 px. La métrique garde son `ml="auto"` : alignée à droite qu'elle
    // soit sur la même ligne ou sur la suivante.
    //
    // Tout tient dans la `flex-basis` du nom, laissée à `auto` : la base est
    // alors la largeur du nom écrit d'un trait. Un nom court tient à côté de
    // la métrique et la ligne ne se casse pas ; un nom long ne tient pas, et
    // c'est ce qui déclenche le retour. `flex={1}` — base nulle — ne cassait
    // jamais, et un `min-width` en pourcentage est cyclique ici : la largeur
    // du conteneur dépend des lignes, les lignes du minimum, le minimum du
    // conteneur. Chromium le tient alors pour nul au moment de casser.
    <HStack
      // Ancrage stable pour les mesures de mise en page : sans lui, une sonde
      // doit remonter le DOM en comptant les niveaux, et le moindre
      // regroupement la casse sans rien casser dans l'application.
      data-exercise-row
      py={1.5}
      gap={3}
      rowGap={1}
      flexWrap="wrap"
      align="center"
      css={{
        // Visibles en permanence, en retrait : à zéro, un coach qui découvre
        // l'atelier ne pouvait pas deviner qu'un bloc se déplace ou se
        // supprime — la commande n'existait qu'après être passé dessus.
        '&:hover [data-row-gutter], &:focus-within [data-row-gutter]': {
          opacity: 1,
        },
      }}
    >
      <HStack gap={1} flex="1 1 auto" minW={0}>
        {showPrefix && (
          <Text fontSize="sm" color="fg.muted" flexShrink={0}>
            {index + 1} ·
          </Text>
        )}
        {/* Deux lignes plutôt qu'une : « Soulevé de terre jambes tendues à la
            barre » en demande deux même sur toute la largeur d'un téléphone. */}
        <Text fontSize="sm" color="fg.muted" lineClamp={2}>
          {exercise.exercise.name}
        </Text>
      </HStack>

      {/* La prescription, alignée à droite en chiffres tabulaires : c'est ce
          qu'on parcourt verticalement quand on relit une séance. */}
      {/* La prescription et les commandes forment un seul élément : sans ce
          groupe, elles se cassaient indépendamment et les commandes se
          retrouvaient seules sur la ligne du dessous, à gauche, orphelines. */}
      <HStack gap={3} flexShrink={0} ml="auto" align="center">
        {!ownMetrics && (
          <HStack gap={1} flexShrink={0}>
            {supportsSets && (
              <>
                {/* Sans nombre écrit, l'exercice se fait une fois : « 1 » est
                  la lecture juste, et c'est aussi la cible à cliquer pour en
                  demander plusieurs. */}
                <InlineValue
                  value={exercise.sets}
                  onChange={(v) => onUpdate({ sets: v })}
                  ariaLabel={`Séries — ${exercise.exercise.name}`}
                  emptyLabel="1"
                  min={1}
                  width="44px"
                  clearable
                />
                <Text as="span" fontSize="sm" color="fg.muted">
                  ×
                </Text>
              </>
            )}

            {kind === 'reps' && (
              <InlineValue
                value={exercise.reps}
                onChange={(v) => onUpdate({ reps: v })}
                suffix="reps"
                ariaLabel={`Répétitions — ${exercise.exercise.name}`}
                width="56px"
              />
            )}
            {kind === 'duration' && (
              <InlineValue
                value={exercise.duration}
                onChange={(v) => onUpdate({ duration: v })}
                suffix="s"
                format={formatDuration}
                ariaLabel={`Durée — ${exercise.exercise.name}`}
                width="56px"
              />
            )}
            {kind === 'custom' && (
              <HStack gap={1}>
                <InlineValue
                  value={exercise.customMetric?.value}
                  onChange={(v) =>
                    onUpdate({
                      customMetric: {
                        value: v ?? 0,
                        unit: exercise.customMetric?.unit || 'm',
                      },
                    })
                  }
                  ariaLabel={`Mesure — ${exercise.exercise.name}`}
                  width="56px"
                />
                <Input
                  size="xs"
                  w="44px"
                  h="22px"
                  px={1}
                  textAlign="center"
                  aria-label={`Unité — ${exercise.exercise.name}`}
                  value={exercise.customMetric?.unit ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      customMetric: {
                        value: exercise.customMetric?.value ?? 0,
                        unit: e.target.value,
                      },
                    })
                  }
                  bg="whiteAlpha.50"
                  borderColor="whiteAlpha.100"
                  borderRadius="sm"
                  fontSize="xs"
                />
              </HStack>
            )}

            {supportsSets && (exercise.sets ?? 1) > 1 && (
              <HStack gap={1} pl={2}>
                <Text as="span" fontSize="xs" color="fg.muted">
                  repos
                </Text>
                <InlineValue
                  value={exercise.restBetweenSets}
                  onChange={(v) => onUpdate({ restBetweenSets: v })}
                  suffix="s"
                  format={formatDuration}
                  emptyLabel="aucun"
                  ariaLabel={`Repos entre séries — ${exercise.exercise.name}`}
                  width="52px"
                  clearable
                />
              </HStack>
            )}
          </HStack>
        )}

        {/* Gouttière : révélée au survol ou au focus clavier, toujours visible
          au tactile où le survol n'existe pas. */}
        <HStack
          data-row-gutter
          gap={2}
          flexShrink={0}
          opacity={{ base: 1, md: 0.35 }}
          transition="opacity 0.15s"
        >
          <IconButton
            aria-label={
              aUneNote
                ? `Modifier la consigne — ${exercise.exercise.name}`
                : `Ajouter une consigne — ${exercise.exercise.name}`
            }
            title={aUneNote ? 'Modifier la consigne' : 'Ajouter une consigne'}
            css={gouttiereTactile()}
            size="2xs"
            variant="ghost"
            color={aUneNote ? 'app.primary' : 'fg.muted'}
            onClick={() => setNoteOuverte(true)}
          >
            <LuMessageSquare size={11} />
          </IconButton>
          {!ownMetrics && (
            /* « ⇄ » ne disait ni qu'il remplace, ni qu'il échange, ni qu'il
               inverse — un pictogramme que son auteur doit expliquer n'en est
               pas un. Le mot, lui, porte deux informations que la flèche ne
               portait ni l'une ni l'autre : ce que cette ligne mesure
               aujourd'hui, et qu'on peut en changer. */
            <Box
              as="button"
              aria-label={`Changer l'unité (actuellement : ${KIND_LABEL[kind]}) — ${exercise.exercise.name}`}
              title={`Mesure en ${KIND_LABEL[kind]} — changer`}
              onClick={switchKind}
              css={gouttiereTactile()}
              fontSize="10px"
              fontWeight="bold"
              letterSpacing="wide"
              textTransform="uppercase"
              color="fg.muted"
              _hover={{ color: 'app.primary' }}
              transition="color 0.15s"
            >
              {KIND_SHORT[kind]}
            </Box>
          )}
          <IconButton
            aria-label={`Retirer ${exercise.exercise.name}`}
            title="Retirer cet exercice"
            css={gouttiereTactile()}
            size="2xs"
            variant="ghost"
            color="fg.muted"
            _hover={{ color: 'app.error' }}
            onClick={onRemove}
          >
            <LuX size={12} />
          </IconButton>
        </HStack>
      </HStack>
    </HStack>
  );

  return (
    <Box borderTopWidth="1px" borderColor="whiteAlpha.100">
      {ligne}
      {/* La consigne se pose sous sa ligne, hors du calcul de retour à la
          ligne de celle-ci, et n'apparaît que si elle existe ou qu'on vient
          de la demander. */}
      {(aUneNote || noteOuverte) && (
        <Box pb={1.5} pl={1}>
          <InlineText
            value={exercise.note}
            onChange={(note) => onUpdate({ note })}
            addLabel="+ consigne"
            ariaLabel={`Consigne — ${exercise.exercise.name}`}
            startOpen={noteOuverte && !aUneNote}
            multiline
          />
        </Box>
      )}
    </Box>
  );
};

interface AtelierBlockProps {
  block: SessionBlock;
  /** Exercices déjà posés ailleurs dans le programme. */
  inProgram: Exercise[];
  dragHandleProps?: Record<string, unknown>;
  onUpdate: (updates: Partial<SessionBlock>) => void;
  onRemove: () => void;
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (index: number) => void;
  onUpdateExercise: (index: number, updates: ExerciseUpdate) => void;
  /** Fourni sous 768 px : le choix d'exercice passe alors par le tiroir plein
   *  écran plutôt que par la liste déroulante, trop à l'étroit. */
  onRequestExercisePicker?: () => void;
  /** Ouvre la fiche d'un exercice par-dessus l'atelier. */
  onOpenExerciseSheet?: (exercise: Exercise) => void;
}

/**
 * Un bloc dans l'atelier du coach : le même rendu que celui que voit le
 * client, mais dont chaque valeur devient un champ au clic.
 *
 * Le principe dont tout découle : un programme se lit comme un programme,
 * pas comme un formulaire. Pas de boîte grise par valeur, pas de carte dans
 * une carte — de la typographie, un filet par bloc, et des commandes qui ne
 * se montrent que quand on s'approche.
 */
export const AtelierBlock = ({
  block,
  inProgram,
  dragHandleProps,
  onUpdate,
  onRemove,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onRequestExercisePicker,
  onOpenExerciseSheet,
}: AtelierBlockProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * Le champ facultatif qu'on vient de réclamer.
   *
   * Nom de bloc et consigne s'annonçaient chacun par un « + quelque chose »
   * posé en permanence. À trois blocs, avec « + exercice » et « + note de
   * séance », cela faisait sept invitations simultanées sur un écran, toutes
   * du même gris et du même corps : le programme se lisait comme un
   * formulaire à remplir plutôt que comme une séance à lire.
   *
   * Ils ne s'affichent plus que s'ils portent quelque chose — ou si on vient
   * de les demander par le « ⋯ » du bloc.
   */
  const [champDemande, setChampDemande] = useState<'nom' | 'consigne' | null>(
    null
  );
  /**
   * Ouvre un champ facultatif — une fois le menu vraiment parti.
   *
   * Le menu rend le focus à sa gâchette en se refermant. Monter le champ dans
   * le même souffle, c'est le voir se refermer aussitôt sur son propre blur :
   * mesuré, il apparaissait et disparaissait en moins de cent millisecondes,
   * et le coach retombait sur l'invitation qu'il venait de choisir. On attend
   * donc que la fermeture ait rendu le focus avant de monter le champ.
   */
  const ouvrirChamp = (champ: 'nom' | 'consigne') =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setChampDemande(champ))
    );

  const aUnNom = !!block.label?.trim();
  const aUneConsigne = !!block.notes?.trim();
  const nomVisible = aUnNom || champDemande === 'nom';
  const consigneVisible = aUneConsigne || champDemande === 'consigne';

  return (
    <BlockFrame
      block={block}
      name={
        /* Ni description du type — l'étiquette la dit déjà — ni placeholder
           permanent : un bloc sans nom libre ne laisse aucune trace. */
        nomVisible ? (
          <InlineText
            value={block.label}
            onChange={(label) => onUpdate({ label })}
            addLabel="+ nom"
            ariaLabel={`Nom personnalisé du bloc ${getBlockLabel(block.type)}`}
            width="160px"
            startOpen={champDemande === 'nom' && !aUnNom}
          />
        ) : undefined
      }
      config={<BlockConfigInline block={block} onUpdate={onUpdate} />}
      gutter={
        <HStack
          gap={2}
          opacity={{ base: 1, md: 0.35 }}
          _groupHover={{ opacity: 1 }}
          _groupFocusWithin={{ opacity: 1 }}
          transition="opacity 0.15s"
        >
          {/* Une seule commande pour tout ce qui est facultatif. Un « ⋯ »
              ne promet rien et n'appelle à rien : c'est exactement ce qu'on
              veut d'un champ dont la plupart des blocs se passent. */}
          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                aria-label={`Champs facultatifs du bloc ${getBlockLabel(block.type)}`}
                title="Nom et consigne du bloc"
                css={gouttiereTactile()}
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
                    value="nom"
                    onClick={() => ouvrirChamp('nom')}
                    color="fg"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {aUnNom ? 'Renommer le bloc' : 'Nommer le bloc'}
                  </Menu.Item>
                  <Menu.Item
                    value="consigne"
                    onClick={() => ouvrirChamp('consigne')}
                    color="fg"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    {aUneConsigne
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
            css={gouttiereTactile()}
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
            css={gouttiereTactile()}
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
        consigneVisible ? (
          <InlineText
            value={block.notes}
            onChange={(notes) => onUpdate({ notes })}
            addLabel="+ consigne"
            ariaLabel={`Consigne du bloc ${getBlockLabel(block.type)}`}
            width="100%"
            startOpen={champDemande === 'consigne' && !aUneConsigne}
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
          onUpdate={(updates) => onUpdateExercise(index, updates)}
          onRemove={() => onRemoveExercise(index)}
        />
      ))}
    </BlockFrame>
  );
};
