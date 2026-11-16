import { useLayoutEffect, useRef } from 'react';
import { Textarea } from '@chakra-ui/react';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof Textarea>;

/**
 * Un champ de texte qui grandit avec ce qu'on y écrit.
 *
 * Une note de coach fait deux lignes ou douze, et une barre de défilement
 * dans un champ de trois lignes oblige à faire défiler pour se relire — sur
 * un téléphone, à une main, c'est perdu d'avance. La hauteur se recalcule
 * donc à chaque frappe.
 *
 * `useLayoutEffect` et non `useEffect` : la mesure doit être posée avant que
 * le navigateur ne peigne, sinon la frappe fait sauter le champ d'une ligne
 * puis le remet.
 *
 * Remettre `height` à `auto` avant de lire `scrollHeight` n'est pas une
 * précaution : sans cela, `scrollHeight` reste bloqué à la hauteur déjà
 * posée, et le champ ne rétrécit jamais quand on efface.
 */
export const AutoResizeTextarea = ({ value, onChange, ...props }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      resize="none"
      overflow="hidden"
      {...props}
    />
  );
};
