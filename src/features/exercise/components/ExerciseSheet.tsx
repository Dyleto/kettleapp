import { useState, type ReactNode } from 'react';
import { Box, chakra, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { LuLink, LuTrash2, LuX } from 'react-icons/lu';
import { ActionButton, AutoResizeTextarea } from '@/kit';
import type { Exercise } from '@/shared/types';
import { useUpdateExercise } from '@/features/exercise/hooks/useExerciseMutations';
import { useExercises } from '@/features/exercise/hooks/useExercises';
import { reachLine } from '@/domain/exercise/choices';
import { videoLinkError } from '@/domain/exercise/video';
import VideoPlayer from '@/shared/components/VideoPlayer';

type Editable = 'name' | 'description' | 'videoUrl';

/** La forme d'un champ de la maquette : un contour, qui passe à l'ambre. */
const FIELD = {
  w: 'full',
  minH: '48px',
  px: '14px',
  py: '11px',
  borderRadius: '14px',
  bg: 'transparent',
  boxShadow: 'inset 0 0 0 1.5px {colors.line}',
} as const;

interface SheetFieldProps {
  value?: string;
  onCommit: (value: string) => void;
  ariaLabel: string;
  /** Ce qui se lit quand c'est vide — c'est aussi l'invitation à le
   * remplir. */
  emptyLabel: string;
  multiline?: boolean;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  /** Ce qui précède la valeur : l'icône d'un lien. */
  icon?: ReactNode;
  /** Un champ qu'on ne vide pas : vidé, il reprend l'ancienne valeur. */
  required?: boolean;
  /** Renvoie le motif du refus, ou `null` si la valeur passe. */
  validate?: (value: string) => string | null;
}

/**
 * Un champ qui se lit comme une valeur et s'édite au toucher, comme dans
 * l'atelier ; il s'enregistre à la perte du focus, sans bouton.
 *
 * Au repos, il a la forme d'un champ : la maquette dit « tout s'édite sur
 * place », et un texte nu ne disait pas qu'on pouvait le toucher. Il reste
 * un bouton jusqu'au toucher — un champ toujours ouvert prendrait le focus
 * de la feuille entière à l'ouverture.
 */
const SheetField = ({
  value,
  onCommit,
  ariaLabel,
  emptyLabel,
  multiline = false,
  fontSize = 'md',
  fontWeight = 'normal',
  color = 'fg',
  icon,
  required = false,
  validate,
}: SheetFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cancel = () => {
    setError(null);
    setIsEditing(false);
  };

  const commit = () => {
    const next = draft.trim();
    // Un nom vidé reprend l'ancien : un exercice sans nom ne se retrouve
    // plus dans aucune liste.
    if (required && next === '') return cancel();
    // Un refus garde le champ ouvert : partir en vidant la saisie ferait
    // disparaître à la fois la valeur et la raison du refus.
    const refusal = validate?.(next) ?? null;
    setError(refusal);
    if (refusal) return;
    if (next !== (value ?? '').trim()) onCommit(next);
    setIsEditing(false);
  };

  if (isEditing) {
    const shared = {
      autoFocus: true,
      'aria-label': ariaLabel,
      'aria-invalid': !!error,
      value: draft,
      onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
      onBlur: commit,
      ...FIELD,
      boxShadow: `inset 0 0 0 2px {colors.${error ? 'app.error' : 'app.primary'}}`,
      border: 'none',
      outline: 'none',
      color,
      fontSize,
      fontWeight,
    };
    return (
      <Box>
        {multiline ? (
          <AutoResizeTextarea
            {...shared}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
          />
        ) : (
          <chakra.input
            {...shared}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
          />
        )}
        {error && (
          <Text fontSize="sm" color="app.error.fg" mt={1} role="alert">
            {error}
          </Text>
        )}
      </Box>
    );
  }

  const isEmpty = !value?.trim();

  return (
    <HStack
      as="button"
      aria-label={ariaLabel}
      onClick={() => {
        setDraft(value ?? '');
        setIsEditing(true);
      }}
      {...FIELD}
      gap="10px"
      textAlign="left"
      align="start"
      color="fg.muted"
      _hover={{ boxShadow: 'inset 0 0 0 1.5px {colors.fg.muted}' }}
      transition="box-shadow 0.15s"
    >
      {icon && (
        <Box pt="3px" flexShrink={0} aria-hidden>
          {icon}
        </Box>
      )}
      <Text
        flex={1}
        minW={0}
        fontSize={fontSize}
        fontWeight={isEmpty ? 'normal' : fontWeight}
        color={isEmpty ? 'fg.muted' : color}
        whiteSpace="pre-wrap"
        wordBreak="break-word"
      >
        {isEmpty ? emptyLabel : value}
      </Text>
    </HStack>
  );
};

interface ExerciseSheetProps {
  exercise: Exercise;
  onClose?: () => void;
  /** Absent quand la fiche s'ouvre depuis un endroit où supprimer n'a pas
   *  de sens — l'atelier, par exemple. */
  onDelete?: () => void;
  /**
   * Le libellé du bouton qui referme la fiche, quand une croix ne suffit pas
   * à dire où l'on retourne.
   *
   * Dans la bibliothèque, fermer la fiche rend la liste qui est déjà
   * derrière : la croix se comprend. Ouverte par-dessus le programme, elle
   * recouvre ce qu'on était en train d'écrire, et le coach cherche à
   * « valider » — d'où un bouton nommé, en bas, là où le pouce finit de
   * lire.
   */
  doneLabel?: string;
}

/**
 * La fiche d'un exercice : sa vidéo, son nom, sa consigne, son lien, et ce
 * qu'il touche.
 *
 * Chaque valeur s'édite là où elle se lit et s'enregistre seule, comme le
 * programme — sans message : « Exercice modifié » sortait à chaque champ
 * quitté, un bandeau pour une frappe.
 *
 * Le pied dit la portée : un exercice utilisé se modifie pour toutes les
 * séances qui le portent, et ne se supprime pas — le bouton reste là,
 * inactif, et la phrase dit pourquoi, parce qu'un bouton absent ne dit
 * rien. Jamais utilisé, il se supprime d'une touche, et la bibliothèque
 * offre « Annuler ».
 */
export const ExerciseSheet = ({
  exercise,
  onClose,
  onDelete,
  doneLabel,
}: ExerciseSheetProps) => {
  const updateMutation = useUpdateExercise();
  // Ouverte depuis un programme, la fiche reçoit l'exercice tel que le
  // programme le porte, sans ses compteurs : la bibliothèque les a.
  const { data: library } = useExercises();
  const counted = library?.find((e) => e._id === exercise._id) ?? exercise;
  const used = (counted.usageCount ?? 0) > 0;
  const storedLinkError = exercise.videoUrl
    ? videoLinkError(exercise.videoUrl)
    : null;

  const patch = (field: Editable) => (value: string) =>
    updateMutation.mutate({
      id: exercise._id,
      data: { [field]: value || undefined },
    });

  return (
    <VStack align="stretch" gap="12px">
      {/* La vidéo d'abord, en vignette : le lecteur ne se monte qu'au
          toucher, et une autre adresse que YouTube s'ouvre ailleurs. */}
      {exercise.videoUrl && !storedLinkError && (
        <Box borderRadius="20px" overflow="hidden">
          <VideoPlayer url={exercise.videoUrl} />
        </Box>
      )}

      <HStack align="start" gap="8px">
        <Box flex={1} minW={0}>
          <SheetField
            value={exercise.name}
            onCommit={patch('name')}
            ariaLabel="Nom de l'exercice"
            emptyLabel="Sans nom"
            fontSize="18px"
            fontWeight="800"
            required
          />
        </Box>
        {(updateMutation.isPending || onClose) && (
          <HStack gap="4px" flexShrink={0} minH="48px">
            {updateMutation.isPending && (
              <Spinner size="xs" aria-label="Enregistrement" />
            )}
            {onClose && (
              <Box
                as="button"
                aria-label="Fermer la fiche"
                color="fg.muted"
                _hover={{ color: 'fg' }}
                p="8px"
                onClick={onClose}
              >
                <LuX size={18} />
              </Box>
            )}
          </HStack>
        )}
      </HStack>

      <SheetField
        value={exercise.description}
        onCommit={patch('description')}
        ariaLabel={`Consigne — ${exercise.name}`}
        emptyLabel="+ consigne"
        multiline
      />

      <Box>
        <SheetField
          value={exercise.videoUrl}
          onCommit={patch('videoUrl')}
          ariaLabel={`Lien vidéo — ${exercise.name}`}
          emptyLabel="+ lien d’une vidéo"
          fontSize="sm"
          color="fg.muted"
          icon={<LuLink size={16} />}
          validate={videoLinkError}
        />
        {/* Un lien enregistré avant que la saisie ne refuse : il ne
            s'affiche pas, et la fiche dit pourquoi. */}
        {storedLinkError && (
          <Text fontSize="sm" color="app.error.fg" mt={1} data-link-error>
            {storedLinkError}
          </Text>
        )}
      </Box>

      {(used || onDelete) && (
        <HStack
          align="start"
          gap="12px"
          pt="10px"
          borderTopWidth="1px"
          borderColor="line"
          data-exercise-reach
        >
          <Text flex={1} minW={0} fontSize="sm" color="fg.muted">
            {used ? reachLine(counted) : 'Jamais utilisé.'}
            {used && onDelete && (
              <>
                <br />
                Retire-le de ces séances avant de le supprimer.
              </>
            )}
          </Text>
          {onDelete && (
            <ActionButton
              tone="danger"
              size="sm"
              disabled={used}
              onClick={onDelete}
              aria-label={`Supprimer ${exercise.name}`}
            >
              <LuTrash2 size={14} aria-hidden />
              Supprimer
            </ActionButton>
          )}
        </HStack>
      )}

      {/* La validation d'une fiche ouverte par-dessus le programme.
          Les champs partent déjà à la perte du focus — il n'y a rien à
          enregistrer ici. Mais une fiche qui recouvre la séance en cours
          d'écriture laisse chercher comment revenir, et une croix dans un
          coin ne le dit pas. Le clic retire d'abord le focus du champ
          ouvert, donc sa valeur est partie avant que la fiche se referme. */}
      {doneLabel && onClose && (
        <Box
          as="button"
          // Le champ ouvert garde le focus jusqu'au clic, puis on le valide
          // et on referme. Laissé à lui-même, il se repliait dès que la
          // souris s'enfonçait : une consigne de trois lignes redevenait une
          // ligne, le bouton remontait sous le pointeur, et le relâchement
          // tombait à côté — la fiche restait ouverte. Le banc l'a vu dans
          // la colonne de 300 px où la fiche se pose désormais (E6b).
          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur();
            onClose();
          }}
          mt={2}
          py={2.5}
          borderRadius="md"
          bg="app.primary/12"
          color="app.primary"
          fontSize="sm"
          fontWeight="medium"
          _hover={{ bg: 'app.primary/20' }}
        >
          {doneLabel}
        </Box>
      )}
    </VStack>
  );
};
