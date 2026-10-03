import { Box, Input, Text } from '@chakra-ui/react';
import { touchHitArea } from '@/shared/components/hitArea';
import { AutoResizeTextarea } from '@/shared/components/AutoResizeTextarea';
import { useState } from 'react';

interface InlineValueProps {
  value?: number;
  onChange: (value?: number) => void;
  /** Le mot collé à la valeur : « reps », « s », « min », « tours »… */
  suffix?: string;
  /** Ce qui se lit quand la valeur est absente. Jamais « 0 ». */
  emptyLabel?: string;
  ariaLabel: string;
  min?: number;
  /** La largeur du champ pendant l'édition — l'empreinte au repos ne bouge
   * pas. */
  width?: string;
  /** Autorise l'effacement complet : le réglage est optionnel, et le vider
   * doit se distinguer de le mettre à zéro. */
  clearable?: boolean;
  /**
   * Comment la valeur se lit une fois posée.
   *
   * On édite en secondes — c'est l'unité dans laquelle le coach pense et
   * tape — mais on relit dans l'orthographe du produit. Sans cela, une durée
   * de 120 s se lisait « 120 s » pour le coach et « 2 min » pour son client :
   * la même donnée, deux conventions, et aucun moyen de vérifier depuis l'une
   * ce que l'autre verra.
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
  /** Ce qu'il y avait avant l'ouverture — ce qu'Échap doit rendre. */
  const [initial, setInitial] = useState<number | undefined>(undefined);

  const open = () => {
    setInitial(value);
    setDraft(value === undefined ? '' : String(value));
    setIsEditing(true);
  };

  /**
   * Chaque frappe part aussitôt — et c'est ce qui sauve le travail.
   *
   * Le champ gardait sa valeur pour lui jusqu'à un clic à l'extérieur ou la
   * touche Entrée. Un coach qui tapait « 12 » puis appuyait sur le bouton
   * retour de son téléphone perdait les deux caractères : il n'était jamais
   * sorti du champ, l'enregistrement automatique n'avait donc rien à
   * enregistrer.
   *
   * Envoyer au fil de la frappe ne coûte rien : l'enregistrement attend déjà
   * 800 ms avant de partir, précisément pour absorber une valeur tapée
   * caractère par caractère. Un champ momentanément vide, en revanche, n'est
   * pas une valeur effacée : on ne l'envoie qu'à la validation, seule à
   * savoir ce que « vide » veut dire ici.
   */
  const onInput = (raw: string) => {
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

  // Échap annule, comme avant — mais il a maintenant quelque chose à
  // défaire.
  const cancel = () => {
    if (value !== initial) onChange(initial);
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
        onChange={(e) => onInput(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
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
      // Le soulignement n'est pas décoratif : sans lui, rien ne distingue
      // une valeur éditable d'un texte fixe. Au focus aussi, pas au seul
      // survol.
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={touchHitArea()}
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

// Lecture indulgente : tiret, virgule, espace ou point médian, comme on
// veut. Le coach tape « 21-15-9 » ou « 21 15 9 » selon l'humeur, et lui
// refuser l'un des deux ne protège de rien.
const parseSequence = (raw: string): number[] =>
  raw
    .split(/[^0-9]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);

/**
 * Une pyramide de sept paliers demandait sept compteurs et six clics sur
 * « ajouter ». Ici c'est un champ, avec le résultat analysé rappelé juste en
 * dessous — et c'est ce rappel qui rend le texte libre sans danger.
 */
export const InlineSequence = ({
  value,
  onChange,
  ariaLabel,
}: InlineSequenceProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [initial, setInitial] = useState<number[] | undefined>(undefined);

  const parsed = isEditing ? parseSequence(draft) : (value ?? []);

  // Même raison que plus haut : une suite tapée mais non validée
  // n'existait nulle part, et quitter la page l'emportait.
  const onInput = (raw: string) => {
    setDraft(raw);
    onChange(parseSequence(raw));
  };

  const commit = () => {
    onChange(parseSequence(draft));
    setIsEditing(false);
  };

  const cancel = () => {
    onChange(initial ?? []);
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
          onChange={(e) => onInput(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
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
        setInitial(value);
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
      css={touchHitArea()}
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
  /** Ce qu'on propose quand c'est vide — révélé au seul survol. */
  addLabel: string;
  ariaLabel: string;
  fontSize?: string;
  width?: string;
  /**
   * Un texte qui peut courir sur plusieurs lignes : une note de séance, une
   * consigne de bloc. Le champ devient une zone qui grandit avec le texte, et
   * Entrée y insère un saut de ligne au lieu de fermer.
   *
   * Le nom d'un bloc reste sur une ligne : il tient dans une étiquette.
   */
  multiline?: boolean;
  /**
   * Monte le champ déjà ouvert. Utile quand l'invitation à écrire vit
   * ailleurs — une commande de gouttière, par exemple — et que demander un
   * second clic sur une « + consigne » qu'on vient de réclamer serait
   * absurde.
   */
  startOpen?: boolean;
}

/**
 * Un texte facultatif qui ne laisse aucune trace quand il est vide.
 *
 * Un texte d'invite permanent sur chaque bloc — « nom libre », « consigne… »
 * — transforme la page en formulaire : on lit dix invitations à remplir avant
 * de lire le programme. Ici, vide veut dire absent ; l'invitation
 * n'apparaît qu'au survol ou au focus clavier.
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
   * Échap ferme, il n'annule pas — et c'est voulu.
   *
   * Ce champ avait été aligné sur celui des nombres, où Échap rend la valeur
   * précédente. Cela confondait deux gestes : on remplace un nombre, et l'on
   * peut vouloir abandonner le remplacement ; on écrit un texte, et il
   * s'enregistre au fil de la frappe. Ici Échap veut dire « j'ai fini »,
   * comme Ctrl+Entrée. Treize commandes le disaient déjà.
   */
  const startEditing = () => setIsEditing(true);

  if (!hasValue && !isEditing) {
    return (
      // Sous un doigt il n'y a pas de survol : l'invitation restait invisible
      // ET hors d'atteinte sur mobile. Elle s'y affiche en permanence, et ne
      // s'efface qu'au-delà de 768 px, où le survol la ramène.
      <Box
        as="button"
        aria-label={ariaLabel}
        onClick={startEditing}
        fontSize="xs"
        color="fg.muted"
        minH="32px"
        display="flex"
        alignItems="center"
        opacity={{ base: 0.7, md: 0 }}
        css={touchHitArea()}
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
    const shared = {
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
          {...shared}
          minH="20px"
          py={0.5}
          lineHeight="1.6"
          onChange={(e) => onChange(e.target.value || undefined)}
          onKeyDown={(e) => {
            // Entrée appartient au texte. Échap ferme, et Ctrl/⌘+Entrée
            // aussi — pour qui a l'habitude de valider au clavier.
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
        {...shared}
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
      onClick={startEditing}
      textAlign="left"
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="3px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
      css={touchHitArea()}
      transition="text-decoration-color 0.15s"
    >
      {/* Sans `pre-wrap`, les sauts de ligne tapés seraient aplatis à la
          relecture : le texte courrait sur une seule ligne, sans que rien ne
          le dise. */}
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
