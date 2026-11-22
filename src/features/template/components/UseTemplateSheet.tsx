import { useState } from 'react';
import {
  Avatar,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import type { Client, TemplateRow } from '@/shared/types';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import { ClientSearch, useClients } from '@/features/coach';
import { clientName, matchesQuery, sortClients } from '@/domain/clients/roster';
import { clientProgramLine, importChoice } from '@/domain/template/card';
import { useImportTemplate } from '@/features/template/hooks/useTemplateMutations';
import { ReplaceOutcome } from '@/features/template/components/ReplaceOutcome';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { COACH_ROUTES } from '@/shared/config/routes';
import { isUnavailable } from '@/shared/utils/queryState';

const NBSP = ' ';

/**
 * « Utiliser pour un client » : la liste des clients, chacun avec ce que
 * son programme porte aujourd'hui, puis l'import.
 *
 * Avant, un modèle ne s'importait que depuis l'atelier du client : pour
 * donner « Prise de masse » à trois clients, il fallait ouvrir trois fiches.
 * La feuille part du modèle, et dit pour chaque client ce que l'import
 * ferait — « programme vide », « Importer », immédiat ; « a déjà 6
 * séances », « Remplacer… », qui pose la question de l'atelier, avec la
 * même boîte.
 *
 * Un import réussi ouvre l'atelier du client sur le programme importé :
 * c'est là qu'on l'ajuste, et c'est la raison de l'import. Un import raté
 * ne ferme rien et dit que le programme du client n'a pas bougé.
 *
 * `blocked` vient de l'atelier d'un modèle : tant que ce qu'on y a écrit
 * n'est pas enregistré, le serveur importerait la version d'avant.
 */
export const UseTemplateSheet = ({
  template,
  blocked,
  onClose,
}: {
  template: Pick<TemplateRow, '_id' | 'name' | 'sessionCount'>;
  blocked?: string;
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const navigate = useNavigate();
  const clientsQuery = useClients();
  const importTemplate = useImportTemplate();
  const [query, setQuery] = useState('');
  const [replacing, setReplacing] = useState<Client | null>(null);
  const [failedFor, setFailedFor] = useState<Client | null>(null);

  const all = clientsQuery.data ?? [];
  const clients = sortClients(all, 'alpha', new Date()).filter((client) =>
    matchesQuery(client, query)
  );

  const run = (client: Client) => {
    setFailedFor(null);
    importTemplate.mutate(
      { clientId: client._id, templateId: template._id },
      {
        onSuccess: () => {
          onClose();
          navigate(COACH_ROUTES.clientSession(client._id, 1));
          toaster.create({
            type: 'success',
            title: `Programme importé depuis “${template.name}”`,
          });
        },
        onError: () => setFailedFor(client),
      }
    );
  };

  const failure = failedFor && (
    <Text role="alert" fontSize="sm" color="fg.muted">
      Le modèle n’a pas été importé : le programme de{' '}
      {failedFor.firstName ?? clientName(failedFor)} n’a pas bougé. Réessaie.
    </Text>
  );

  if (replacing) {
    const who = replacing.firstName ?? clientName(replacing);
    const title = `Remplacer le programme de ${who}${NBSP}?`;
    return (
      <Portal>
        <Sheet label={title}>
          <Text as="h2" fontWeight="800" fontSize="22px">
            {title}
          </Text>
          <Text color="fg.muted">
            Le modèle «{NBSP}
            {template.name}
            {NBSP}» va prendre la place de ce que {who} a aujourd’hui.
          </Text>
          <ReplaceOutcome
            currentCount={replacing.sessionCount}
            incomingCount={template.sessionCount}
            bg="surface.card"
          />
          {failure}
          <ActionButton
            w="full"
            loading={importTemplate.isPending}
            onClick={() => run(replacing)}
          >
            Remplacer le programme
          </ActionButton>
          <ActionButton
            tone="ghost"
            size="md"
            w="full"
            disabled={importTemplate.isPending}
            onClick={() => {
              setFailedFor(null);
              setReplacing(null);
            }}
          >
            Annuler
          </ActionButton>
        </Sheet>
      </Portal>
    );
  }

  const title = `Utiliser «${NBSP}${template.name}${NBSP}» pour…`;
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px" lineClamp={2}>
          {title}
        </Text>
        {blocked && (
          <Text fontSize="sm" color="fg.muted" data-import-blocked>
            {blocked}
          </Text>
        )}
        {clientsQuery.isLoading ? (
          <HStack justify="center" py={6}>
            <Spinner size="sm" color="app.primary" />
          </HStack>
        ) : isUnavailable(clientsQuery) ? (
          <VStack align="stretch" gap="10px">
            <Text color="fg.muted">
              La liste de tes clients n’a pas pu se charger. Le modèle n’a pas
              bougé.
            </Text>
            <ActionButton
              tone="ghost"
              size="md"
              onClick={() => void clientsQuery.refetch()}
            >
              Réessayer
            </ActionButton>
          </VStack>
        ) : all.length === 0 ? (
          <Text color="fg.muted">
            Tu n’as pas encore de client. Invite-en un depuis Clients : le
            modèle t’attendra ici.
          </Text>
        ) : (
          <>
            <ClientSearch value={query} onChange={setQuery} />
            {failure}
            {clients.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                Aucun de tes clients ne répond à «{NBSP}
                {query.trim()}
                {NBSP}».
              </Text>
            ) : (
              <VStack
                align="stretch"
                gap={0}
                bg="surface.card"
                borderRadius="card"
                data-use-clients
              >
                {clients.map((client) => {
                  const name = clientName(client);
                  const choice = importChoice(client.sessionCount);
                  return (
                    <HStack
                      key={client._id}
                      gap="12px"
                      px="14px"
                      py="12px"
                      borderTopWidth="1px"
                      borderColor="line"
                      _first={{ borderTopWidth: 0 }}
                      data-use-client={client._id}
                    >
                      {/* Les initiales répètent le nom qui suit : un
                          lecteur d'écran n'a pas à les lire deux fois. */}
                      <Avatar.Root size="sm" w="34px" h="34px" aria-hidden>
                        <Avatar.Fallback name={name} />
                        {client.picture && (
                          <Avatar.Image alt="" src={client.picture} />
                        )}
                      </Avatar.Root>
                      <VStack align="start" gap="2px" flex={1} minW={0}>
                        <Text fontWeight="700" lineClamp={1}>
                          {name}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          {clientProgramLine(client.sessionCount)}
                        </Text>
                      </VStack>
                      {choice === 'import' ? (
                        <ActionButton
                          size="sm"
                          aria-label={`Importer chez ${name}`}
                          disabled={!!blocked || importTemplate.isPending}
                          loading={
                            importTemplate.isPending &&
                            importTemplate.variables?.clientId === client._id
                          }
                          onClick={() => run(client)}
                        >
                          Importer
                        </ActionButton>
                      ) : (
                        <ActionButton
                          tone="ghost"
                          size="sm"
                          aria-label={`Remplacer le programme de ${name}`}
                          disabled={!!blocked || importTemplate.isPending}
                          onClick={() => {
                            setFailedFor(null);
                            setReplacing(client);
                          }}
                        >
                          Remplacer…
                        </ActionButton>
                      )}
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </>
        )}
      </Sheet>
    </Portal>
  );
};
