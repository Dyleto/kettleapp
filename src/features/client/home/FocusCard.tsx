import { HStack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { LuPlay } from 'react-icons/lu';
import { ActionButton, Chip, Eyebrow, HeroCard, LinkButton } from '@/kit';
import { CoachBubble } from '@/features/client/common/CoachBubble';

interface FocusCardProps {
  eyebrow: string;
  title: string;
  chips: string[];
  /** Le mot du coach sur la séance, s'il en a laissé un. */
  note?: string;
  cta: string;
  onCta: () => void;
  link?: string;
  onLink?: () => void;
  /** Une dernière pastille, discrète : « commencée il y a 20 min ». */
  aside?: string;
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
export const FocusCard = ({
  eyebrow,
  title,
  chips,
  note,
  cta,
  onCta,
  link,
  onLink,
  aside,
  extra,
}: FocusCardProps) => (
  <HeroCard label={eyebrow}>
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
    {(chips.length > 0 || aside) && (
      <HStack gap="6px" wrap="wrap">
        {chips.map((chip, index) => (
          <Chip key={chip} tone={index === 0 ? 'amber' : 'neutral'}>
            {chip}
          </Chip>
        ))}
        {aside && <Chip tone="outline">{aside}</Chip>}
      </HStack>
    )}
    {extra}
    {note && (
      <CoachBubble tone="hero" clamp={3}>
        {note}
      </CoachBubble>
    )}
    <ActionButton size="lg" w="full" onClick={onCta}>
      <LuPlay size={18} fill="currentColor" aria-hidden />
      {cta}
    </ActionButton>
    {link && onLink && <LinkButton onClick={onLink}>{link}</LinkButton>}
  </HeroCard>
);
