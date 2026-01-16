import { Box, HStack, VStack } from "@chakra-ui/react";
import { forwardRef, useState, useRef, useEffect, ReactNode } from "react";
import { LuChevronDown } from "react-icons/lu";

interface SelectItem {
  value: string;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface NativeSelectRootProps {
  children: React.ReactNode;
}

export const NativeSelectRoot = ({ children }: NativeSelectRootProps) => {
  return <Box position="relative">{children}</Box>;
};

interface NativeSelectFieldProps {
  items: SelectItem[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  required?: boolean;
}

export const NativeSelectField = forwardRef<HTMLDivElement, NativeSelectFieldProps>(
  ({ items, value, onChange, placeholder, required }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = items.find((opt) => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      if (onChange) {
        onChange({ target: { value: optionValue } });
      }
      setIsOpen(false);
    };

    return (
      <Box ref={containerRef} w="100%">
        {/* Bouton déclencheur */}
        <HStack
          w="100%"
          p={2}
          pr={3}
          borderRadius="md"
          borderWidth="1px"
          borderColor={isOpen ? "yellow.400" : "gray.700"}
          bg="gray.800"
          cursor="pointer"
          transition="all 0.2s"
          justify="space-between"
          onClick={() => setIsOpen(!isOpen)}
          _hover={{
            borderColor: isOpen ? "yellow.400" : "gray.600",
          }}
          boxShadow={isOpen ? "0 0 0 1px var(--chakra-colors-yellow-400)" : "none"}
        >
          {selectedOption ? (
            <HStack gap={2}>
              {selectedOption.icon && (
                <Box
                  p={1}
                  bg={`${selectedOption.color || "yellow.400"}/10`}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={`${selectedOption.color || "yellow.400"}/30`}
                >
                  {selectedOption.icon}
                </Box>
              )}
              <Box color="white">{selectedOption.label}</Box>
            </HStack>
          ) : (
            <Box color="gray.400">{placeholder || "Sélectionner..."}</Box>
          )}
          <Box transition="transform 0.2s" transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"} color="gray.400">
            <LuChevronDown />
          </Box>
        </HStack>

        {/* Menu déroulant */}
        {isOpen && (
          <VStack
            position="absolute"
            top="calc(100% + 4px)"
            left={0}
            right={0}
            bg="gray.800"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.700"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.4)"
            zIndex={1000}
            gap={0}
            overflow="hidden"
          >
            {items.map((option) => (
              <HStack
                key={option.value}
                w="100%"
                p={3}
                gap={2}
                cursor="pointer"
                transition="all 0.2s"
                bg={value === option.value ? `${option.color || "yellow.400"}/10` : "transparent"}
                _hover={{
                  bg: `${option.color || "yellow.400"}/20`,
                }}
                onClick={() => handleSelect(option.value)}
              >
                {option.icon && (
                  <Box
                    p={1}
                    bg={`${option.color || "yellow.400"}/10`}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={`${option.color || "yellow.400"}/30`}
                  >
                    {option.icon}
                  </Box>
                )}
                <Box color="white">{option.label}</Box>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    );
  }
);

NativeSelectField.displayName = "NativeSelectField";
