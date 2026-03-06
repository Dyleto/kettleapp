import { HStack, Text } from "@chakra-ui/react";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ReactNode } from "react";

interface MetricStarsProps {
  label: ReactNode;
  value: number; // 1-5
  readonly?: boolean;
  onChange?: (value: number) => void;
}

export const MetricStars = ({
  label,
  value,
  readonly = false,
  onChange,
}: MetricStarsProps) => {
  const colors = useThemeColors();

  return (
    <HStack justify="space-between" w="full">
      <HStack gap={2} minW="32px">
        {label}
      </HStack>
      <HStack gap={1}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text
            key={star}
            fontSize="lg"
            cursor={readonly ? "default" : "pointer"}
            opacity={star <= value ? 1 : 0.2}
            transition="opacity 0.15s, transform 0.15s"
            _hover={
              readonly ? undefined : { opacity: 1, transform: "scale(1.2)" }
            }
            onClick={() => !readonly && onChange?.(star)}
            userSelect="none"
          >
            ⭐
          </Text>
        ))}
      </HStack>
    </HStack>
  );
};
