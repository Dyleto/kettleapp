import { Box, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";

interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  flex?: number;
}

export const Field = ({ label, required, children, flex }: FieldProps) => {
  return (
    <VStack align="start" gap={1} width="100%" flex={flex}>
      <Text fontSize="sm" fontWeight="medium">
        {label}
        {required && (
          <Text as="span" color="red.500">
            {" "}
            *
          </Text>
        )}
      </Text>
      <Box width="100%">{children}</Box>
    </VStack>
  );
};
