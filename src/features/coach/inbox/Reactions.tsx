import { chakra, HStack } from '@chakra-ui/react';
import { REACTIONS, type Reaction } from '@/domain/inbox/reply';

/**
 * Réagir d'une touche.
 *
 * Des boutons pressés : la réaction allumée se lit `aria-pressed`, et la
 * toucher de nouveau l'éteint — « Toucher de nouveau la retire ».
 */
export const Reactions = ({
  active,
  onPick,
  disabled = false,
}: {
  active: Reaction | undefined;
  onPick: (reaction: Reaction) => void;
  disabled?: boolean;
}) => (
  <HStack gap="6px">
    {REACTIONS.map(({ key, emoji, name }) => (
      <chakra.button
        key={key}
        type="button"
        aria-label={`Réagir : ${name}`}
        aria-pressed={active === key}
        disabled={disabled}
        onClick={() => onPick(key)}
        minW="44px"
        minH="40px"
        px="10px"
        borderRadius="full"
        fontSize="17px"
        lineHeight={1}
        bg={active === key ? 'app.primary.bg' : 'bg.surface'}
        boxShadow={
          active === key ? 'inset 0 0 0 1.5px {colors.app.primary}' : undefined
        }
        _disabled={{ opacity: 0.5 }}
      >
        {emoji}
      </chakra.button>
    ))}
  </HStack>
);
