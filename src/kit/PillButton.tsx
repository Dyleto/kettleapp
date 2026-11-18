import { forwardRef } from 'react';
import { chakra, type HTMLChakraProps } from '@chakra-ui/react';
import { TOUCH } from './hitArea';

/** Ce que la pastille fait : un choix (`choice`, ambre une fois pressée),
 * une action secondaire (`outline`), ou une action qui retire (`danger`). */
type Tone = 'choice' | 'outline' | 'danger';

export interface PillButtonProps extends HTMLChakraProps<'button'> {
  tone?: Tone;
  /** Pour un choix : celui qui est retenu. Rendu en `aria-pressed`. */
  pressed?: boolean;
}

/**
 * Une pastille qu'on touche : « Reps », « Durée », « Fiche », « Retirer ».
 *
 * La pastille du kit (`Chip`) ne fait que dire ; celle-ci agit. Elles ont la
 * même forme parce que la maquette les aligne dans la même rangée — l'unité
 * choisie à côté de « + consigne » — mais pas le même rôle : un lecteur
 * d'écran doit entendre un bouton, et un choix doit dire s'il est retenu.
 *
 * 36 px de haut, 44 au tactile : une rangée de pastilles se touche au pouce.
 */
export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  function PillButton({ tone = 'choice', pressed, ...rest }, ref) {
    const on = tone === 'choice' && pressed;
    return (
      <chakra.button
        ref={ref}
        type="button"
        aria-pressed={tone === 'choice' ? !!pressed : undefined}
        display="inline-flex"
        alignItems="center"
        gap="6px"
        minH="36px"
        px="13px"
        borderRadius="full"
        fontSize="13.5px"
        fontWeight="600"
        lineHeight="1.2"
        whiteSpace="nowrap"
        bg={on ? 'app.primary' : 'transparent'}
        color={on ? 'bg.canvas' : tone === 'danger' ? 'app.error' : 'fg'}
        boxShadow={
          on
            ? undefined
            : tone === 'danger'
              ? 'inset 0 0 0 1.5px {colors.app.error/45}'
              : 'inset 0 0 0 1.5px {colors.line}'
        }
        _hover={{
          bg: on
            ? 'app.primary.hover'
            : tone === 'danger'
              ? 'app.error/12'
              : 'whiteAlpha.100',
        }}
        transition="background-color 150ms"
        css={{ [TOUCH]: { minHeight: '44px' } }}
        {...rest}
      />
    );
  }
);
