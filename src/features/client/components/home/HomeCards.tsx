import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { LuPlay } from 'react-icons/lu';
import { ActionButton } from '@/shared/components/ActionButton';
import { hitArea } from '@/shared/components/hitArea';

/** Une carte de l'accueil : le fond, l'arrondi et l'espacement de la maquette. */
export const HomeCard = ({
  children,
  label,
  ...rest
}: {
  children: ReactNode;
  /** Le nom de la région, pour qu'on la trouve sans la lire en entier. */
  label?: string;
} & React.ComponentProps<typeof VStack>) => (
  <VStack
    as="section"
    aria-label={label}
    align="stretch"
    gap={3}
    bg="surface.card"
    borderRadius="card"
    p="18px"
    {...rest}
  >
    {children}
  </VStack>
);

/** La petite ligne en capitales au-dessus d'un titre : « À faire aujourd'hui ». */
export const Eyebrow = ({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'amber' | 'teal';
}) => (
  <Text
    fontSize="11px"
    fontWeight="800"
    lineHeight="1"
    letterSpacing="0.14em"
    textTransform="uppercase"
    color={
      tone === 'amber'
        ? 'app.primary.fg'
        : tone === 'teal'
          ? 'session.rest.fg'
          : 'fg.muted'
    }
  >
    {children}
  </Text>
);

/** Une pastille de repère : la durée, un format, une suite de semaines. */
export const HomeChip = ({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'amber' | 'coral' | 'outline';
}) => (
  <HStack
    as="span"
    gap="6px"
    px="11px"
    py="5px"
    borderRadius="full"
    bg={
      tone === 'amber'
        ? 'app.primary.bg'
        : tone === 'coral'
          ? 'session.work/16'
          : tone === 'outline'
            ? 'transparent'
            : 'bg.surface'
    }
    color={
      tone === 'amber'
        ? 'app.primary.fg'
        : tone === 'coral'
          ? 'session.work.fg'
          : 'fg'
    }
    boxShadow={
      tone === 'outline' ? 'inset 0 0 0 1.5px {colors.line}' : undefined
    }
    fontSize="13px"
    fontWeight="600"
    lineHeight="1.25"
    whiteSpace="nowrap"
  >
    {children}
  </HStack>
);

interface HeroCardProps {
  eyebrow: string;
  title: string;
  chips: string[];
  /** Le mot du coach sur la séance, s'il en a laissé un. */
  note?: string;
  cta: string;
  onCta: () => void;
  link?: string;
  onLink?: () => void;
  /** Ce qui s'insère sous les pastilles : la progression d'une séance en cours. */
  extra?: ReactNode;
}

/**
 * La carte qui répond à « qu'est-ce que je fais maintenant ? ».
 *
 * « Démarrer » ouvre la séance guidée directement, sur son écran
 * d'ouverture : la carte menait à la fiche, d'où un second bouton menait à
 * l'ouverture, d'où un troisième lançait la séance — trois touches avant le
 * premier exercice. La fiche reste à un lien, dessous, pour qui veut lire
 * avant.
 *
 * Le mot du coach tient en trois lignes : la carte n'est pas l'endroit où
 * le lire en entier, la fiche et l'ouverture le donnent.
 */
export const HeroCard = ({
  eyebrow,
  title,
  chips,
  note,
  cta,
  onCta,
  link,
  onLink,
  extra,
}: HeroCardProps) => (
  <VStack
    as="section"
    aria-label={eyebrow}
    align="stretch"
    gap="14px"
    borderRadius="card"
    p="18px"
    bg="linear-gradient(160deg, #2B2415, {colors.surface.card} 62%)"
    boxShadow="inset 0 0 0 1.5px {colors.app.primary/45}"
  >
    <Eyebrow tone="amber">{eyebrow}</Eyebrow>
    <Text
      as="h2"
      fontSize="32px"
      fontWeight="800"
      lineHeight="1.1"
      letterSpacing="-0.01em"
      fontStretch="88%"
    >
      {title}
    </Text>
    {chips.length > 0 && (
      <HStack gap="6px" wrap="wrap">
        {chips.map((chip, index) => (
          <HomeChip key={chip} tone={index === 0 ? 'amber' : undefined}>
            {chip}
          </HomeChip>
        ))}
      </HStack>
    )}
    {extra}
    {note && (
      <Box
        bg="blackAlpha.300"
        borderRadius="20px 20px 20px 6px"
        px="14px"
        py={3}
      >
        <Text fontSize="xs" color="fg.muted" mb={1}>
          Ton coach te dit&nbsp;:
        </Text>
        <Text fontSize="15px" lineHeight="1.45" lineClamp={3}>
          {note}
        </Text>
      </Box>
    )}
    <ActionButton size="lg" w="full" onClick={onCta}>
      <LuPlay size={18} fill="currentColor" aria-hidden />
      {cta}
    </ActionButton>
    {link && onLink && (
      <Box
        as="button"
        alignSelf="center"
        css={hitArea()}
        color="fg.muted"
        fontSize="sm"
        fontWeight="700"
        onClick={onLink}
        _hover={{ color: 'fg' }}
      >
        {link}
      </Box>
    )}
  </VStack>
);
