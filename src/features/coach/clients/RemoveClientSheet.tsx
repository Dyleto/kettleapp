import { Portal, Text } from '@chakra-ui/react';
import type { Client } from '@/shared/types';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import { clientName } from '@/domain/clients/roster';
import { useRemoveClient } from '@/features/coach/hooks/useClients';

const NBSP = '\u00A0';

/**
 * « Retirer de mes clients » : la confirmation, puis le client quitte la
 * liste.
 *
 * La feuille dit ce qui part et ce qui reste avant de le faire : le lien et
 * les étiquettes partent ; le compte, le programme et l'historique restent
 * au client. Un retrait raté ne ferme rien : la feuille dit que le client
 * est toujours là, et « Retirer » se retouche.
 */
export const RemoveClientSheet = ({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const remove = useRemoveClient();
  const name = clientName(client);
  const title = `Retirer ${name} de tes clients${NBSP}?`;
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <Text color="fg.muted">
          Son compte, son programme et son historique restent les siens. Tu ne
          verras plus ses séances, et tes étiquettes partent avec le lien.
        </Text>
        {remove.isError && (
          <Text role="alert" fontSize="sm" color="fg.muted">
            Le retrait n’a pas abouti : {name} reste dans tes clients. Réessaie.
          </Text>
        )}
        <ActionButton
          tone="danger"
          w="full"
          loading={remove.isPending}
          onClick={() => remove.mutate(client._id, { onSuccess: onClose })}
        >
          Retirer
        </ActionButton>
        <ActionButton tone="ghost" size="md" w="full" onClick={onClose}>
          Garder
        </ActionButton>
      </Sheet>
    </Portal>
  );
};
