import { useEffect, useRef, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { LuArrowDown, LuRefreshCw, LuWifiOff } from 'react-icons/lu';
import { useOnline } from '@/shared/hooks/useOnline';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { PULL_ARM, pullIntent, pullPhase, pullTravel } from '@/shared/pull';

/**
 * Un tour qui s'arrête avant d'avoir commencé ne dit rien : la relecture
 * répond souvent en quelques dizaines de millisecondes, et l'indicateur
 * clignotait. Il tourne au moins ceci.
 */
const MIN_SPIN = 600;
/** L'indicateur fait 40 px : à course nulle, il est caché au-dessus. */
const HIDDEN = -48;

const LABELS = {
  pulling: 'Tire pour actualiser',
  armed: 'Relâche pour actualiser',
  offline: 'Hors connexion : rien à actualiser',
  refreshing: 'Actualisation…',
} as const;

/**
 * Tirer l'écran vers le bas, tout en haut de la page, relit ce qu'il
 * montre.
 *
 * La donnée est tenue pour fraîche cinq minutes (`queryClient`) : sans ce
 * geste, le programme que le coach vient de changer, la séance que le
 * client vient d'envoyer restaient invisibles jusque-là, et rien ne
 * permettait de les faire venir — sinon recharger toute l'application.
 *
 * Posé sur les quatre écrans dont le contenu change par l'autre : l'accueil
 * et le programme du client, que le coach modifie ; « À lire » et la liste
 * des clients, que les clients remplissent. Progrès, Mon compte et les
 * écrans du coach qu'il écrit lui-même ne changent que par son propre
 * geste, déjà enregistré.
 *
 * `queries` nomme ce que l'écran affiche : seules ces lectures repartent.
 * Tout relire aurait relu aussi la session, dont un échec passager aurait
 * pu déconnecter quelqu'un qui voulait seulement voir sa semaine.
 *
 * Écouté sur le document et non sur l'écran : la page défile avec la
 * fenêtre, et l'écran ne couvre pas toujours toute sa hauteur. Rien ne
 * démarre dans une feuille : elle est par-dessus l'écran, et tirer y veut
 * dire autre chose. Une traction pendant une relecture est ignorée — elle
 * en lancerait une seconde, pour rien.
 *
 * Tant que la traction dure, le navigateur ne fait pas la sienne : Chrome
 * sur Android rechargeait toute la page. Ce point-là, le banc ne le voit
 * pas — Chrome sans écran n'a pas de traction à lui.
 */
export const PullToRefresh = ({
  queries,
}: {
  queries: readonly QueryKey[];
}) => {
  const queryClient = useQueryClient();
  const online = useOnline();
  const [travel, setTravel] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Les écouteurs sont posés une fois ; ce qu'ils lisent change à chaque
  // rendu, d'où ce miroir.
  const latest = useRef({ online, refreshing, queries });
  useEffect(() => {
    latest.current = { online, refreshing, queries };
  });

  useEffect(() => {
    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let reach = 0;

    const refresh = async () => {
      setRefreshing(true);
      const began = performance.now();
      try {
        await Promise.all(
          latest.current.queries.map((queryKey) =>
            queryClient.refetchQueries(
              { queryKey, type: 'active' },
              { throwOnError: true }
            )
          )
        );
      } catch {
        toaster.create({
          type: 'error',
          title: 'Actualisation impossible',
          description: 'Ce qui est affiché n’a pas bougé.',
        });
      }
      const left = MIN_SPIN - (performance.now() - began);
      if (left > 0) await new Promise((done) => setTimeout(done, left));
      setRefreshing(false);
    };

    const reset = () => {
      start = null;
      pulling = false;
      reach = 0;
      setDragging(false);
      setTravel(0);
    };

    const onStart = (event: TouchEvent) => {
      if (latest.current.refreshing || event.touches.length !== 1) return;
      if (window.scrollY > 0) return;
      const target = event.target as Element | null;
      if (target?.closest?.('[role="dialog"]')) return;
      start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      pulling = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!start) return;
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (!pulling) {
        const intent = pullIntent(dx, dy);
        if (intent === 'undecided') return;
        if (intent === 'other') {
          start = null;
          return;
        }
        pulling = true;
        setDragging(true);
      }
      if (event.cancelable) event.preventDefault();
      reach = pullTravel(dy);
      setTravel(reach);
    };

    const onEnd = () => {
      if (!start) return;
      const go = pulling && pullPhase(reach, latest.current.online) === 'armed';
      reset();
      if (go) void refresh();
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', reset);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', reset);
    };
  }, [queryClient]);

  const phase = refreshing ? 'refreshing' : pullPhase(travel, online);
  if (phase === 'idle') return null;
  const y = refreshing ? PULL_ARM / 2 : HIDDEN + travel;

  return (
    <Box
      position="fixed"
      top={0}
      left="50%"
      zIndex={1400}
      pointerEvents="none"
      style={{ transform: `translate(-50%, ${y}px)` }}
      // Le doigt mène l'indicateur sans délai ; lâché, il se pose d'un
      // geste.
      transition={dragging ? 'none' : 'transform 0.2s ease-out'}
      _motionReduce={{ transition: 'none' }}
      role="status"
      data-pull={phase}
    >
      <HStack
        gap={2}
        px={4}
        h="40px"
        borderRadius="full"
        bg="bg.raised"
        boxShadow="0 8px 24px rgba(0, 0, 0, 0.45)"
        whiteSpace="nowrap"
      >
        <Box
          display="grid"
          color={phase === 'offline' ? 'fg.muted' : 'app.primary.fg'}
          transform={phase === 'armed' ? 'rotate(180deg)' : undefined}
          transition="transform 0.15s"
          animation={
            phase === 'refreshing' ? 'spin 0.9s linear infinite' : undefined
          }
          _motionReduce={{ transition: 'none', animation: 'none' }}
          aria-hidden
        >
          {phase === 'offline' ? (
            <LuWifiOff size={18} />
          ) : phase === 'refreshing' ? (
            <LuRefreshCw size={18} />
          ) : (
            <LuArrowDown size={18} />
          )}
        </Box>
        <Text fontSize="sm" fontWeight="bold">
          {LABELS[phase]}
        </Text>
      </HStack>
    </Box>
  );
};
