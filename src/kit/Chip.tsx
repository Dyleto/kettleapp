import { HStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';

/** Ce qu'une pastille porte, et donc sa couleur. */
export type ChipTone =
  'neutral' | 'amber' | 'coral' | 'teal' | 'blue' | 'green' | 'outline';

const BG: Record<ChipTone, string> = {
  neutral: 'bg.surface',
  amber: 'app.primary.bg',
  coral: 'session.work/16',
  teal: 'session.rest/18',
  blue: 'effort.easy/16',
  green: 'effort.target/16',
  outline: 'transparent',
};
const FG: Record<ChipTone, string> = {
  neutral: 'fg',
  amber: 'app.primary.fg',
  coral: 'session.work.fg',
  teal: 'session.rest.fg',
  blue: 'effort.easy',
  green: 'effort.target',
  outline: 'fg',
};

/**
 * Une pastille : un état, un repère ou une étiquette — « ≈ 35 min »,
 * « 8 tours », « Conseillée le samedi ».
 *
 * Trois copies vivaient chacune dans l'écran qui l'avait eue en premier :
 * l'accueil, l'ouverture de la séance, la fiche. Elles différaient d'un
 * pixel et d'un nom de couleur, et la quatrième aurait été recopiée de l'une
 * d'elles au hasard.
 *
 * L'ambre dit un réglage ou un repère de durée, le sarcelle ce qui est fait
 * ou ce qui a été réalisé, le corail l'effort ; le bleu une baisse, sans
 * jugement (une charge allégée, dans Progrès) ; le vert, ce qui va bien
 * (« à jour » dans la liste des clients, le vert de « Juste ») ; le contour,
 * une information secondaire. `lg` est celle de l'ouverture d'une séance, lue de plus loin.
 */
export const Chip = ({
  children,
  tone = 'neutral',
  size = 'md',
}: {
  children: ReactNode;
  tone?: ChipTone;
  size?: 'md' | 'lg';
}) => (
  <HStack
    as="span"
    gap="6px"
    px={size === 'lg' ? '14px' : '11px'}
    py={size === 'lg' ? '8px' : '5px'}
    borderRadius="full"
    bg={BG[tone]}
    color={FG[tone]}
    boxShadow={
      tone === 'outline' ? 'inset 0 0 0 1.5px {colors.line}' : undefined
    }
    fontSize={size === 'lg' ? '14.5px' : '13px'}
    fontWeight="600"
    lineHeight="1.25"
    whiteSpace="nowrap"
  >
    {children}
  </HStack>
);
