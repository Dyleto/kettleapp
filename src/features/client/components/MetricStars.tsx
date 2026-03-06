import { HStack, Text } from "@chakra-ui/react";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ReactNode } from "react";
import { LuStar } from "react-icons/lu";

interface MetricStarsProps {
  icon: ReactNode;
  label: string;
  value: number; // 1-5
  readonly?: boolean;
  onChange?: (value: number) => void;
}

export const MetricStars = ({
  icon,
  label,
  value,
  readonly = false,
  onChange,
}: MetricStarsProps) => {
  const colors = useThemeColors();

  return (
    <HStack justify="space-between" w="full">
      <HStack gap={2} minW="130px">
        {icon}
        <Text fontSize="sm" color="gray.300">
          {label}
        </Text>
      </HStack>
      <HStack gap={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <LuStar
            key={star}
            size={18}
            cursor={readonly ? "default" : "pointer"}
            color={star <= value ? colors.primaryHex : "rgba(255,255,255,0.15)"}
            fill={star <= value ? colors.primaryHex : "transparent"}
            style={{ transition: "color 0.15s, transform 0.15s" }}
            onClick={() => !readonly && onChange?.(star)}
          />
        ))}
      </HStack>
    </HStack>
  );
};
