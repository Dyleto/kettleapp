import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@chakra-ui/react';

/** Ce que le bouton pèse dans l'écran. */
type Tone = 'primary' | 'ghost' | 'soft' | 'danger';
/** Sa taille : `lg` pour l'action de l'écran, `md` dans une carte ou un état
 * vide, `sm` dans une ligne, `xl` pour la séance guidée, qui se lit à bout
 * de bras. */
type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, ButtonProps> = {
  sm: { minH: '40px', px: '15px', fontSize: '14px', borderRadius: '14px' },
  md: { minH: '48px', px: '18px', fontSize: '15px', borderRadius: 'field' },
  lg: { minH: '58px', px: '22px', fontSize: '17px', borderRadius: 'button' },
  xl: { minH: '68px', px: '22px', fontSize: '19px', borderRadius: '26px' },
};

const TONES: Record<Tone, ButtonProps> = {
  primary: {
    bg: 'app.primary',
    color: 'bg.canvas',
    _hover: { bg: 'app.primary.hover' },
  },
  ghost: {
    bg: 'transparent',
    color: 'fg',
    boxShadow: 'inset 0 0 0 1.5px {colors.line}',
    _hover: { bg: 'whiteAlpha.100' },
  },
  soft: {
    bg: 'bg.surface',
    color: 'fg',
    _hover: { bg: 'bg.raised' },
  },
  danger: {
    bg: 'transparent',
    color: 'app.error',
    boxShadow: 'inset 0 0 0 1.5px {colors.app.error/45}',
    _hover: { bg: 'app.error/12' },
  },
};

export interface ActionButtonProps extends Omit<
  ButtonProps,
  'size' | 'variant'
> {
  tone?: Tone;
  size?: Size;
}

/**
 * Le bouton du produit, écrit une seule fois.
 *
 * Il s'écrivait à la main à chaque usage — `bg`, `color`, `minH`, `_hover` —
 * et cinquante-sept écritures ne donnent pas un bouton, elles en donnent une
 * dizaine : des hauteurs de 40, 44 et 48 px pour le même rôle, un bleu resté
 * sur la page des modèles. Ici le ton et la taille se choisissent, le reste
 * ne se discute plus.
 *
 * L'appui se sent : le bouton se tasse à 96 % puis revient avec un léger
 * dépassement. C'est la courbe du retour qui porte le rebond, pas une
 * animation — relâcher en cours de route ne laisse donc rien en plan. Le
 * mouvement se coupe quand l'appareil en demande moins.
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton({ tone = 'primary', size = 'lg', ...rest }, ref) {
    return (
      <Button
        ref={ref}
        h="auto"
        gap="9px"
        fontWeight="bold"
        lineHeight="1"
        whiteSpace="nowrap"
        transition="transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms"
        _active={{ transform: 'scale(0.96)', transitionDuration: '120ms' }}
        _motionReduce={{ transition: 'none', _active: { transform: 'none' } }}
        {...SIZES[size]}
        {...TONES[tone]}
        {...rest}
      />
    );
  }
);
