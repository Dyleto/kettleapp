import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";

interface ClickableCardProps {
  children: ReactNode;
  onClick: () => void;
  color?: string;
  minW?: string;
  p?: number;
}

const ClickableCard = ({ children, onClick, color = "yellow.400", minW, p = 8 }: ClickableCardProps) => {
  return (
    <Box
      minW={minW}
      p={p}
      borderTopColor="transparent"
      borderTopWidth="3px"
      borderRadius="xl"
      bg="gray.800"
      boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.3s ease"
      onClick={onClick}
      _hover={{
        borderTopColor: color,
        transform: "translateY(-2px)",
        boxShadow: "md",
      }}
    >
      {/* Effet de brillance dans le coin */}
      <Box
        position="absolute"
        top="-50px"
        right="-50px"
        w="150px"
        h="150px"
        bg={color}
        opacity={0.1}
        borderRadius="full"
        filter="blur(40px)"
      />

      {/* Contenu avec position relative pour être au-dessus de l'effet */}
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
};

export default ClickableCard;
