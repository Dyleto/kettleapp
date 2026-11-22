import { Box, Image, Link, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { LuExternalLink, LuPlay } from 'react-icons/lu';
import { readVideoLink } from '@/domain/exercise/video';

interface VideoPlayerProps {
  url: string;
}

/**
 * La vidéo d'un exercice : une vignette, puis le lecteur au clic.
 *
 * L'iframe était montée d'emblée sur chaque carte ouverte — une requête
 * tierce, des cookies et un lecteur complet pour une vidéo que personne ne
 * regarde forcément, et dans l'éditeur on en ouvre plusieurs d'affilée.
 * Surtout, une iframe peint son propre fond blanc : tant qu'elle n'avait pas
 * chargé, l'écran montrait une dalle pâle au milieu d'une application sombre.
 * Kettle est une PWA qu'on utilise en salle ; le réseau lent n'y est pas une
 * hypothèse.
 *
 * `youtube-nocookie` une fois le lecteur monté : rien n'est déposé tant que
 * personne n'a demandé à voir la vidéo.
 */
const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const link = readVideoLink(url);
  // Un lien illisible ne montre rien : c'est à la fiche du coach de le
  // refuser, et le client n'a rien à en faire.
  if (!link) return null;

  // Une autre adresse que YouTube ne se joue pas ici : elle s'ouvre
  // ailleurs, dans un cadre de la même taille, pour que la fiche ne change
  // pas de forme d'un exercice à l'autre.
  if (link.kind === 'link') {
    return (
      <Box
        position="relative"
        w="100%"
        paddingBottom="56.25%"
        height={0}
        borderRadius="md"
        bg="black"
        data-video-link
      >
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Link
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            display="flex"
            alignItems="center"
            gap={2}
            px={4}
            py={2.5}
            borderRadius="full"
            bg="whiteAlpha.200"
            color="fg"
            fontWeight="bold"
            fontSize="sm"
            _hover={{ bg: 'whiteAlpha.300', textDecoration: 'none' }}
          >
            <LuExternalLink size={16} aria-hidden />
            Ouvrir la vidéo
          </Link>
        </Box>
      </Box>
    );
  }

  const { id, isShort } = link;
  // Format vertical pour les Shorts, sur mobile seulement.
  const ratio = isShort && isMobile ? '177.78%' : '56.25%';
  const maxW = isShort && isMobile ? '400px' : undefined;

  return (
    <Box display="flex" justifyContent="center" w="100%">
      <Box
        position="relative"
        w="100%"
        maxW={maxW}
        paddingBottom={ratio}
        height={0}
        overflow="hidden"
        borderRadius="md"
        bg="bg.canvas"
      >
        {isPlaying ? (
          <iframe
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '0.375rem',
            }}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Vidéo de l'exercice"
          />
        ) : (
          <Box
            as="button"
            aria-label="Lire la vidéo de l'exercice"
            onClick={() => setIsPlaying(true)}
            position="absolute"
            inset={0}
            w="100%"
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="md"
            overflow="hidden"
            bg="bg.canvas"
            cursor="pointer"
          >
            {/* La vignette peut ne jamais arriver (hors ligne, domaine
                bloqué) : on la retire alors entièrement plutôt que de laisser
                le navigateur peindre sa propre icône d'image cassée. Le fond
                sombre reste visible, jamais une dalle blanche. */}
            {!thumbFailed && (
              <Image
                src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                alt=""
                onError={() => setThumbFailed(true)}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="cover"
                opacity={0.55}
              />
            )}
            <Box
              position="relative"
              display="flex"
              alignItems="center"
              gap={2}
              px={4}
              py={2.5}
              borderRadius="full"
              bg="blackAlpha.700"
              color="fg"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
            >
              <LuPlay size={14} />
              <Text fontSize="sm" fontWeight="bold">
                Voir la vidéo
              </Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VideoPlayer;
