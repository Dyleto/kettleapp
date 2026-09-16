import { Box, Input, Text } from '@chakra-ui/react';
import { hitArea } from '@/components/hitArea';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import { useState } from 'react';

interface InlineValueProps {
  value?: number;
  onChange: (value?: number) => void;
  /** Mot collé à la valeur : « reps », « s », « min », « tours »… */
  suffix?: string;
  /** Ce qu'on lit quand la valeur est absente. Jamais « 0 ». */
  emptyLabel?: string;
  ariaLabel: string;
  min?: number;
  /** Largeur du champ en édition — l'empreinte au repos ne bouge pas. */
  width?: string;
  /** Autorise l'effacement complet (réglage facultatif). */
  clearable?: boolean;
  /**
   * Comment la valeur se lit une fois posée.
   *
   * On édite en secondes — c'est l'unité dans laquelle le coach pense et
   * qu'il tape —, mais on relit dans l'écriture du produit. Sans ça, une
   * durée de 120 s se lisait « 120 s » chez le coach et « 2 min » chez son
   * client : la même donnée, deux conventions, et aucun moyen de vérifier de
   * l'un ce que verra l'autre.
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
 * Au repos c'est du texte, au clic c'est un champ — dans la même empreinte,
 * sans décaler la ligne. C'est ce qui permet à un programme de se lire comme
 * un programme plutôt que comme un formulaire.
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

  const open = () => {
    setDraft(value === undefined ? '' : String(value));
    setIsEditing(true);
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
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsEditing(false);
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
      // Le soulignement n'est pas décoratif : sans lui, rien ne distingue une
      // valeur modifiable d'un texte figé. Au focus aussi, pas au seul survol.
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={hitArea(32)}
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

// Lecture tolérante : tiret, virgule, espace ou point-médian, au choix.
const parseSequence = (raw: string): number[] =>
  raw
    .split(/[^0-9]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);

/**
 * Une pyramide de sept paliers demandait sept compteurs et six clics
 * « ajouter ». Ici c'est un champ, et l'écho du résultat interprété juste
 * dessous — c'est cet écho qui rend le texte libre sans risque.
 */
export const InlineSequence = ({
  value,
  onChange,
  ariaLabel,
}: InlineSequenceProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const parsed = isEditing ? parseSequence(draft) : (value ?? []);

  const commit = () => {
    onChange(parseSequence(draft));
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
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setIsEditing(false);
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
      css={hitArea(32)}
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
  /** Ce qu'on propose quand c'est vide — révélé au survol seulement. */
  addLabel: string;
  ariaLabel: string;
  fontSize?: string;
  width?: string;
  /**
   * Un texte qui peut tenir sur plusieurs lignes : note de séance, consigne de
   * bloc. Le champ devient une zone qui grandit avec le texte, et Entrée y
   * insère un retour au lieu de refermer.
   *
   * Un nom de bloc, lui, reste sur une ligne : il tient dans une étiquette.
   */
  multiline?: boolean;
  /**
   * Monte le champ déjà ouvert. Sert quand l'invitation à écrire vit ailleurs
   * — une commande de la gouttière, par exemple — et qu'il serait absurde de
   * demander un second clic sur un « + consigne » qu'on vient de réclamer.
   */
  startOpen?: boolean;
}

/**
 * Un texte facultatif qui ne laisse aucune trace quand il est vide.
 *
 * Un placeholder permanent sur chaque bloc — « nom libre », « consigne… » —
 * transforme la page en formulaire : on lit dix invitations à remplir avant
 * de lire le programme. Ici, vide veut dire absent ; l'invitation n'apparaît
 * qu'au survol ou au focus clavier.
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

  if (!hasValue && !isEditing) {
    return (
      // Au doigt, le survol n'existe pas : l'invitation restait invisible ET
      // hors d'atteinte sur mobile. Elle s'y montre en permanence, et ne
      // s'efface qu'au-delà de 768 px, où le survol la ramène.
      <Box
        as="button"
        aria-label={ariaLabel}
        onClick={() => setIsEditing(true)}
        fontSize="xs"
        color="fg.muted"
        minH="32px"
        display="flex"
        alignItems="center"
        opacity={{ base: 0.7, md: 0 }}
        css={hitArea(32)}
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
            // Entrée sert au texte. Échap referme, et Ctrl/⌘+Entrée aussi —
            // pour qui a l'habitude de valider au clavier.
            if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
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
      onClick={() => setIsEditing(true)}
      textAlign="left"
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={hitArea(32)}
      transition="text-decoration-color 0.15s"
    >
      {/* Sans `pre-wrap`, les retours saisis seraient écrasés à la relecture :
          le texte repartirait sur une seule ligne, sans que rien ne le dise. */}
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
