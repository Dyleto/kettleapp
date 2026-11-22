import { useState } from 'react';
import { chakra, HStack, Portal, Text } from '@chakra-ui/react';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';

/** 80 caractères au plus : au-delà, le nom ne tient plus sur une carte. */
export const TEMPLATE_NAME_MAX = 80;

/**
 * Nommer un modèle : la feuille de « Nouveau » et celle de « Renommer ».
 *
 * La création se faisait dans un champ posé en permanence au-dessus de la
 * liste — un formulaire toujours ouvert pour un geste rare. La maquette le
 * range derrière « Nouveau », et le même champ sert à renommer.
 */
export const NameSheet = ({
  title,
  line,
  submitLabel,
  initial = '',
  pending,
  failed,
  onSubmit,
  onClose,
}: {
  title: string;
  line?: string;
  submitLabel: string;
  initial?: string;
  pending: boolean;
  /** Ce que dit un envoi raté : la feuille reste, le nom tapé aussi. */
  failed?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const [name, setName] = useState(initial);
  const trimmed = name.trim();
  const submit = () => {
    if (!trimmed || pending) return;
    onSubmit(trimmed);
  };
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <HStack
          minH="50px"
          px="16px"
          borderRadius="17px"
          bg="bg.raised"
          boxShadow="inset 0 0 0 1.5px {colors.line}"
          _focusWithin={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
        >
          <chakra.input
            aria-label="Nom du modèle"
            placeholder="Nom du modèle"
            value={name}
            maxLength={TEMPLATE_NAME_MAX}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            flex={1}
            minW={0}
            bg="transparent"
            border="none"
            outline="none"
            color="fg"
            fontSize="16px"
            _placeholder={{ color: 'fg.muted' }}
          />
        </HStack>
        {line && (
          <Text fontSize="sm" color="fg.muted">
            {line}
          </Text>
        )}
        {failed && (
          <Text role="alert" fontSize="sm" color="fg.muted">
            {failed}
          </Text>
        )}
        <ActionButton
          w="full"
          onClick={submit}
          disabled={!trimmed}
          loading={pending}
        >
          {submitLabel}
        </ActionButton>
      </Sheet>
    </Portal>
  );
};
