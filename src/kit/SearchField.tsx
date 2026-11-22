import { useRef } from 'react';
import { Box, chakra, HStack } from '@chakra-ui/react';
import { LuSearch, LuX } from 'react-icons/lu';
import { hitArea } from './hitArea';

/**
 * Le champ de recherche d'une liste, à la forme des champs de la maquette :
 * un contour qui passe à l'ambre quand on y écrit, la croix pour vider,
 * Échap aussi.
 *
 * Né dans la liste des clients (F4a), il sert aussi la feuille « Utiliser
 * pour un client » et la bibliothèque d'exercices : trois listes, un seul
 * champ. La règle de ce qu'il garde n'est pas ici — chaque liste a la
 * sienne, dans son domaine.
 *
 * `onEnter` est ce qu'Entrée fait : créer, dans la bibliothèque, ce qu'on
 * vient de taper.
 */
export const SearchField = ({
  value,
  onChange,
  label,
  placeholder = label,
  onEnter,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Le nom du champ pour un lecteur d'écran. */
  label: string;
  placeholder?: string;
  onEnter?: () => void;
}) => {
  const input = useRef<HTMLInputElement>(null);
  return (
    <HStack
      flex={1}
      minW={0}
      gap="10px"
      minH="50px"
      px="16px"
      borderRadius="17px"
      bg="surface.card"
      boxShadow="inset 0 0 0 1.5px {colors.line}"
      _focusWithin={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
      color="fg.muted"
      onClick={() => input.current?.focus()}
    >
      <LuSearch size={18} aria-hidden />
      <chakra.input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            onChange('');
          } else if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        flex={1}
        minW={0}
        bg="transparent"
        border="none"
        outline="none"
        color="fg"
        fontSize="15.5px"
        _placeholder={{ color: 'fg.muted' }}
        css={{ '&::-webkit-search-cancel-button': { display: 'none' } }}
      />
      {value && (
        <Box
          as="button"
          aria-label="Effacer la recherche"
          color="fg.muted"
          _hover={{ color: 'fg' }}
          onClick={() => onChange('')}
          css={hitArea(44)}
        >
          <LuX size={18} />
        </Box>
      )}
    </HStack>
  );
};
