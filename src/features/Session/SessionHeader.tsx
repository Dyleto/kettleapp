import { formatDuration } from "@/utils/formatters";
import { Box, HStack, Text } from "@chakra-ui/react";
import { LuClock } from "react-icons/lu";

interface SessionHeaderProps {
  order: number;
  duration: number;
}

export const SessionHeader = ({ order, duration }: SessionHeaderProps) => {
  return (
    <HStack justify="space-between" align="center" p={{ base: 4, md: 6 }}>
      {/* Spacer gauche pour centrer le numéro (desktop uniquement) */}
      <Box w="80px" display={{ base: "none", md: "block" }} />

      {/* Numéro stylisé */}
      <Box
        px={4}
        py={2}
        borderRadius="full"
        bg="yellow.400"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontWeight="bold"
        fontSize="lg"
        color="gray.900"
        boxShadow="0 4px 12px rgba(251, 191, 36, 0.3)"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          inset: "-3px",
          borderRadius: "full",
          padding: "3px",
          background:
            "linear-gradient(135deg, rgba(251, 191, 36, 0.4), rgba(251, 191, 36, 0.1))",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        Séance {order}
      </Box>

      {/* Temps à droite */}
      <HStack
        gap={2}
        color="gray.400"
        fontSize="sm"
        w={{ base: "auto", md: "80px" }}
        justify="flex-end"
      >
        <LuClock size={14} />
        <Text fontWeight="medium">{formatDuration(duration)}</Text>
      </HStack>
    </HStack>
  );
};
