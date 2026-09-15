import { Box, Image, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { LuPlay } from 'react-icons/lu';
import { parseYouTubeUrl } from '@/utils/videoUtils';

interface VideoPlayerProps {
  url: string;
}

/**
 * La vidéo d'un exercice : une vignette, puis le lecteur au clic.
 *
 * L'iframe était montée d'emblée à chaque fiche ouverte — requête tierce,
 * cookies et lecteur complet pour une vidéo qu'on ne regarde pas forcément,
 * et dans l'atelier on en ouvre plusieurs d'affilée. Surtout, une iframe peint
 * son propre fond blanc : tant qu'elle n'avait pas chargé, l'écran affichait
 * une dalle claire au milieu d'une application sombre. Kettle est une PWA
 * qu'on utilise en salle, le réseau lent n'y est pas une hypothèse.
 *
 * `youtube-nocookie` une fois le lecteur monté : on ne dépose rien tant que
 * personne n'a demandé à voir la vidéo.
 */
const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  if (!url) return null;
  const parsed = parseYouTubeUrl(url);

  if (!parsed) {
    return (
      <Box
        p={4}
        bg="app.error/10"
        borderRadius="md"
        borderWidth="1px"
        borderColor="app.error"
        color="app.error"
        fontSize="sm"
      >
        Lien YouTube non reconnu. Formats acceptés&nbsp;:
        <Box as="ul" mt={2} ml={4}>
          <li>youtube.com/watch?v=…</li>
          <li>youtu.be/…</li>
          <li>youtube.com/shorts/…</li>
        </Box>
      </Box>
    );
  }

  const { id, isShort } = parsed;
  // Format vertical pour les Shorts en mobile uniquement.
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
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'app.primary',
              outlineOffset: '2px',
            }}
          >
            {/* La vignette peut ne pas arriver (hors-ligne, domaine bloqué) :
                on la retire alors complètement plutôt que de laisser le
                navigateur peindre sa propre icône d'image cassée. Le fond
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
