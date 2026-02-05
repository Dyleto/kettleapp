import { Card } from "./Card";
import { ReactNode } from "react";
import { useThemeColors } from "@/hooks/useThemeColors";

interface ClickableCardProps {
  children: ReactNode;
  onClick: () => void;
  color?: string;
  minW?: string;
  p?: number;
}

const ClickableCard = ({
  children,
  onClick,
  color,
  minW,
  p = 8,
}: ClickableCardProps) => {
  const colors = useThemeColors();

  return (
    <Card
      onClick={onClick}
      accentColor={color || colors.primary}
      minW={minW}
      p={p}
    >
      {children}
    </Card>
  );
};

export default ClickableCard;
