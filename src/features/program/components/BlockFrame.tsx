import { Box, Flex, HStack, VStack } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { TACTILE } from '@/components/hitArea';
import { Text } from '@chakra-ui/react';
import { SessionBlock } from '@/types';
import {
  BLOCK_ACCENT_COLOR,
  getBlockAccent,
  getBlockLabel,
} from '@/features/program/constants';

interface BlockFrameProps {
  block: SessionBlock;
  /** Free name: text in read mode, a field in edit mode. */
  name?: ReactNode;
  /** Settings: a summary in read mode, controls in edit mode. */
  config?: ReactNode;
  /** Block controls, to the right of the header. Absent in read mode. */
  gutter?: ReactNode;
  /** The exercise rows. */
  children: ReactNode;
  /** The block's instruction: text in read mode, a field in edit mode. */
  notes?: ReactNode;
  /** Below the exercises — "+ exercice" in edit mode. */
  footer?: ReactNode;
}

/**
 * A block's frame, identical whether the coach writes it or the client reads
 * it.
 *
 * The same object used to carry two dressings: a rounded card with background
 * and borders on the client side, a rule and typography in the editor. The
 * coach could not rely on what they saw to know what their client would see,
 * and every new block type was drawn twice.
 *
 * The law kept is the editor's: a rule in the block's accent, typography, and
 * nothing that looks like a box. What changes between the two modes is the
 * content slotted into the placeholders — never the geometry.
 */
export const BlockFrame = ({
  block,
  name,
  config,
  gutter,
  children,
  notes,
  footer,
}: BlockFrameProps) => (
  <Box
    className="group"
    /* A stable anchor for measurements, just like `data-exercise-row` on
       rows: without it a probe has to guess a block's frame by walking up
       the DOM from its title. */
    data-block-type={block.type}
    borderLeftWidth="2px"
    borderLeftColor={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}
    pl={3}
    py={1}
  >
    {/* ── Header: type · free name · settings ── */}
    {/* Its gutter carries 44 px zones, like the one on the first row
        just below: without this spacing the two overlapped by 5 px. */}
    <HStack
      justify="space-between"
      align="flex-start"
      gap={3}
      pb={1}
      /* The 44 px spacing also applies between the header's last row and
         the first exercise row: 4 px separated them, and their zones
         overlapped by 5. */
      css={{ [TACTILE]: { minHeight: '44px', paddingBottom: '12px' } }}
    >
      {/* Title and settings share a flexible column: the settings wrap
          when they no longer fit, rather than push the gutter off screen. */}
      {/* When the title, the name and the settings wrap, two rows of
          controls follow each other 4 px apart — and their 44 px zones
          overlap. Same rule as the gutter: 20 px of gap puts 44 px between
          two centres. */}
      <Flex
        flex={1}
        minW={0}
        wrap="wrap"
        align="baseline"
        gap={2}
        rowGap={1}
        css={{ [TACTILE]: { rowGap: '20px' } }}
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="fg"
          textTransform="uppercase"
          letterSpacing="wider"
          flexShrink={0}
        >
          {getBlockLabel(block.type)}
        </Text>
        {name}
        {config && <Box minW={0}>{config}</Box>}
      </Flex>

      {gutter && (
        <HStack gap={1} flexShrink={0} align="flex-start">
          {gutter}
        </HStack>
      )}
    </HStack>

    <VStack align="stretch" gap={0}>
      {children}
    </VStack>

    {footer && <Box pt={1.5}>{footer}</Box>}
    {/* 4 px is enough for the eye, not for a finger: the instruction
        carries a 44 px zone on touch, which bit 6 px into "+ exercice" just
        above — and the last one in the DOM would have won. */}
    {notes && (
      <Box mt={1} css={{ [TACTILE]: { marginTop: '10px' } }}>
        {notes}
      </Box>
    )}
  </Box>
);
