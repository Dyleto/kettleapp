import { Box, HStack, VStack } from '@chakra-ui/react';
import { forwardRef, useState, useRef, useEffect, ReactNode } from 'react';
import { LuChevronDown } from 'react-icons/lu';

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

export const NativeSelectField = forwardRef<
  HTMLDivElement,
  NativeSelectFieldProps
>(({ items, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = items.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      {/* Trigger button */}
      <HStack
        w="100%"
        p={2}
        pr={3}
        borderRadius="md"
        borderWidth="1px"
        borderColor={isOpen ? 'app.primary' : 'fg.muted'}
        bg="surface.card"
        cursor="pointer"
        transition="all 0.2s"
        justify="space-between"
        onClick={() => setIsOpen(!isOpen)}
        _hover={{
          borderColor: isOpen ? 'app.primary' : 'fg.muted',
        }}
        boxShadow={
          isOpen ? '0 0 0 1px var(--chakra-colors-app-primary)' : 'none'
        }
      >
        {selectedOption ? (
          <HStack gap={2}>
            {selectedOption.icon && (
              <Box
                p={1}
                bg={`${selectedOption.color || 'app.primary'}/10`}
                borderRadius="md"
                borderWidth="1px"
                borderColor={`${selectedOption.color || 'app.primary'}/30`}
              >
                {selectedOption.icon}
              </Box>
            )}
            <Box color="white">{selectedOption.label}</Box>
          </HStack>
        ) : (
          <Box color="fg.muted">{placeholder || 'Sélectionner...'}</Box>
        )}
        <Box
          transition="transform 0.2s"
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          color="fg.muted"
        >
          <LuChevronDown />
        </Box>
      </HStack>

      {/* Dropdown menu */}
      {isOpen && (
        <VStack
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="surface.card"
          borderRadius="md"
          borderWidth="1px"
          borderColor="surface.card"
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
              bg={
                value === option.value
                  ? `${option.color || 'app.primary'}/10`
                  : 'transparent'
              }
              _hover={{
                bg: `${option.color || 'app.primary'}/20`,
              }}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && (
                <Box
                  p={1}
                  bg={`${option.color || 'app.primary'}/10`}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={`${option.color || 'app.primary'}/30`}
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
});

NativeSelectField.displayName = 'NativeSelectField';
