import { useState } from 'react';
import {
  chakra,
  Dialog,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { TemplateRow } from '@/shared/types';
import { ActionButton, hitArea } from '@/kit';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';
import { ReplaceOutcome, useTemplates } from '@/features/template';

/** « 3 séances », « 1 séance ». */
const sessions = (count: number) => `${count} séance${count > 1 ? 's' : ''}`;

interface ImportTemplateDialogProps {
  /** « Sarah » ; sans prénom, « ton client ». */
  clientFirstName?: string;
  /** Combien de séances le programme porte aujourd'hui : rien à remplacer,
   * pas de question. */
  currentCount: number;
  onImport: (template: TemplateRow) => Promise<void>;
  onClose: () => void;
}

/**
 * Importer un modèle chez un client : le choisir, puis dire ce qui part et
 * ce qui reste.
 *
 * L'import remplace tout le programme. C'est le seul geste de l'atelier qui
 * pose une question avant d'agir, et c'est voulu : partout ailleurs une
 * bannière « Annuler » rattrape un geste, mais celui-ci emporte d'un coup
 * toutes les séances du client — la question reçoit trois réponses
 * écrites, pas un « Êtes-vous sûr ? ». Un programme vide n'a rien à perdre :
 * le choix suffit.
 *
 * Ce qui reste est dit aussi : l'historique et les charges du client ne
 * vivent pas dans le programme, et c'est ce qu'un coach craint de perdre.
 */
export const ImportTemplateDialog = ({
  clientFirstName,
  currentCount,
  onImport,
  onClose,
}: ImportTemplateDialogProps) => {
  const who = clientFirstName ?? 'ton client';
  const { data: templates = [], isLoading } = useTemplates();
  const [chosen, setChosen] = useState<TemplateRow | null>(null);
  const [busy, setBusy] = useState(false);
  useBackDismiss(true, onClose);

  const run = async (template: TemplateRow) => {
    setBusy(true);
    try {
      await onImport(template);
    } finally {
      setBusy(false);
    }
  };

  const pick = (template: TemplateRow) => {
    if (busy) return;
    if (currentCount === 0) void run(template);
    else setChosen(template);
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(e) => !e.open && !busy && onClose()}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.canvas"
            borderColor="whiteAlpha.100"
            borderWidth="1px"
            maxW="520px"
            mx={4}
          >
            {chosen ? (
              <>
                <Dialog.Header>
                  <Dialog.Title>Remplacer le programme de {who} ?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <VStack align="stretch" gap="14px">
                    <Text color="fg.muted">
                      Le modèle « {chosen.name} » va prendre la place de ce que{' '}
                      {who} a aujourd’hui.
                    </Text>
                    <ReplaceOutcome
                      currentCount={currentCount}
                      incomingCount={chosen.sessionCount}
                    />
                    <Text fontSize="sm" color="fg.muted">
                      Tu pourras ensuite modifier ce programme comme tu veux :
                      le modèle, lui, ne bouge pas.
                    </Text>
                  </VStack>
                </Dialog.Body>
                <Dialog.Footer gap="10px">
                  <ActionButton
                    tone="ghost"
                    size="md"
                    disabled={busy}
                    onClick={() => setChosen(null)}
                  >
                    Annuler
                  </ActionButton>
                  <ActionButton
                    size="md"
                    loading={busy}
                    onClick={() => void run(chosen)}
                  >
                    Remplacer le programme
                  </ActionButton>
                </Dialog.Footer>
              </>
            ) : (
              <>
                <Dialog.Header>
                  <VStack align="start" gap={1}>
                    <Dialog.Title>Importer un modèle</Dialog.Title>
                    <Text fontSize="sm" color="fg.muted" fontWeight="normal">
                      {currentCount > 0
                        ? `Il prend la place du programme de ${who}.`
                        : `Ses séances deviennent le programme de ${who}.`}
                    </Text>
                  </VStack>
                </Dialog.Header>
                <Dialog.Body pb={5}>
                  {isLoading ? (
                    <HStack justify="center" py={6}>
                      <Spinner size="sm" color="app.primary" />
                    </HStack>
                  ) : templates.length === 0 ? (
                    <Text fontSize="sm" color="fg.muted">
                      Tu n’as pas encore de modèle. Enregistre une séance comme
                      modèle depuis son menu, ou crée-en un dans Modèles.
                    </Text>
                  ) : (
                    <VStack align="stretch" gap={0}>
                      {templates.map((template) => (
                        <chakra.button
                          key={template._id}
                          type="button"
                          textAlign="left"
                          minH="52px"
                          px={2}
                          borderRadius="md"
                          aria-disabled={busy}
                          _hover={busy ? undefined : { bg: 'whiteAlpha.100' }}
                          css={hitArea(44)}
                          onClick={() => pick(template)}
                        >
                          <HStack gap={3}>
                            <VStack align="start" gap={0} flex={1} minW={0}>
                              <Text fontWeight="600" lineClamp={1}>
                                {template.name}
                              </Text>
                              <Text fontSize="sm" color="fg.muted">
                                {sessions(template.sessionCount)}
                                {template.usageCount > 0 &&
                                  ` · déjà importé ${template.usageCount} fois`}
                              </Text>
                            </VStack>
                            {busy && <Spinner size="xs" color="app.primary" />}
                          </HStack>
                        </chakra.button>
                      ))}
                    </VStack>
                  )}
                </Dialog.Body>
              </>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
