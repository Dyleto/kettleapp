import { Box, HStack, Text } from "@chakra-ui/react";
import { LuDumbbell, LuWrench, LuClipboardCheck } from "react-icons/lu";
import { useThemeColors } from "@/hooks/useThemeColors";

type Role = "coach" | "client" | "admin";

interface RoleBadgeProps {
  role: Role;
}

const roleConfig = {
  coach: {
    label: "Coach",
    icon: LuClipboardCheck,
  },
  client: {
    label: "Client",
    icon: LuDumbbell,
  },
  admin: {
    label: "Admin",
    icon: LuWrench,
  },
};

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const config = roleConfig[role];
  const Icon = config.icon;
  const colors = useThemeColors();

  return (
    <Box
      my={2}
      px={2}
      pb={0.5}
      pt="20px"
      bg={colors.primary}
      color="fg.inverted"
      borderRadius="md"
      fontSize="xs"
      fontWeight="medium"
      position="absolute"
      width="40%"
      top="-26px"
      left="50%"
      transform="translateX(-50%)"
      boxShadow="lg"
      minWidth="120px"
    >
      <HStack gap={2} justify="center">
        <Icon size={16} />
        <Text>{config.label}</Text>
      </HStack>
    </Box>
  );
};
