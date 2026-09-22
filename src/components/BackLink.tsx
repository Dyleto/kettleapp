import { Box, HStack, Text } from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import { hitAreaTactile } from './hitArea';

interface BackLinkProps {
  /** Where you are going, not what you are leaving: "Clients", "Programme". */
  label: string;
  onClick: () => void;
}

/**
 * The back link at the top of the screen.
 *
 * Two of the three occurrences were `HStack`s with an `onClick`: no role, not
 * in the tab order, nothing to announce. On the journal, where it was the
 * only path back to the client's programme, the page therefore had no
 * keyboard exit at all.
 */
export const BackLink = ({ label, onClick }: BackLinkProps) => (
  <Box
    as="button"
    onClick={onClick}
    w="fit-content"
    color="fg.muted"
    _hover={{ color: 'app.primary' }}
    transition="color 0.15s"
    css={hitAreaTactile()}
  >
    <HStack gap={1.5}>
      <LuArrowLeft size={13} />
      <Text fontSize="xs" fontWeight="medium">
        {label}
      </Text>
    </HStack>
  </Box>
);
