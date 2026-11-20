import { chakra, HStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router';
import { COACH_ROUTES } from '@/shared/config/routes';
import { TOUCH } from '@/kit';

const Tab = ({
  to,
  current,
  children,
}: {
  to: string;
  current: boolean;
  children: string;
}) => (
  <chakra.a
    as={RouterLink}
    {...{ to }}
    aria-current={current ? 'page' : undefined}
    display="inline-flex"
    alignItems="center"
    minH="40px"
    px="16px"
    borderRadius="full"
    fontWeight="700"
    fontSize="15px"
    whiteSpace="nowrap"
    bg={current ? 'app.primary' : 'transparent'}
    color={current ? 'bg.canvas' : 'fg'}
    boxShadow={current ? undefined : 'inset 0 0 0 1.5px {colors.line}'}
    _hover={current ? undefined : { bg: 'whiteAlpha.100' }}
    css={{ [TOUCH]: { minHeight: '44px' } }}
  >
    {children}
  </chakra.a>
);

/**
 * « Programme » / « Ressentis » : les deux volets de la fiche d'un client.
 *
 * Des liens et non une bascule : chacun mène à une adresse, que le retour du
 * navigateur retrouve et qu'on peut ouvrir dans un autre onglet. L'ancien
 * journal n'avait qu'un « ← Programme » en haut à gauche, qui disait où
 * l'on allait mais pas où l'on était.
 *
 * Le volet ouvert porte `aria-current` : un lecteur d'écran entend lequel des
 * deux est à l'écran, comme l'œil le voit à sa couleur.
 */
export const ClientTabs = ({
  clientId,
  current,
}: {
  clientId: string;
  current: 'program' | 'journal';
}) => (
  <HStack as="nav" aria-label="Volets de la fiche" gap="6px">
    <Tab
      to={COACH_ROUTES.clientSession(clientId, 1)}
      current={current === 'program'}
    >
      Programme
    </Tab>
    <Tab
      to={COACH_ROUTES.clientJournal(clientId)}
      current={current === 'journal'}
    >
      Ressentis
    </Tab>
  </HStack>
);
