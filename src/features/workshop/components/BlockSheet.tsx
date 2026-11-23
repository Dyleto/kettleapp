import { useState } from 'react';
import { Box, chakra, HStack, Portal, Text } from '@chakra-ui/react';
import type { BlockType, SessionBlock } from '@/shared/types';
import { formatName } from '@/domain/session/dose';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/shared/hooks/useSheetDismiss';
import { BlockSettings } from './BlockSettings';
import { FormatPalette } from './FormatPalette';
import { InlineText } from './InlineValue';

interface BlockSheetProps {
  block: SessionBlock;
  onUpdate: (updates: Partial<SessionBlock>) => void;
  onChangeFormat: (type: BlockType) => void;
  onDuplicate: () => void;
  /** Un cran plus haut, un cran plus bas : absents au bout de la séance. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Un champ facultatif de la feuille, dans une case : sur téléphone, une
 * invitation sans cadre ne se voyait pas comme un champ. */
const Field = ({ children }: { children: React.ReactNode }) => (
  <Box bg="bg.raised" borderRadius="16px" px="16px" py="10px" fontSize="sm">
    {children}
  </Box>
);

/**
 * Les réglages d'un bloc sur téléphone : une feuille basse, ouverte en
 * touchant son en-tête.
 *
 * Les pastilles de l'en-tête ne s'y touchent pas une à une : à 26 px de
 * haut, côte à côte, c'était viser. La feuille rassemble tout ce que le
 * « ⋯ » et les pastilles offrent sur grand écran — réglages, nom, consigne,
 * format, copie, suppression — en grand, sous le pouce.
 */
export const BlockSheet = ({
  block,
  onUpdate,
  onChangeFormat,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onRemove,
  onClose,
}: BlockSheetProps) => {
  const [picking, setPicking] = useState(false);
  const label = formatName(block.type);
  useSheetDismiss(true, onClose);

  return (
    <Portal>
      <Sheet label={`Régler le bloc ${label}`} onDismiss={onClose}>
        <HStack gap="8px">
          <Text as="h2" fontWeight="800" fontSize="20px">
            {label}
          </Text>
          <chakra.button
            type="button"
            ml="auto"
            minH="44px"
            fontSize="sm"
            fontWeight="600"
            color="fg.muted"
            onClick={() => setPicking((v) => !v)}
          >
            {picking ? 'Garder ce format' : 'Changer de format'}
          </chakra.button>
        </HStack>

        {picking ? (
          <FormatPalette
            layout="sheet"
            title=""
            onSelect={(type) => {
              setPicking(false);
              if (type !== block.type) onChangeFormat(type);
            }}
          />
        ) : (
          <>
            <BlockSettings block={block} onUpdate={onUpdate} layout="sheet" />
            <Field>
              <InlineText
                value={block.label}
                onChange={(value) => onUpdate({ label: value })}
                addLabel="+ nom du bloc"
                ariaLabel={`Nom personnalisé du bloc ${label}`}
                fontSize="sm"
              />
            </Field>
            <Field>
              <InlineText
                value={block.notes}
                onChange={(value) => onUpdate({ notes: value })}
                addLabel="+ consigne du bloc"
                ariaLabel={`Consigne du bloc ${label}`}
                fontSize="sm"
                multiline
              />
            </Field>
            {/* Sur téléphone, l'appui long déplace déjà : ces deux-là sont
                pour qui ne glisse pas. La feuille reste ouverte, sur le
                bloc qu'on vient de déplacer. */}
            {(onMoveUp || onMoveDown) && (
              <HStack gap="10px">
                {onMoveUp && (
                  <ActionButton
                    tone="ghost"
                    size="md"
                    flex={1}
                    aria-label={`Monter le bloc ${label}`}
                    onClick={onMoveUp}
                  >
                    Monter
                  </ActionButton>
                )}
                {onMoveDown && (
                  <ActionButton
                    tone="ghost"
                    size="md"
                    flex={1}
                    aria-label={`Descendre le bloc ${label}`}
                    onClick={onMoveDown}
                  >
                    Descendre
                  </ActionButton>
                )}
              </HStack>
            )}
            <HStack gap="10px">
              <ActionButton
                tone="ghost"
                size="md"
                flex={1}
                aria-label={`Dupliquer le bloc ${label}`}
                onClick={() => {
                  onClose();
                  onDuplicate();
                }}
              >
                Dupliquer
              </ActionButton>
              <ActionButton
                tone="danger"
                size="md"
                flex={1}
                aria-label={`Supprimer le bloc ${label}`}
                onClick={() => {
                  onClose();
                  onRemove();
                }}
              >
                Supprimer
              </ActionButton>
            </HStack>
            <ActionButton size="md" w="full" onClick={onClose}>
              C’est bon
            </ActionButton>
          </>
        )}
      </Sheet>
    </Portal>
  );
};
