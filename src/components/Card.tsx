import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface CardProps extends Omit<BoxProps, "onClick"> {
  children: ReactNode;
  /**
   * Ajoute l'effet de brillance dans le coin
   */
  withGlow?: boolean;
  /**
   * Couleur de l'effet brillance et de la bordure au hover
   */
  accentColor?: string;
  /**
   * Rend la carte cliquable avec hover effects
   */
  onClick?: () => void;
  /**
   * Variante de hover effect
   */
  hoverEffect?: "lift" | "border" | "both" | "none";
}

export const Card = ({
  children,
  withGlow = true,
  accentColor = "yellow.400",
  onClick,
  hoverEffect = "both",
  ...props
}: CardProps) => {
  const getHoverStyles = () => {
    const styles: any = {};

    if (hoverEffect === "lift" || hoverEffect === "both") {
      styles.transform = "translateY(-2px)";
      styles.boxShadow = "0 12px 32px rgba(0, 0, 0, 0.5)";
    }

    if (hoverEffect === "border" || hoverEffect === "both") {
      styles.borderTopColor = accentColor;
    }

    return styles;
  };

  return (
    <Box
      borderTopWidth="3px"
      borderTopColor="transparent"
      borderRadius="xl"
      bg="gray.800"
      boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
      position="relative"
      overflow="hidden"
      cursor={onClick ? "pointer" : "default"}
      transition="all 0.3s ease"
      onClick={onClick}
      _hover={hoverEffect !== "none" ? getHoverStyles() : undefined}
      {...props}
    >
      {/* Effet brillance */}
      {withGlow && (
        <Box
          position="absolute"
          top="-50px"
          right="-50px"
          w="150px"
          h="150px"
          bg={accentColor}
          opacity={0.1}
          borderRadius="full"
          filter="blur(40px)"
          pointerEvents="none"
        />
      )}

      {/* Contenu */}
      <Box position="relative" zIndex={1}>
        {children}
      </Box>
    </Box>
  );
};
