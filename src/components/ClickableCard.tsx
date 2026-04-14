import { Card } from "./Card";
import { Box, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

interface ClickableCardProps {
  children: ReactNode;
  onClick: () => void;
  color?: string;
  minW?: string;
  p?: number;
  cursor?: string;
  footerText?: string;
}

const ClickableCard = ({
  children,
  onClick,
  color,
  minW,
  p = 8,
  cursor = "pointer",
  footerText,
}: ClickableCardProps) => {
  const colors = useThemeColors();

  return (
    <Card
      onClick={onClick}
      accentColor={color || colors.primary}
      minW={minW}
      p={0}
      cursor={cursor}
    >
      <Box pt={p} px={p} pb={footerText ? 4 : p}>
        {children}
      </Box>
      {footerText && (
        <Box
          bg={colors.primary}
          px={3}
          py={1.5}
          textAlign="center"
          borderRadius="0 0 11px 11px"
        >
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color="white"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {footerText}
          </Text>
        </Box>
      )}
    </Card>
  );
};

export default ClickableCard;
