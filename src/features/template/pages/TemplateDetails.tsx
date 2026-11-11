import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useProgramWorkshop } from '@/features/program/hooks/useProgramWorkshop';
import { InlineText } from '@/features/program/components/InlineValue';
import { ClientProgramTab } from '@/features/coach/components/ClientProgramTab';
import { SessionRail } from '@/features/coach/components/SessionRail';
import { ProgramSaveStatus } from '@/features/program/components/ProgramSaveStatus';
import { BackLink } from '@/shared/components/BackLink';
import { EmptyState } from '@/shared/components/EmptyState';
import { COACH_ROUTES } from '@/shared/config/routes';
import { useTemplate } from '@/features/template/hooks/useTemplates';
import {
  useRenameTemplate,
  useUpdateTemplateSessions,
} from '@/features/template/hooks/useTemplateMutations';
import type { Session, Template } from '@/shared/types';

/**
 * Le même délai que l'enregistrement d'une valeur du programme.
 *
 * Le nom s'enregistre à la frappe comme tout le reste de l'atelier, mais pas
 * une requête par caractère : « Prise de masse » en aurait demandé quinze.
 */
const RENAME_DELAY = 800;

/**
 * Le nom du modèle, édité là où il se lit.
 *
 * Il garde son propre brouillon parce que `InlineText` est entièrement
 * contrôlé : avec un envoi différé et sans brouillon, le champ serait resté
 * figé sur l'ancien nom pendant que le coach tape.
 *
 * Monté avec le modèle pour clé, donc remonté quand on change de modèle :
 * c'est ce qui évite l'effet de synchronisation qui recopie une propriété
 * dans un état — celui-là écraserait la frappe en cours à chaque relecture
 * d'arrière-plan.
 */
const TemplateName = ({ template }: { template: Template }) => {
  const { mutate: rename } = useRenameTemplate();
  const [draft, setDraft] = useState(template.name);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Ce qui reste à envoyer, lisible par le démontage sans le redéclencher. */
  const pending = useRef<string | null>(null);

  const send = useCallback(() => {
    const name = pending.current;
    pending.current = null;
    if (name) rename({ id: template._id, name });
  }, [rename, template._id]);

  // Quitter la page n'est pas renoncer : un nom tapé puis quitté dans la
  // seconde partait avec le minuteur. Même parti pris que l'enregistrement
  // automatique du programme.
  useEffect(() => {
    const flush = send;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      flush();
    };
  }, [send]);

  const change = (value?: string) => {
    setDraft(value ?? '');
    // Un modèle sans nom ne serait plus repérable dans la liste, et le
    // serveur le refuse : on laisse le champ vide le temps de retaper, sans
    // rien envoyer.
    const trimmed = (value ?? '').trim();
    pending.current = trimmed || null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(send, RENAME_DELAY);
  };

  return (
    <InlineText
      value={draft}
      onChange={change}
      addLabel="+ nom"
      ariaLabel="Nom du modèle"
      fontSize="lg"
      width="320px"
    />
  );
};

/**
 * L'atelier d'un modèle de programme.
 *
 * Le même que celui d'un client, au mot près : `useProgramWorkshop` porte
 * l'état, l'enregistrement et les huit gestes avec leurs filets. Ne reste ici
 * que ce qui diffère — d'où vient le programme, où il s'enregistre, et qu'il
 * n'y a personne pour l'avoir fait.
 *
 * Ce qu'un modèle n'a pas, et c'est voulu : pas de ressenti, pas de journal,
 * pas de compteur « faite 4 fois », pas de « copier vers un client ». Ces
 * quatre choses parlent d'un client, et un modèle n'en a aucun.
 */
const TemplateDetails = () => {
  const { templateId, sessionIndex } = useParams();
  const navigate = useNavigate();

  const { data: template, isLoading } = useTemplate(templateId);
  useDocumentTitle(template?.name);

  const { mutateAsync } = useUpdateTemplateSessions(templateId!);

  /**
   * Le serveur renvoie le modèle entier ; l'atelier n'attend que ses séances.
   *
   * On passe par le modèle complet plutôt que de ne demander que les séances :
   * c'est lui que le cache porte, et le renvoyer entier évite une relecture
   * pour rafraîchir un nom qui n'a pas bougé.
   */
  const save = useCallback(
    (sessions: Session[]) =>
      mutateAsync(sessions).then((saved) => saved.sessions),
    [mutateAsync]
  );

  const goToSession = useCallback(
    (index: number) =>
      navigate(COACH_ROUTES.templateSession(templateId!, index)),
    [navigate, templateId]
  );

  const {
    program,
    actions,
    activeSession,
    currentIndex,
    workshopProps,
    addSession,
    removeSession,
    saveState,
    savedAt,
    flush,
  } = useProgramWorkshop({
    serverProgram: template,
    save,
    sessionIndex,
    goToSession,
  });

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="60vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!template || !program) return null;

  const sessions = program.sessions;

  return (
    <Box
      w="100%"
      px={{ base: 4, md: 8 }}
      pt={{ base: 4, md: 6 }}
      pb={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 86px)', md: 6 }}
    >
      <VStack align="stretch" gap={1} mb={5}>
        <BackLink
          label="Modèles"
          onClick={() => navigate(COACH_ROUTES.templates)}
        />
        <HStack gap={2} align="baseline" wrap="wrap" className="group">
          <Heading as="h1" size="lg" fontWeight="bold" flexShrink={0}>
            Modèle
          </Heading>
          <TemplateName key={template._id} template={template} />
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          {sessions.length} séance{sessions.length > 1 ? 's' : ''} · s'importe
          chez un client depuis sa fiche
        </Text>
      </VStack>

      {/* Même seuil que l'atelier d'un client : le rail devient une colonne à
          `lg`, pas à `md`. */}
      <Stack
        direction={{ base: 'column', lg: 'row' }}
        align={{ base: 'stretch', lg: 'flex-start' }}
        gap={{ base: 4, lg: 6 }}
      >
        <SessionRail
          sessions={sessions}
          activeIndex={currentIndex}
          onSelect={(index) => goToSession(index + 1)}
          onAddSession={addSession}
          onReorder={actions.reorderSessions}
          onRequestDelete={removeSession}
        />

        <Box flex="1 1 auto" minW={0} maxW={{ base: 'none', md: '980px' }}>
          {/* Les deux vont toujours ensemble, mais TypeScript ne relie pas
              deux valeurs rendues par le même hook. */}
          {activeSession && workshopProps ? (
            <>
              <HStack
                justify="flex-start"
                align="baseline"
                gap={2}
                rowGap={1}
                wrap="wrap"
                mb={3}
                className="group"
              >
                <Heading as="h2" size="md" flexShrink={0}>
                  Séance {activeSession.order}
                </Heading>
                <InlineText
                  value={activeSession.name}
                  onChange={(name) =>
                    actions.updateSessionName(activeSession._id, name)
                  }
                  addLabel="+ nom"
                  ariaLabel={`Nom de la séance ${activeSession.order}`}
                  fontSize="sm"
                  width="220px"
                />
              </HStack>

              <ClientProgramTab key={activeSession._id} {...workshopProps} />
            </>
          ) : sessions.length === 0 ? (
            <EmptyState
              title="Ce modèle est vide"
              line="Ajoutez une séance pour commencer à le composer."
              action={
                <Button
                  bg="app.primary"
                  color="bg.canvas"
                  fontWeight="bold"
                  minH="44px"
                  onClick={addSession}
                  _hover={{ bg: 'app.primary.hover' }}
                >
                  Ajouter une séance
                </Button>
              }
            />
          ) : (
            <EmptyState
              title={`La séance ${currentIndex + 1} n'existe pas`}
              line={`Ce modèle en compte ${sessions.length}. Elle a peut-être été supprimée, ou l'adresse a vieilli.`}
              action={
                <Button
                  bg="app.primary"
                  color="bg.canvas"
                  fontWeight="bold"
                  minH="44px"
                  onClick={() => goToSession(1)}
                  _hover={{ bg: 'app.primary.hover' }}
                >
                  Aller à la séance 1
                </Button>
              }
            />
          )}
        </Box>
      </Stack>

      <ProgramSaveStatus state={saveState} savedAt={savedAt} onRetry={flush} />
    </Box>
  );
};

export default TemplateDetails;
