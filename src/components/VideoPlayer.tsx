import { Box, useBreakpointValue } from "@chakra-ui/react";

interface VideoPlayerProps {
  url: string;
}

const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const getYouTubeEmbedUrl = (videoUrl: string) => {
    // YouTube standard (watch?v=)
    const standardMatch = videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (standardMatch) {
      return { embedUrl: `https://www.youtube.com/embed/${standardMatch[1]}`, isShort: false };
    }

    // YouTube Shorts
    const shortsMatch = videoUrl.match(/youtube\.com\/shorts\/([^"&?\/\s]+)/);
    if (shortsMatch) {
      return { embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}`, isShort: true };
    }

    return null;
  };

  if (!url) return null;

  const result = getYouTubeEmbedUrl(url);

  if (!result) {
    return (
      <Box
        p={4}
        bg="red.500/10"
        borderRadius="md"
        borderWidth="1px"
        borderColor="red.500"
        color="red.400"
        fontSize="sm"
      >
        ⚠️ URL YouTube invalide. Formats supportés :
        <Box as="ul" mt={2} ml={4}>
          <li>https://youtube.com/watch?v=xxxxx</li>
          <li>https://youtu.be/xxxxx</li>
          <li>https://youtube.com/shorts/xxxxx</li>
        </Box>
      </Box>
    );
  }

  const { embedUrl, isShort } = result;

  // Format vertical pour les Shorts en mobile uniquement
  if (isShort && isMobile) {
    return (
      <Box display="flex" justifyContent="center" width="100%">
        <Box
          position="relative"
          width="100%"
          maxWidth="400px"
          paddingBottom="177.78%" // Ratio 9:16
          height={0}
          overflow="hidden"
          borderRadius="md"
          bg="gray.900"
        >
          <iframe
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: "0.375rem",
            }}
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Exercise video (Short)"
          />
        </Box>
      </Box>
    );
  }

  // Format horizontal pour les vidéos classiques ET les Shorts en desktop
  return (
    <Box
      position="relative"
      paddingBottom="56.25%" // Ratio 16:9
      height={0}
      overflow="hidden"
      borderRadius="md"
      bg="gray.900"
    >
      <iframe
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "0.375rem",
        }}
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Exercise video"
      />
    </Box>
  );
};

export default VideoPlayer;
