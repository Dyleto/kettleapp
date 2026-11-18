import { useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { Chip } from '@/kit';
import type { InboxItem } from '@/shared/types';
import { clientLabel } from '@/domain/inbox/feed';
import { ClientAvatar, InboxCard } from './InboxCard';

/**
 * Les séances calmes d'un client, en une ligne : « 3 séances · toutes
 * “Juste” ». La toucher les déplie.
 *
 * Trois cartes « Juste » de Thomas se lisent comme « Thomas va bien » : les
 * afficher une à une faisait de trois non-nouvelles trois choses à lire, au
 * milieu de celles qui comptent.
 */
export const QuietFold = ({ items }: { items: InboxItem[] }) => {
  const [open, setOpen] = useState(false);
  const client = items[0].client;
  return (
    <VStack align="stretch" gap={3}>
      <Box
        as="button"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        textAlign="left"
        bg="surface.card"
        borderRadius="card"
        p="18px"
        _hover={{ bg: 'whiteAlpha.50' }}
        data-inbox-fold={client._id}
      >
        <HStack gap="10px">
          <ClientAvatar client={client} />
          <Box flex={1} minW={0}>
            <Text fontWeight="700" fontSize="16px" truncate>
              {clientLabel(client)}
            </Text>
            <Text color="fg.muted" fontSize="sm">
              {items.length} séances · toutes «&nbsp;Juste&nbsp;»
            </Text>
          </Box>
          <Chip tone="teal">Tout va bien</Chip>
        </HStack>
      </Box>
      {open &&
        items.map((item) => <InboxCard key={item.completed._id} item={item} />)}
    </VStack>
  );
};
