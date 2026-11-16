import { VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  /** Le nom de la région, pour qu'on la trouve sans la lire en entier. */
  label?: string;
} & React.ComponentProps<typeof VStack>;

/**
 * Une carte : le fond, l'arrondi et l'espacement de la maquette.
 *
 * Une région nommée (`section` et `aria-label`) : un lecteur d'écran passe
 * d'une carte à l'autre comme on les parcourt de l'œil, et le banc les
 * retrouve par leur nom plutôt que par leur texte, qui change avec le jour.
 *
 * `outline` est la carte à contour de la maquette : une information, sans
 * action. Elle n'a pas de fond, pour ne pas se lire comme quelque chose à
 * toucher.
 */
export const Card = ({
  children,
  label,
  variant = 'filled',
  ...rest
}: CardProps & { variant?: 'filled' | 'outline' }) => (
  <VStack
    as="section"
    aria-label={label}
    align="stretch"
    gap={3}
    bg={variant === 'filled' ? 'surface.card' : 'transparent'}
    boxShadow={
      variant === 'outline' ? 'inset 0 0 0 1.5px {colors.line}' : undefined
    }
    borderRadius="card"
    p="18px"
    {...rest}
  >
    {children}
  </VStack>
);

/**
 * La carte mise en avant : une par écran, au plus. Elle signale la chose à
 * faire — la séance du jour, celle qu'on a laissée en cours.
 *
 * Seule à porter le dégradé et le contour ambre : en mettre deux sur un même
 * écran, c'est n'en mettre aucune en avant.
 */
export const HeroCard = ({ children, label, ...rest }: CardProps) => (
  <VStack
    as="section"
    aria-label={label}
    align="stretch"
    gap="14px"
    borderRadius="card"
    p="18px"
    bg="linear-gradient(160deg, #2B2415, {colors.surface.card} 62%)"
    boxShadow="inset 0 0 0 1.5px {colors.app.primary/45}"
    {...rest}
  >
    {children}
  </VStack>
);
