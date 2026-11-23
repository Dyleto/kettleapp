import { Box } from '@chakra-ui/react';
import { LuWifiOff } from 'react-icons/lu';
import { Banner } from '@/kit';
import { useOnline } from '@/shared/hooks/useOnline';

/**
 * « Hors connexion », tant que le réseau manque, en tête de l'espace.
 *
 * Il n'y avait rien : une séance faite dans un sous-sol partait en attente
 * sans que personne le sache, et le coach voyait « Non enregistré » sans
 * savoir pourquoi. Le bandeau dit ce qui se passe et ce qui est sauf — la
 * phrase vient de l'espace, parce que ce qui est sauf n'y est pas le même :
 * la séance pour le client, ce qu'il écrit pour le coach.
 *
 * Posé dans la coque, il reste sous la séance guidée, qui est un calque
 * plein écran : elle marche sans réseau, et le bilan dira lui-même qu'il
 * partira plus tard.
 */
export const OfflineBanner = ({ line }: { line: string }) => {
  const online = useOnline();
  if (online) return null;
  return (
    <Box px={{ base: 4, md: 8 }} pt={{ base: 3, md: 5 }} data-offline>
      <Banner
        tone="coral"
        icon={<LuWifiOff size={20} />}
        title="Hors connexion"
        line={line}
      />
    </Box>
  );
};
