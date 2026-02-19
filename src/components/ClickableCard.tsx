import { Card } from "./Card";
import { ReactNode } from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

interface ClickableCardProps {
  children: ReactNode;
  onClick: () => void;
  color?: string;
  minW?: string;
  p?: number;
  cursor?: string;
}

const ClickableCard = ({
  children,
  onClick,
  color,
  minW,
  p = 8,
  cursor = "pointer",
}: ClickableCardProps) => {
  const colors = useThemeColors();

  return (
    <Card
      onClick={onClick}
      accentColor={color || colors.primary}
      minW={minW}
      p={p}
      cursor={cursor}
    >
      {children}
    </Card>
  );
};

export default ClickableCard;
