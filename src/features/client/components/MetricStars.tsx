import { HStack, Text, VStack } from "@chakra-ui/react";
import { IconType } from "react-icons";
import { useThemeColors } from "@/hooks/useThemeColors";
import { ReactNode } from "react";

interface MetricStarsProps {
  label: ReactNode;
  icon: IconType;
  value: number; // 1-5
  readonly?: boolean;
  onChange?: (value: number) => void;
}

export const MetricStars = ({
  label,
  icon: Icon,
  value,
  readonly = false,
  onChange,
}: MetricStarsProps) => {
  const colors = useThemeColors();

  return (
    <HStack justify="space-between" w="full">
      <HStack gap={2} minW="120px">
        <Icon size={14} color={colors.primaryHex} />
        <Text fontSize="sm" color="gray.300">
          {label}
        </Text>
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
