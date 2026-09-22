import { Box, Image, Text, useBreakpointValue } from '@chakra-ui/react';
import { useState } from 'react';
import { LuPlay } from 'react-icons/lu';
import { parseYouTubeUrl } from '@/utils/videoUtils';

interface VideoPlayerProps {
  url: string;
}

/**
 * An exercise's video: a thumbnail, then the player on click.
 *
 * The iframe used to be mounted immediately on every card opened — a
 * third-party request, cookies and a full player for a video nobody
 * necessarily watches, and in the editor you open several in a row. Above
 * all, an iframe paints its own white background: until it had loaded, the
 * screen showed a pale slab in the middle of a dark app. Kettle is a PWA used
 * in the gym; a slow network is not a hypothesis there.
 *
 * `youtube-nocookie` once the player is mounted: nothing is dropped until
 * someone has asked to see the video.
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
  // Vertical format for Shorts, on mobile only.
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
            {/* The thumbnail may never arrive (offline, domain blocked):
                we then remove it entirely rather than let the browser paint
                its own broken-image icon. The dark background stays visible,
                never a white slab. */}
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
