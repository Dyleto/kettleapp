import { Box } from '@chakra-ui/react';
import { LuRefreshCw } from 'react-icons/lu';
import { ActionButton, Banner } from '@/kit';
import { useAppUpdate } from '@/shared/hooks/useAppUpdate';

/**
 * Le seul cas où une nouvelle version demande quelque chose à la personne.
 *
 * Le reste du temps elle se prend toute seule, sans un mot : c'est le travail
 * de `useAppUpdate`. Ce bandeau n'apparaît que lorsqu'il reste une frappe non
 * enregistrée, parce qu'alors recharger coûterait ce que la personne vient
 * d'écrire.
 *
 * Il prend la pièce du kit (`Banner`, à l'ambre : quelque chose attend) et
 * la phrase de la maquette. Il disait « Une nouvelle version est prête.
 * Recharger » : recharger, c'était précisément ce qu'il ne fallait pas
 * faire tant que la frappe n'était pas partie. « Maintenant » l'envoie, et
 * le rechargement suit de lui-même une fois qu'elle est enregistrée.
 *
 * En haut et non en bas : le bas de l'écran est déjà réclamé par la ligne
 * d'état de l'enregistrement — et c'est précisément la situation dans
 * laquelle ce bandeau se montre. Les deux se seraient disputé la même place.
 */
export const AppUpdateBanner = () => {
  const { pending, installNow } = useAppUpdate();
  if (!pending) return null;
  return (
    <Box
      // Fixe et non collant : le bandeau est monté à la racine, à côté de
      // l'application et non dedans, donc il n'a pas de conteneur défilant
      // auquel se coller.
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1500}
      px={{ base: 4, md: 8 }}
      pt={3}
      pointerEvents="none"
      data-update-banner
    >
      <Box
        maxW="720px"
        mx="auto"
        pointerEvents="auto"
        bg="bg.canvas"
        borderRadius="card"
      >
        <Banner
          tone="amber"
          icon={<LuRefreshCw size={20} />}
          title="Nouvelle version prête"
          line="Elle s’installera dès que ce programme sera enregistré."
          action={
            <ActionButton size="sm" onClick={installNow}>
              Maintenant
            </ActionButton>
          }
        />
      </Box>
    </Box>
  );
};
