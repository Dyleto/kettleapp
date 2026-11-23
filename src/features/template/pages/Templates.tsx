import { useState } from 'react';
import {
  Container,
  Dialog,
  Grid,
  GridItem,
  HStack,
  Portal,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { COACH_GRID_MAX_W } from '@/features/coach';
import { COACH_ROUTES } from '@/shared/config/routes';
import { ActionButton, EmptyState, LoadFailure, SlowNotice } from '@/kit';
import { useTemplates } from '@/features/template/hooks/useTemplates';
import { isUnavailable } from '@/shared/utils/queryState';
import {
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useRenameTemplate,
} from '@/features/template/hooks/useTemplateMutations';
import { TemplateCard } from '@/features/template/components/TemplateCard';
import { NameSheet } from '@/features/template/components/NameSheet';
import { UseTemplateSheet } from '@/features/template/components/UseTemplateSheet';
import type { TemplateRow } from '@/shared/types';

/**
 * La bibliothèque de programmes préfaits du coach.
 *
 * Un modèle ne sert qu'à démarrer : on l'importe chez un client, où il
 * devient un programme ordinaire que le coach modifie comme il veut. Rien ne
 * relie ensuite les deux — corriger un modèle ne touche aucun programme déjà
 * importé, et c'est ce qui le rend sans danger.
 *
 * Des cartes qui montrent le contenu, sur une, deux ou trois colonnes selon
 * la largeur ; « Nouveau » demande un nom puis ouvre l'atelier sur le modèle
 * créé : on le nomme pour le composer, pas pour le voir apparaître dans une
 * liste.
 */
const Templates = () => {
  useDocumentTitle('Modèles');
  const navigate = useNavigate();
  const templatesQuery = useTemplates();
  const { data: templates = [], isLoading } = templatesQuery;
  const isDown = isUnavailable(templatesQuery);
  const create = useCreateTemplate();
  const rename = useRenameTemplate();
  const duplicate = useDuplicateTemplate();
  const { mutate: remove } = useDeleteTemplate();
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<TemplateRow | null>(null);
  const [using, setUsing] = useState<TemplateRow | null>(null);
  /**
   * Le modèle dont on demande la suppression.
   *
   * Une question et non le filet d'annulation des autres suppressions, et
   * c'est la seule exception de l'atelier : le filet remet un état local que
   * l'enregistrement renvoie, or un modèle supprimé n'existe plus côté
   * serveur. Le remettre demanderait de le recréer sous un autre
   * identifiant — ce ne serait plus annuler, ce serait refaire.
   */
  const [pendingDeletion, setPendingDeletion] = useState<TemplateRow | null>(
    null
  );
  const openTemplate = (template: { _id: string }) =>
    navigate(COACH_ROUTES.templateSession(template._id, 1));

  return (
    <Container maxW={COACH_GRID_MAX_W} py={{ base: 6, md: 8 }} px={4}>
      <VStack align="stretch" gap="16px">
        <HStack gap="12px" align="center">
          {/* Le nom de l'onglet, et un vrai titre : l'écran s'appelait
              « Modèles de programme » sous un onglet « Modèles », dans un
              simple paragraphe — il n'avait donc aucun nom pour un lecteur
              d'écran. */}
          <Text
            as="h1"
            fontWeight="800"
            fontSize={{ base: '26px', md: '32px' }}
            lineHeight="1.05"
          >
            Modèles
          </Text>
          {templates.length > 0 && (
            <Text color="fg.muted" data-template-count>
              {templates.length} modèle{templates.length > 1 ? 's' : ''}
            </Text>
          )}
          {/* Ambre, comme toute action principale : il était bleu, seul de
              son espèce, la palette par défaut que personne n'avait
              choisie. */}
          <ActionButton ml="auto" size="sm" onClick={() => setCreating(true)}>
            <LuPlus size={16} />
            <span>
              Nouveau
              <Text as="span" display={{ base: 'none', md: 'inline' }}>
                {' modèle'}
              </Text>
            </span>
          </ActionButton>
        </HStack>

        {isLoading && (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            }}
            gap="16px"
            aria-busy="true"
            aria-label="Chargement de tes modèles"
          >
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} h="200px" borderRadius="card" />
            ))}
            <GridItem colSpan={999}>
              <SlowNotice />
            </GridItem>
          </Grid>
        )}

        {isDown && (
          <LoadFailure
            query={templatesQuery}
            line="Tes modèles n'ont pas bougé. Vérifie ta connexion, puis réessaie."
          />
        )}

        {/* L'état vide dit à quoi sert un modèle, et propose de le faire :
            c'est le premier écran de la fonctionnalité. */}
        {!isLoading && !isDown && templates.length === 0 && (
          <EmptyState
            mood="hello"
            title="Écris-le une fois"
            line="Un modèle est un programme tout fait. Tu l'importes chez un client, puis tu l'ajustes pour lui : le modèle, lui, ne bouge pas."
            action={
              <VStack gap="8px">
                <ActionButton size="md" onClick={() => setCreating(true)}>
                  <LuPlus size={18} />
                  Créer un modèle
                </ActionButton>
                <Text fontSize="sm" color="fg.muted" textAlign="center">
                  ou « Enregistrer comme modèle » depuis le programme d’un
                  client
                </Text>
              </VStack>
            }
          />
        )}

        {templates.length > 0 && (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            }}
            gap="16px"
            alignItems="stretch"
            data-template-grid
          >
            {templates.map((template) => (
              <TemplateCard
                key={template._id}
                template={template}
                onOpen={() => openTemplate(template)}
                onUse={() => setUsing(template)}
                onRename={() => setRenaming(template)}
                onDuplicate={() => duplicate.mutate(template._id)}
                onDelete={() => setPendingDeletion(template)}
              />
            ))}
          </Grid>
        )}
      </VStack>

      {creating && (
        <NameSheet
          title="Nouveau modèle"
          line="Tu composeras ses séances juste après, dans l’atelier."
          submitLabel="Créer et composer"
          pending={create.isPending}
          failed={
            create.isError
              ? 'Le modèle n’a pas pu être créé. Réessaie.'
              : undefined
          }
          onClose={() => setCreating(false)}
          onSubmit={(name) => create.mutate(name, { onSuccess: openTemplate })}
        />
      )}
      {using && (
        <UseTemplateSheet template={using} onClose={() => setUsing(null)} />
      )}
      {renaming && (
        <NameSheet
          title="Renommer le modèle"
          submitLabel="Renommer"
          initial={renaming.name}
          pending={rename.isPending}
          onClose={() => setRenaming(null)}
          onSubmit={(name) =>
            rename.mutate(
              { id: renaming._id, name },
              { onSuccess: () => setRenaming(null) }
            )
          }
        />
      )}

      <Dialog.Root
        role="alertdialog"
        open={!!pendingDeletion}
        onOpenChange={(e) => !e.open && setPendingDeletion(null)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="bg.surface">
              <Dialog.Body pt={6}>
                <Text fontWeight="bold">
                  Supprimer «&nbsp;{pendingDeletion?.name}&nbsp;» ?
                </Text>
                <Text fontSize="sm" color="fg.muted" mt={2}>
                  Les programmes déjà importés chez tes clients ne sont pas
                  touchés : un modèle ne sert que de base de copie.
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <ActionButton
                  tone="ghost"
                  size="sm"
                  onClick={() => setPendingDeletion(null)}
                >
                  Annuler
                </ActionButton>
                <ActionButton
                  tone="danger"
                  size="sm"
                  onClick={() => {
                    if (pendingDeletion) remove(pendingDeletion._id);
                    setPendingDeletion(null);
                  }}
                >
                  <LuTrash2 size={14} /> Supprimer
                </ActionButton>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Container>
  );
};

export default Templates;
