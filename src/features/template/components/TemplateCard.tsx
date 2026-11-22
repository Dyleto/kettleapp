import { chakra, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCopy, LuPencil, LuTrash2 } from 'react-icons/lu';
import type { BlockType, TemplateRow } from '@/shared/types';
import { ActionButton, Composition } from '@/kit';
import { SessionMenu } from '@/features/coach';
import {
  moreSessions,
  previewLabel,
  templateMeta,
} from '@/domain/template/card';

/**
 * La carte d'un modèle : son nom, ses repères, ses premières séances avec
 * leur barre de composition, et ce qu'on en fait.
 *
 * La liste d'avant ne montrait qu'un nom et un nombre de séances : deux
 * modèles de trois séances ne se distinguaient que par leur titre. La carte
 * montre de quoi chacun est fait — l'échauffement, l'EMOM, l'AMRAP — d'un
 * coup d'œil, comme les cartes du programme d'un client.
 *
 * Le menu (renommer, dupliquer, supprimer) reprend celui d'une séance de
 * l'atelier : un seul composant pour « ce qu'on fait d'une chose sans
 * l'ouvrir ».
 */
export const TemplateCard = ({
  template,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  template: TemplateRow;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  const more = moreSessions(template);
  return (
    <VStack
      align="stretch"
      gap="10px"
      bg="surface.card"
      borderRadius="card"
      p="18px"
      data-template-card={template._id}
    >
      <HStack align="start" gap="8px">
        <chakra.button
          type="button"
          onClick={onOpen}
          flex={1}
          minW={0}
          textAlign="left"
          aria-label={`Ouvrir le modèle ${template.name}`}
        >
          <Text as="h2" fontWeight="800" fontSize="18px" lineClamp={2}>
            {template.name}
          </Text>
        </chakra.button>
        <SessionMenu
          label={`Menu du modèle ${template.name}`}
          actions={[
            {
              value: 'rename',
              label: 'Renommer',
              icon: <LuPencil size={16} />,
              onSelect: onRename,
            },
            {
              value: 'duplicate',
              label: 'Dupliquer',
              icon: <LuCopy size={16} />,
              onSelect: onDuplicate,
            },
            {
              value: 'delete',
              label: 'Supprimer',
              icon: <LuTrash2 size={16} />,
              danger: true,
              onSelect: onDelete,
            },
          ]}
        />
      </HStack>
      <Text fontSize="sm" color="fg.muted" data-template-meta>
        {templateMeta(template)}
      </Text>
      {template.preview.length > 0 && (
        <VStack align="stretch" gap="6px" data-template-preview>
          {template.preview.map((session) => (
            <HStack key={session._id} gap="10px" data-preview-session>
              <Text fontSize="sm" w="120px" flexShrink={0} truncate>
                {previewLabel(session)}
              </Text>
              <chakra.div flex={1} minW={0}>
                <Composition
                  blocks={session.blockTypes.map((type, index) => ({
                    _id: `${session._id}-${index}`,
                    type: type as BlockType,
                  }))}
                />
              </chakra.div>
            </HStack>
          ))}
          {more && (
            <Text fontSize="sm" color="fg.muted">
              {more}
            </Text>
          )}
        </VStack>
      )}
      <HStack gap="8px" mt="auto" pt="4px">
        <ActionButton tone="ghost" size="sm" onClick={onOpen}>
          Modifier
        </ActionButton>
      </HStack>
    </VStack>
  );
};
