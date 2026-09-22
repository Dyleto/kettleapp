import {
  Box,
  HStack,
  IconButton,
  Input,
  Link,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { LuExternalLink, LuTrash2, LuVideo, LuX } from 'react-icons/lu';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import { Exercise } from '@/types';
import { parseYouTubeUrl } from '@/utils/videoUtils';
import { useUpdateExercise } from '@/features/exercise/hooks/useExerciseMutations';
import VideoPlayer from '@/components/VideoPlayer';

type Editable = 'name' | 'description' | 'videoUrl';

interface SheetFieldProps {
  value?: string;
  onCommit: (value: string) => void;
  ariaLabel: string;
  /** What reads when empty — it is also the invitation to fill it in. */
  emptyLabel: string;
  multiline?: boolean;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  /** Renvoie le motif du refus, ou `null` si la valeur passe. */
  validate?: (value: string) => string | null;
}

/**
 * A field that reads as text and is edited on click, as in the editor. We
 * save on blur, not with a button.
 */
const SheetField = ({
  value,
  onCommit,
  ariaLabel,
  emptyLabel,
  multiline = false,
  fontSize = 'sm',
  fontWeight = 'normal',
  color = 'fg',
  validate,
}: SheetFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const commit = () => {
    const next = draft.trim();
    // A rejection keeps the field open: leaving while clearing the input
    // would make both the value and the reason for the rejection vanish.
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
      value: draft,
      onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
      onBlur: commit,
      bg: 'whiteAlpha.100',
      borderColor: 'app.primary.border',
      borderRadius: 'sm',
      fontSize,
    };
    if (multiline) {
      return (
        <AutoResizeTextarea
          {...shared}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setError(null);
              setIsEditing(false);
            }
          }}
        />
      );
    }
    return (
      <Box>
        <Input
          {...shared}
          size="sm"
          aria-invalid={!!error}
          borderColor={error ? 'app.error' : 'app.primary.border'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setError(null);
              setIsEditing(false);
            }
          }}
        />
        {error && (
          <Text fontSize="xs" color="app.error" mt={1} role="alert">
            {error}
          </Text>
        )}
      </Box>
    );
  }

  const isEmpty = !value?.trim();

  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      aria-label={ariaLabel}
      onClick={() => {
        setDraft(value ?? '');
        setIsEditing(true);
      }}
      px={1}
      py={0.5}
      borderRadius="sm"
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      transition="text-decoration-color 0.15s"
    >
      <Text
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={isEmpty ? 'fg.muted' : color}
        whiteSpace="pre-wrap"
      >
        {isEmpty ? emptyLabel : value}
      </Text>
    </Box>
  );
};

interface ExerciseSheetProps {
  exercise: Exercise;
  onClose?: () => void;
  /** Absent when the card opens from a context where deletion makes no
   *  sense — the editor, for instance. */
  onDelete?: () => void;
}

/**
 * A link we cannot read used to show nothing: no player, no error. We refuse
 * it while saying what is accepted, rather than saving it and letting the
 * coach discover later that their video does not open.
 */
const validateVideoUrl = (value: string): string | null => {
  if (value === '') return null;
  if (parseYouTubeUrl(value)) return null;
  return 'Lien non reconnu — seul YouTube est lu : watch, youtu.be ou Shorts.';
};

/** `blocksDeletion`: a delete button is offered, and this usage blocks it. */
const usageSentence = (usage: number, blocksDeletion: boolean): string => {
  const base = `Utilisé dans ${usage} séance${usage > 1 ? 's' : ''}`;
  // We say why the button does not respond, instead of leaving it mute.
  return blocksDeletion
    ? `${base} — retirez-le de ces séances avant de pouvoir le supprimer.`
    : base;
};

/**
 * An exercise's card: its name, its instruction, its video.
 *
 * It no longer leads to a separate form. "Modifier" asked for a one-way trip
 * to an input screen to change three words; here every value is edited where
 * it is read, and saving follows the blur.
 */
export const ExerciseSheet = ({
  exercise,
  onClose,
  onDelete,
}: ExerciseSheetProps) => {
  const updateMutation = useUpdateExercise();
  const video = exercise.videoUrl ? parseYouTubeUrl(exercise.videoUrl) : null;
  const usage = exercise.usageCount ?? 0;

  const patch = (field: Editable) => (value: string) =>
    updateMutation.mutate({
      id: exercise._id,
      data: { [field]: value || undefined },
    });

  return (
    <VStack align="stretch" gap={4}>
      <HStack align="flex-start" gap={2}>
        <Box flex={1} minW={0}>
          <SheetField
            value={exercise.name}
            onCommit={patch('name')}
            ariaLabel="Nom de l'exercice"
            emptyLabel="Sans nom"
            fontSize="lg"
            fontWeight="bold"
          />
        </Box>
        <HStack gap={0} flexShrink={0} pt={1}>
          {updateMutation.isPending && <Spinner size="xs" mr={2} />}
          {onDelete && (
            <IconButton
              aria-label={`Supprimer ${exercise.name}`}
              title={usage > 0 ? usageSentence(usage, true) : undefined}
              size="xs"
              variant="ghost"
              color="fg.muted"
              _hover={{ color: 'app.error' }}
              disabled={usage > 0}
              onClick={onDelete}
            >
              <LuTrash2 size={14} />
            </IconButton>
          )}
          {onClose && (
            <Box
              as="button"
              aria-label="Fermer la fiche"
              color="fg.muted"
              _hover={{ color: 'fg' }}
              px={1.5}
              onClick={onClose}
            >
              <LuX size={14} />
            </Box>
          )}
        </HStack>
      </HStack>

      <SheetField
        value={exercise.description}
        onCommit={patch('description')}
        ariaLabel={`Consigne — ${exercise.name}`}
        emptyLabel="+ consigne"
        multiline
      />

      {/* ── Video ── */}
      {video ? (
        <VStack gap={2} align="stretch">
          {/* Thumbnail first, player on click: the card no longer calls
              YouTube until someone has asked to see the video, and can no
              longer show a white slab inside a dark app. */}
          <VideoPlayer url={exercise.videoUrl ?? ''} />
          <HStack gap={2} align="center">
            <Box flex={1} minW={0}>
              <SheetField
                value={exercise.videoUrl}
                onCommit={patch('videoUrl')}
                ariaLabel={`Lien vidéo — ${exercise.name}`}
                emptyLabel="+ vidéo"
                fontSize="xs"
                color="fg.muted"
                validate={validateVideoUrl}
              />
            </Box>
            <Link
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ouvrir la vidéo dans un nouvel onglet"
              color="fg.muted"
              _hover={{ color: 'app.primary' }}
              flexShrink={0}
            >
              <LuExternalLink size={12} />
            </Link>
          </HStack>
        </VStack>
      ) : (
        <HStack gap={2} align="center" color="fg.muted">
          <LuVideo size={13} />
          <Box flex={1} minW={0}>
            <SheetField
              value={exercise.videoUrl}
              onCommit={patch('videoUrl')}
              ariaLabel={`Lien vidéo — ${exercise.name}`}
              emptyLabel="+ vidéo"
              fontSize="xs"
              color="fg.muted"
              validate={validateVideoUrl}
            />
          </Box>
        </HStack>
      )}

      {/* At the foot of the card, not the head: it is a note about the
          exercise, not the first thing to know about it. It also explains why
          the delete button does not respond — a `title` alone would be
          invisible under a finger. */}
      {usage > 0 && (
        <Text
          fontSize="xs"
          color="fg.muted"
          pt={2}
          borderTopWidth="1px"
          borderColor="whiteAlpha.100"
        >
          {usageSentence(usage, !!onDelete)}
        </Text>
      )}
    </VStack>
  );
};
