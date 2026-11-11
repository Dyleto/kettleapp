import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  HStack,
  Input,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { COACH_CONTENT_MAX_W } from '@/features/coach';
import { COACH_ROUTES } from '@/shared/config/routes';
import { touchHitArea } from '@/shared/components/hitArea';
import { useTemplates } from '@/features/template/hooks/useTemplates';
import {
  useCreateTemplate,
  useDeleteTemplate,
} from '@/features/template/hooks/useTemplateMutations';
import type { TemplateRow } from '@/shared/types';

/** « 3 séances », et « 1 séance » au singulier. */
const sessionCount = (count: number) =>
  `${count} séance${count > 1 ? 's' : ''}`;

/**
 * La bibliothèque de programmes préfaits du coach.
 *
 * Un modèle ne sert qu'à démarrer : on l'importe chez un client, où il
 * devient un programme ordinaire que le coach modifie comme il veut. Rien ne
 * relie ensuite les deux — corriger un modèle ne touche aucun programme déjà
 * importé, et c'est ce qui le rend sans danger.
 *
 * On crée en tapant un nom, comme un exercice dans la bibliothèque : un
 * modèle vide n'a rien à régler avant d'exister, et son contenu se compose
 * dans l'atelier.
 */
const Templates = () => {
  useDocumentTitle('Modèles de programme');
  const navigate = useNavigate();
  const { data: templates = [], isLoading } = useTemplates();
  const { mutate: create, isPending: isCreating } = useCreateTemplate();
  const { mutate: remove } = useDeleteTemplate();

  const [name, setName] = useState('');
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

  const trimmed = name.trim();

  const submit = () => {
    if (!trimmed || isCreating) return;
    create(trimmed, {
      onSuccess: (template) => {
        setName('');
        // On ouvre le modèle créé : on le nomme pour le composer, pas pour
        // le voir apparaître dans une liste.
        navigate(COACH_ROUTES.templateSession(template._id, 1));
      },
    });
  };

  return (
    <Container maxW={COACH_CONTENT_MAX_W} py={6}>
      <VStack align="stretch" gap={5}>
        <Box>
          <Text fontSize="lg" fontWeight="bold">
            Modèles de programme
          </Text>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            Des programmes préfaits, à importer chez un client pour lui servir
            de base. Les modifier ensuite chez le client ne touche pas le
            modèle.
          </Text>
        </Box>

        <HStack gap={2}>
          <Input
            aria-label="Nom du nouveau modèle"
            placeholder="Nommer un nouveau modèle…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button
            onClick={submit}
            disabled={!trimmed || isCreating}
            colorPalette="blue"
            flexShrink={0}
          >
            <LuPlus size={14} /> Créer
          </Button>
        </HStack>

        {isLoading && (
          <Text fontSize="sm" color="fg.muted">
            Chargement…
          </Text>
        )}

        {!isLoading && templates.length === 0 && (
          <Text fontSize="sm" color="fg.muted">
            Aucun modèle pour l’instant. Nomme-en un pour commencer.
          </Text>
        )}

        <VStack align="stretch" gap={1}>
          {templates.map((template) => (
            <HStack
              key={template._id}
              gap={2}
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              borderRadius="md"
              px={3}
              py={2}
            >
              <Box
                as="button"
                aria-label={`Ouvrir le modèle ${template.name}`}
                onClick={() =>
                  navigate(COACH_ROUTES.templateSession(template._id, 1))
                }
                textAlign="left"
                flex={1}
                minW={0}
                css={touchHitArea}
              >
                <Text fontSize="sm" fontWeight="bold" lineClamp={1}>
                  {template.name}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {sessionCount(template.sessionCount)}
                </Text>
              </Box>
              <Box
                as="button"
                aria-label={`Supprimer le modèle ${template.name}`}
                onClick={() => setPendingDeletion(template)}
                color="fg.muted"
                _hover={{ color: 'app.error' }}
                px={2}
                css={touchHitArea}
              >
                <LuTrash2 size={14} />
              </Box>
            </HStack>
          ))}
        </VStack>
      </VStack>

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
                <Button
                  variant="ghost"
                  onClick={() => setPendingDeletion(null)}
                >
                  Annuler
                </Button>
                <Button
                  colorPalette="red"
                  onClick={() => {
                    if (pendingDeletion) remove(pendingDeletion._id);
                    setPendingDeletion(null);
                  }}
                >
                  <LuTrash2 size={14} /> Supprimer
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Container>
  );
};

export default Templates;
