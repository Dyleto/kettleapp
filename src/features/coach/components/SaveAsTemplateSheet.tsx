import { useState } from 'react';
import { HStack, Input, Portal, Text } from '@chakra-ui/react';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';

interface SaveAsTemplateSheetProps {
  /** Le nom proposé : celui de la séance. */
  defaultName: string;
  /** « Le programme de Sarah ne bouge pas » ; sans prénom, « du client ». */
  clientFirstName?: string;
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

/**
 * Enregistrer une séance comme modèle : un nom, et c'est tout.
 *
 * Le nom de la séance est proposé, sélectionné : le garder coûte une touche,
 * le changer aussi. La phrase dit ce qui ne bouge pas — le programme du
 * client —, parce que « enregistrer » depuis son programme fait craindre de
 * le déplacer.
 */
export const SaveAsTemplateSheet = ({
  defaultName,
  clientFirstName,
  saving,
  onSave,
  onClose,
}: SaveAsTemplateSheetProps) => {
  const [name, setName] = useState(defaultName);
  useSheetDismiss(true, onClose);
  const trimmed = name.trim();
  const save = () => trimmed && !saving && onSave(trimmed);

  return (
    <Portal>
      <Sheet label="Enregistrer comme modèle" onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="20px">
          Enregistrer comme modèle
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Une copie de cette séance, dans tes modèles. Le programme{' '}
          {clientFirstName ? `de ${clientFirstName}` : 'du client'} ne bouge
          pas.
        </Text>
        <Input
          autoFocus
          aria-label="Nom du modèle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save();
            }
          }}
          size="lg"
        />
        <HStack gap="10px">
          <ActionButton tone="ghost" size="md" flex={1} onClick={onClose}>
            Annuler
          </ActionButton>
          <ActionButton
            size="md"
            flex={2}
            disabled={!trimmed || saving}
            onClick={save}
          >
            Enregistrer le modèle
          </ActionButton>
        </HStack>
      </Sheet>
    </Portal>
  );
};
