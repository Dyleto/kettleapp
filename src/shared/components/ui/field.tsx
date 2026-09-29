import { Box, Text, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  flex?: number;
}

/**
 * Une étiquette au-dessus d'un champ, et l'astérisque quand il est requis.
 *
 * Le `Field` de Chakra apporte une machinerie d'états de validation dont
 * aucun formulaire de Kettle ne se sert : les erreurs remontent en toast,
 * pas sous le champ. Celui-ci ne fait que la mise en forme.
 */
export const Field = ({ label, required, children, flex }: FieldProps) => {
  return (
    <VStack align="start" gap={1} width="100%" flex={flex}>
      <Text fontSize="sm" fontWeight="medium">
        {label}
        {required && (
          <Text as="span" color="app.error">
            {' '}
            *
          </Text>
        )}
      </Text>
      <Box width="100%">{children}</Box>
    </VStack>
  );
};
