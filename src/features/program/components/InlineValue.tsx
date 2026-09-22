import { Box, Input, Text } from '@chakra-ui/react';
import { hitAreaTactile } from '@/components/hitArea';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import { useState } from 'react';

interface InlineValueProps {
  value?: number;
  onChange: (value?: number) => void;
  /** The word glued to the value: "reps", "s", "min", "tours"… */
  suffix?: string;
  /** What reads when the value is absent. Never "0". */
  emptyLabel?: string;
  ariaLabel: string;
  min?: number;
  /** The field's width while editing — the resting footprint does not move. */
  width?: string;
  /** Allows clearing entirely (an optional setting). */
  clearable?: boolean;
  /**
   * How the value reads once set.
   *
   * We edit in seconds — that is the unit the coach thinks and types in — but
   * we read back in the product's own spelling. Without this, a 120 s
   * duration read "120 s" for the coach and "2 min" for their client: the
   * same data, two conventions, and no way to check from one what the other
   * will see.
   */
  format?: (value: number) => string;
}

const parse = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * At rest it is text, on click it is a field — in the same footprint, without
 * shifting the line. That is what lets a programme read as a programme rather
 * than as a form.
 */
export const InlineValue = ({
  value,
  onChange,
  suffix,
  emptyLabel = '—',
  ariaLabel,
  min = 0,
  width = '56px',
  clearable = false,
  format,
}: InlineValueProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  /** What was there before opening — what Escape has to give back. */
  const [initiale, setInitiale] = useState<number | undefined>(undefined);

  const open = () => {
    setInitiale(value);
    setDraft(value === undefined ? '' : String(value));
    setIsEditing(true);
  };

  /**
   * Every keystroke leaves at once — and that is what saves the work.
   *
   * The field kept its value to itself until a click outside or the Enter
   * key. A coach who typed "12" then pressed their phone's back button lost
   * both characters: they had never left the field, so autosave had nothing
   * to save.
   *
   * Sending as you type costs nothing: the save already waits 800 ms before
   * leaving, precisely to absorb a value typed character by character. A
   * momentarily empty field, on the other hand, is not a cleared value: we
   * only send it on validation, which alone knows what "empty" means here.
   */
  const saisir = (raw: string) => {
    setDraft(raw);
    const next = parse(raw);
    if (next !== undefined && next >= min) onChange(next);
  };

  const commit = () => {
    const next = parse(draft);
    if (next === undefined) {
      if (clearable) onChange(undefined);
    } else if (next >= min) {
      onChange(next);
    }
    setIsEditing(false);
  };

  // Escape cancels, as before — but it now has something to undo.
  const annuler = () => {
    if (value !== initiale) onChange(initiale);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        autoFocus
        size="xs"
        w={width}
        h="22px"
        px={1}
        textAlign="center"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => saisir(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            annuler();
          }
        }}
        bg="whiteAlpha.100"
        borderColor="app.primary.border"
        borderRadius="sm"
        fontFamily="mono"
        fontSize="sm"
      />
    );
  }

  const isEmpty = value === undefined;

  return (
    <Box
      as="button"
      aria-label={ariaLabel}
      onClick={open}
      px={1}
      borderRadius="sm"
      // The underline is not decorative: without it, nothing distinguishes
      // an editable value from fixed text. On focus too, not hover alone.
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={hitAreaTactile()}
      transition="text-decoration-color 0.15s"
    >
      <Text
        as="span"
        fontFamily="mono"
        fontSize="sm"
        fontWeight={isEmpty ? 'normal' : 'semibold'}
        color={isEmpty ? 'fg.muted' : 'fg'}
      >
        {isEmpty
          ? emptyLabel
          : format
            ? format(value as number)
            : `${value}${suffix ? `\u00A0${suffix}` : ''}`}
      </Text>
    </Box>
  );
};

interface InlineSequenceProps {
  value?: number[];
  onChange: (value: number[]) => void;
  ariaLabel: string;
}

// Lenient parsing: dash, comma, space or middle dot, as you like.
const parseSequence = (raw: string): number[] =>
  raw
    .split(/[^0-9]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);

/**
 * A seven-rung pyramid used to take seven steppers and six "add" clicks. Here
 * it is one field, with the parsed result echoed just below — and it is that
 * echo which makes free text safe.
 */
export const InlineSequence = ({
  value,
  onChange,
  ariaLabel,
}: InlineSequenceProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [initiale, setInitiale] = useState<number[] | undefined>(undefined);

  const parsed = isEditing ? parseSequence(draft) : (value ?? []);

  // Same reason as above: a sequence typed but not validated existed
  // nowhere, and leaving the page took it.
  const saisir = (raw: string) => {
    setDraft(raw);
    onChange(parseSequence(raw));
  };

  const commit = () => {
    onChange(parseSequence(draft));
    setIsEditing(false);
  };

  const annuler = () => {
    onChange(initiale ?? []);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Box>
        <Input
          autoFocus
          size="xs"
          h="22px"
          w="180px"
          aria-label={ariaLabel}
          value={draft}
          onChange={(e) => saisir(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              annuler();
            }
          }}
          placeholder="5-10-15-20-15-10-5"
          bg="whiteAlpha.100"
          borderColor="app.primary.border"
          borderRadius="sm"
          fontFamily="mono"
          fontSize="sm"
        />
        <Text fontSize="xs" color="fg.muted" mt={1} textAlign="right">
          {parsed.length > 0
            ? `${parsed.join(' · ')} — ${parsed.length} palier${parsed.length > 1 ? 's' : ''}`
            : 'aucun palier'}
        </Text>
      </Box>
    );
  }

  const isEmpty = !value || value.length === 0;

  return (
    <Box
      as="button"
      aria-label={ariaLabel}
      onClick={() => {
        setInitiale(value);
        setDraft((value ?? []).join('-'));
        setIsEditing(true);
      }}
      px={1}
      borderRadius="sm"
      textAlign="left"
      whiteSpace="normal"
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={hitAreaTactile()}
      transition="text-decoration-color 0.15s"
    >
      <Text
        as="span"
        fontFamily="mono"
        fontSize="sm"
        color={isEmpty ? 'fg.muted' : 'fg'}
      >
        {isEmpty ? 'aucun palier' : value.join(' · ')}
      </Text>
    </Box>
  );
};

interface InlineTextProps {
  value?: string;
  onChange: (value?: string) => void;
  /** What we offer when it is empty — revealed on hover only. */
  addLabel: string;
  ariaLabel: string;
  fontSize?: string;
  width?: string;
  /**
   * Text that may run to several lines: a session note, a block instruction.
   * The field becomes an area that grows with the text, and Enter inserts a
   * line break there instead of closing.
   *
   * A block's name stays on one line: it fits in a label.
   */
  multiline?: boolean;
  /**
   * Mounts the field already open. Useful when the invitation to write lives
   * elsewhere — a gutter control, say — and asking for a second click on a
   * "+ consigne" just requested would be absurd.
   */
  startOpen?: boolean;
}

/**
 * Optional text that leaves no trace when empty.
 *
 * A permanent placeholder on every block — "nom libre", "consigne…" — turns
 * the page into a form: you read ten invitations to fill things in before you
 * read the programme. Here, empty means absent; the invitation only appears
 * on hover or keyboard focus.
 */
export const InlineText = ({
  value,
  onChange,
  addLabel,
  ariaLabel,
  fontSize = 'xs',
  width = '100%',
  multiline = false,
  startOpen = false,
}: InlineTextProps) => {
  const [isEditing, setIsEditing] = useState(startOpen);
  const hasValue = !!value?.trim();

  /**
   * Escape closes, it does not cancel — and that is deliberate.
   *
   * This field had been aligned on the number one, where Escape returns the
   * previous value. That conflated two gestures: you replace a number, and
   * you may want to abandon the replacement; you write text, and it saves as
   * you type. Here Escape means "I am done", just as Ctrl+Enter does.
   * Thirteen controls already said so.
   */
  const ouvrir = () => setIsEditing(true);

  if (!hasValue && !isEditing) {
    return (
      // Under a finger there is no hover: the invitation stayed invisible
      // AND out of reach on mobile. It shows there permanently, and only
      // fades beyond 768 px, where hover brings it back.
      <Box
        as="button"
        aria-label={ariaLabel}
        onClick={ouvrir}
        fontSize="xs"
        color="fg.muted"
        minH="32px"
        display="flex"
        alignItems="center"
        opacity={{ base: 0.7, md: 0 }}
        css={hitAreaTactile()}
        _groupHover={{ opacity: 0.7 }}
        _focusVisible={{
          opacity: 1,
        }}
        transition="opacity 0.15s"
      >
        {addLabel}
      </Box>
    );
  }

  if (isEditing) {
    const communes = {
      autoFocus: true,
      'aria-label': ariaLabel,
      value: value ?? '',
      onBlur: () => setIsEditing(false),
      bg: 'whiteAlpha.100',
      borderColor: 'app.primary.border',
      borderRadius: 'sm',
      fontSize,
      px: 1,
      w: width,
    } as const;

    if (multiline) {
      return (
        <AutoResizeTextarea
          {...communes}
          minH="20px"
          py={0.5}
          lineHeight="1.6"
          onChange={(e) => onChange(e.target.value || undefined)}
          onKeyDown={(e) => {
            // Enter belongs to the text. Escape closes, and Ctrl/⌘+Enter
            // too — for anyone used to confirming from the keyboard.
            if (
              e.key === 'Escape' ||
              (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
            ) {
              e.preventDefault();
              setIsEditing(false);
            }
          }}
        />
      );
    }

    return (
      <Input
        {...communes}
        size="xs"
        h="20px"
        onChange={(e) => onChange(e.target.value || undefined)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault();
            setIsEditing(false);
          }
        }}
      />
    );
  }

  return (
    <Box
      as="button"
      aria-label={ariaLabel}
      onClick={ouvrir}
      textAlign="left"
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={hitAreaTactile()}
      transition="text-decoration-color 0.15s"
    >
      {/* Without `pre-wrap`, typed line breaks would be flattened on
          reading back: the text would run onto one line, with nothing to say
          so. */}
      <Text
        as="span"
        fontSize={fontSize}
        color="fg.muted"
        whiteSpace={multiline ? 'pre-wrap' : undefined}
      >
        {value}
      </Text>
    </Box>
  );
};
