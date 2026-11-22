import { useState } from 'react';
import { Box, chakra, Link, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown, LuHeart } from 'react-icons/lu';
import { Link as RouterLink } from 'react-router';
import { ActionButton } from '@/kit';
import { useAuth } from '@/shared/contexts/useAuth';
import { LEGAL_ROUTES } from '@/shared/config/legal';
import { useAccount, useSetHealthConsent } from '../hooks/useAccount';
import { ConfirmHealthOptOut } from './ConfirmHealthOptOut';

/**
 * La question posée au client avant qu'il n'entre.
 *
 * Ce qu'il déclare après une séance — une douleur, une mauvaise nuit, un
 * mot — est une donnée de santé. On ne la collecte pas sans accord
 * explicite, et cet accord ne vaut que s'il est libre : refuser tient en un
 * geste, à la même taille qu'accepter, et l'application s'ouvre dans les
 * deux cas.
 *
 * La question tient en une phrase, qui nomme celui qui lira — « acceptes-tu
 * que Julie les lise ? ». Trois paragraphes la précédaient, et l'on
 * répondait sans les lire ; le détail de ce qu'un refus change se déplie,
 * et son contenu n'a pas bougé. L'ancienne phrase disait aussi « c'est avec
 * elles qu'il adapte la suite » : un accord sur un coach dont on ne connaît
 * pas le genre.
 *
 * L'écran ne se montre qu'une fois. Un refus s'enregistre comme une
 * décision — sinon on reposerait la question à chaque visite, ce qui revient
 * à demander jusqu'à ce que la réponse convienne.
 */
export const HealthConsentGate = ({
  coach = 'ton coach',
}: {
  /** Qui lira : « Julie », ou « ton coach » quand il y en a plusieurs. */
  coach?: string;
}) => {
  const { logout } = useAuth();
  const { mutate, isPending } = useSetHealthConsent();
  const { data } = useAccount();
  const [detailOpen, setDetailOpen] = useState(false);
  const [isOptOutOpen, setIsOptOutOpen] = useState(false);
  // Un compte déjà en service peut porter des ressentis collectés avant que
  // la question ne soit posée. Refuser les efface — on le dit d'abord, avec
  // le nombre. Sur un compte neuf il n'y a rien à perdre, et refuser reste
  // un seul geste : un obstacle devant un refus sans objet découragerait le
  // refus.
  const toLose = data?.asClient?.healthDataCount ?? 0;
  const optOut = () => {
    if (toLose > 0) {
      setIsOptOutOpen(true);
      return;
    }
    mutate(false);
  };

  return (
    <Box minH="100dvh" bg="bg.canvas" px={5} py={8}>
      <VStack
        align="stretch"
        gap="16px"
        maxW="480px"
        mx="auto"
        justify="center"
        minH="calc(100dvh - 64px)"
      >
        <Box color="app.primary" aria-hidden>
          <LuHeart size={44} />
        </Box>
        <Text
          as="h1"
          fontWeight="800"
          fontSize={{ base: '32px', md: '36px' }}
          lineHeight="1.08"
        >
          Une question avant de commencer
        </Text>
        <Text fontSize="17px" lineHeight="1.5" data-consent-question>
          Après chaque séance, tu pourras dire si tu as mal dormi, si tu as une
          douleur, ou laisser un mot. Ce sont des données de santé : acceptes-tu
          que {coach} les lise&nbsp;?
        </Text>

        <chakra.button
          type="button"
          aria-expanded={detailOpen}
          aria-controls="consent-detail"
          onClick={() => setDetailOpen((open) => !open)}
          display="flex"
          alignItems="center"
          gap="6px"
          alignSelf="flex-start"
          minH="44px"
          color="app.primary"
          fontSize="sm"
          fontWeight="700"
        >
          <Box
            as="span"
            transform={detailOpen ? 'rotate(180deg)' : undefined}
            transition="transform 0.2s"
            _motionReduce={{ transition: 'none' }}
            aria-hidden
          >
            <LuChevronDown size={16} />
          </Box>
          En savoir plus
        </chakra.button>
        {detailOpen && (
          <VStack
            id="consent-detail"
            align="stretch"
            gap="8px"
            p="16px"
            borderRadius="card"
            boxShadow="inset 0 0 0 1.5px {colors.line}"
            data-consent-detail
          >
            <Text fontWeight="700">En détail</Text>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
              Si tu refuses, l'application fonctionne pareil. Tu notes tes
              charges et ton niveau d'effort, et {coach} les voit. Seuls les
              étiquettes de ressenti et le commentaire libre ne te seront pas
              proposés, et rien de tout cela ne sera enregistré.
            </Text>
            <Link
              as={RouterLink}
              {...{ to: LEGAL_ROUTES.privacy }}
              color="app.primary"
              fontSize="sm"
              fontWeight="700"
            >
              Lire la politique de confidentialité
            </Link>
          </VStack>
        )}
        <Text fontSize="sm" color="fg.muted">
          Tu pourras changer d'avis à tout moment dans Mon compte.
        </Text>

        {/* Les deux réponses ont la même taille, et aucune n'est choisie
            d'avance : un refus plus petit ou plus loin ferait de lui un
            second choix, et l'accord ne serait plus libre. */}
        <VStack align="stretch" gap="10px" pt="8px">
          <ActionButton
            w="full"
            loading={isPending}
            onClick={() => mutate(true)}
            data-consent-answer
          >
            J'accepte
          </ActionButton>
          <ActionButton
            tone="ghost"
            w="full"
            loading={isPending}
            onClick={optOut}
            data-consent-answer
          >
            Je refuse
          </ActionButton>
          {/* Pour qui s'est trompé de compte. */}
          <chakra.button
            type="button"
            onClick={logout}
            alignSelf="center"
            minH="44px"
            px="12px"
            color="fg.muted"
            fontSize="sm"
            _hover={{ color: 'fg' }}
          >
            Se déconnecter
          </chakra.button>
        </VStack>
      </VStack>
      <ConfirmHealthOptOut
        open={isOptOutOpen}
        onClose={() => setIsOptOutOpen(false)}
        onConfirm={() => {
          mutate(false);
          setIsOptOutOpen(false);
        }}
        isPending={isPending}
        title="Refuser le partage ?"
        action="Refuser et effacer"
        count={toLose}
      />
    </Box>
  );
};
