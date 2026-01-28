import { Card } from "./Card";
import { ReactNode } from "react";

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
  color = "yellow.400",
  minW,
  p = 8,
}: ClickableCardProps) => {
  return (
    <Card onClick={onClick} accentColor={color} minW={minW} p={p}>
      {children}
    </Card>
  );
};

export default ClickableCard;
